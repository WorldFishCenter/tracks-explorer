import { Router } from 'express';
import { getParquetPath, readParquetToArrow } from '../utils/parquet.js';

const router = Router();

/**
 * Fallback endpoint to serve trip points from local Parquet snapshots when the upstream API fails.
 * Downloads/caches the latest .parquet snapshot (Trip, Time, Lat, Lng) to a temp dir,
 * filters by date range and IMEIs, and returns TripPoint-like JSON.
 */
router.get('/points', async (req, res) => {
  const { dateFrom, dateTo, imeis } = req.query;

  if (!dateFrom || !dateTo) {
    return res.status(400).json({ error: 'dateFrom and dateTo are required (YYYY-MM-DD)' });
  }

  try {
    const parquetPath = await getParquetPath();
    if (!parquetPath) {
      return res.status(404).json({ error: 'No fallback parquet file available (local or download)' });
    }

    // Read parquet with parquet-wasm and convert to Arrow table
    const arrowTable = await readParquetToArrow(parquetPath);

    const fromTs = new Date(dateFrom).getTime();
    const toTs = new Date(dateTo).getTime();
    const imeiSet = imeis ? new Set(String(imeis).split(',').map(s => s.trim()).filter(Boolean)) : null;

    const tripCol = arrowTable.getChild('Trip');
    const timeCol = arrowTable.getChild('Time');
    const latCol = arrowTable.getChild('Lat');
    const lngCol = arrowTable.getChild('Lng');
    const imeiCol = arrowTable.getChild('IMEI') || arrowTable.getChild('imei');

    if (!tripCol || !timeCol || !latCol || !lngCol) {
      return res.status(500).json({ error: 'Fallback parquet missing required columns (Trip, Time, Lat, Lng)' });
    }

    if (imeiSet && !imeiCol) {
      console.warn('Fallback parquet missing IMEI column; cannot filter by IMEI');
      console.warn('Returning all points for date range - frontend should filter by trip if needed');
    }

    const points = [];
    const rowCount = arrowTable.numRows ?? 0;

    for (let i = 0; i < rowCount; i++) {
      const rawTime = timeCol.get(i);
      const ts = rawTime !== null && rawTime !== undefined
        ? new Date(rawTime).getTime()
        : NaN;
      if (Number.isNaN(ts) || ts < fromTs || ts > toTs) continue;

      const timeStr = new Date(ts).toISOString();
      const recordImei = imeiCol ? imeiCol.get(i) : undefined;
      const recordImeiStr = recordImei !== undefined && recordImei !== null ? String(recordImei) : undefined;
      if (imeiSet && (!recordImeiStr || !imeiSet.has(recordImeiStr))) {
        continue;
      }

      points.push({
        time: timeStr,
        timestamp: timeStr,
        boat: '',
        tripId: String(tripCol.get(i) ?? ''),
        latitude: Number(latCol.get(i) ?? 0),
        longitude: Number(lngCol.get(i) ?? 0),
        speed: 0,
        range: 0,
        heading: 0,
        boatName: '',
        community: '',
        tripCreated: '',
        tripUpdated: '',
        imei: recordImeiStr,
        deviceId: recordImeiStr,
        lastSeen: timeStr
      });
    }

    res.json(points);
  } catch (error) {
    console.error('Error serving fallback parquet points:', error);
    res.status(500).json({ error: 'Failed to read fallback parquet file' });
  }
});

export default router;
