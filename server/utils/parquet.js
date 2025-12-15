import path from 'path';
import os from 'os';
import fs from 'fs';
import { promises as fsp } from 'fs';
import { fileURLToPath } from 'url';
import { tableFromIPC } from 'apache-arrow';
import { initSync, readParquet } from 'parquet-wasm/esm';
import { Storage } from '@google-cloud/storage';

// Get current file directory for proper relative path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const FALLBACK_DIR = path.join(os.tmpdir(), 'fallback_tracks');
const FALLBACK_CACHE_NAME = 'latest.parquet';
const FALLBACK_BUCKET = process.env.FALLBACK_PARQUET_BUCKET;
const FALLBACK_OBJECT = process.env.FALLBACK_PARQUET_OBJECT;

// Initialize parquet-wasm once to avoid repeated WASM loading
let parquetInitialized = false;

/**
 * Initialize parquet-wasm if not already initialized
 */
export function initParquet() {
  if (parquetInitialized) return;
  const wasmPath = path.join(__dirname, '..', '..', 'node_modules', 'parquet-wasm', 'esm', 'parquet_wasm_bg.wasm');
  const wasmBytes = fs.readFileSync(wasmPath);
  initSync({ module: wasmBytes });
  parquetInitialized = true;
}

// GCS client (optional, only if GCP_SA_KEY is provided)
let storageClient = null;

/**
 * Get or create GCS storage client
 * @returns {Storage|null} Storage client or null if not configured
 */
export function getStorageClient() {
  if (storageClient) return storageClient;
  const saKey = process.env.GCP_SA_KEY;
  if (!saKey) return null;
  try {
    const credentials = JSON.parse(saKey);
    storageClient = new Storage({ credentials });
    return storageClient;
  } catch (err) {
    console.error('Failed to parse GCP_SA_KEY for Storage client:', err);
    return null;
  }
}

/**
 * Ensure fallback directory exists
 */
async function ensureFallbackDir() {
  try {
    await fsp.mkdir(FALLBACK_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create fallback directory:', err);
  }
}

/**
 * Resolve parquet path: prefer latest local file; otherwise download from env URL once and cache
 * @returns {Promise<string|null>} Path to parquet file or null if unavailable
 */
export async function getParquetPath() {
  await ensureFallbackDir();

  const existingFiles = fs.readdirSync(FALLBACK_DIR)
    .filter(name => name.endsWith('.parquet'))
    .map(name => path.join(FALLBACK_DIR, name));

  if (existingFiles.length) {
    const latestFile = existingFiles
      .map(file => ({ file, mtime: fs.statSync(file).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)[0].file;
    return latestFile;
  }

  // Try signed URL if provided
  const fallbackUrl = process.env.FALLBACK_PARQUET_URL;
  if (fallbackUrl) {
    try {
      console.log('Downloading fallback parquet from URL:', fallbackUrl);
      const resp = await fetch(fallbackUrl);
      if (!resp.ok) {
        console.error('Failed to download fallback parquet:', resp.status, resp.statusText);
      } else {
        const buffer = Buffer.from(await resp.arrayBuffer());
        const cachedPath = path.join(FALLBACK_DIR, FALLBACK_CACHE_NAME);
        await fsp.writeFile(cachedPath, buffer);
        console.log('Cached fallback parquet to', cachedPath);
        return cachedPath;
      }
    } catch (err) {
      console.error('Error downloading fallback parquet:', err);
    }
  }

  // Otherwise try GCS download with service account
  const storage = getStorageClient();
  if (storage && FALLBACK_BUCKET && FALLBACK_OBJECT) {
    try {
      const cachedPath = path.join(FALLBACK_DIR, FALLBACK_CACHE_NAME);
      await storage.bucket(FALLBACK_BUCKET).file(FALLBACK_OBJECT).download({ destination: cachedPath });
      console.log(`Downloaded fallback parquet from gs://${FALLBACK_BUCKET}/${FALLBACK_OBJECT} to ${cachedPath}`);
      return cachedPath;
    } catch (err) {
      console.error('Error downloading fallback parquet from GCS:', err);
    }
  }

  console.warn('No fallback parquet available: no local cache, no URL, no GCS bucket/object or credentials.');
  return null;
}

/**
 * Read and parse parquet file to Arrow table
 * @param {string} parquetPath - Path to parquet file
 * @returns {Promise<import('apache-arrow').Table>} Arrow table
 */
export async function readParquetToArrow(parquetPath) {
  initParquet();
  const fileBuffer = fs.readFileSync(parquetPath);
  const parquetTable = await readParquet(fileBuffer);
  const ipcStream = parquetTable.intoIPCStream();
  return tableFromIPC(ipcStream);
}
