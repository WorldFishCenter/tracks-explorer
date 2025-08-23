import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconCamera, IconPhoto, IconX } from '@tabler/icons-react';

interface PhotoSectionProps {
  catchEntryId: string;
  photos: string[];
  fishGroup: string;
  loading: boolean;
  isDarkMode: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (catchEntryId: string, file: File) => void;
  onTriggerFileInput: (catchEntryId: string) => void;
  onRemovePhoto: (catchEntryId: string, photoIndex: number) => void;
  onSetRef: (el: HTMLInputElement | null) => void;
}

const PhotoSection: React.FC<PhotoSectionProps> = ({
  catchEntryId,
  photos,
  fishGroup,
  loading,
  isDarkMode,
  fileInputRef,
  onFileUpload,
  onTriggerFileInput,
  onRemovePhoto,
  onSetRef
}) => {
  const { t } = useTranslation();
  
  // Debug logging
  console.log(`📸 PhotoSection render for ${catchEntryId}:`, {
    photosCount: photos.length,
    photos: photos,
    loading,
    fishGroup
  });

  const handleFullSizeView = (photo: string) => {
    const modal = document.createElement('div');
    modal.className = 'modal d-block';
    modal.style.backgroundColor = isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)';
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-body p-0">
            <img src="${photo}" class="img-fluid w-100" alt="${t('catch.photoOf')} ${t(`catch.fishGroups.${fishGroup.replace(/[^a-zA-Z]/g, '')}`)}" />
          </div>
        </div>
      </div>
    `;
    modal.onclick = () => document.body.removeChild(modal);
    document.body.appendChild(modal);
  };

  return (
    <div className="row g-2 mb-3">
      {/* Camera Button (for taking new photos) */}
      <div className="col-6">
        <button
          type="button"
          className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center"
          onClick={() => {
            console.log('📷 Camera button clicked');
            const cameraInput = document.getElementById(`camera-input-${catchEntryId}`) as HTMLInputElement;
            cameraInput?.click();
          }}
          disabled={loading || photos.length >= 3}
          style={{ minHeight: '50px', fontSize: '14px', padding: '8px 12px' }}
        >
          <IconCamera size={20} className="me-1" />
          <span>{t('catch.takePhoto')}</span>
        </button>
      </div>
      
      {/* Gallery Button (for selecting existing photos) */}
      <div className="col-6">
        <button
          type="button"
          className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center"
          onClick={() => {
            console.log('🖼️ Gallery button clicked');
            const galleryInput = document.getElementById(`gallery-input-${catchEntryId}`) as HTMLInputElement;
            galleryInput?.click();
          }}
          disabled={loading || photos.length >= 3}
          style={{ minHeight: '50px', fontSize: '14px', padding: '8px 12px' }}
        >
          <IconPhoto size={20} className="me-1" />
          <span>{t('catch.gallery')}</span>
        </button>
      </div>
      
      {/* Hidden camera input (capture=environment for direct camera access) */}
      <input
        id={`camera-input-${catchEntryId}`}
        ref={(el) => {
          onSetRef(el);
          if (fileInputRef) {
            (fileInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          }
        }}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          console.log('📷 Camera input onChange triggered');
          const file = e.target.files?.[0];
          console.log('📁 Camera selected file:', file);
          if (file) {
            console.log('✅ Camera file selected, calling onFileUpload');
            onFileUpload(catchEntryId, file);
            e.target.value = ''; // Reset input
          } else {
            console.log('❌ No camera file selected');
          }
        }}
      />
      
      {/* Hidden gallery input (no capture attribute for gallery access) */}
      <input
        id={`gallery-input-${catchEntryId}`}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          console.log('🖼️ Gallery input onChange triggered');
          const file = e.target.files?.[0];
          console.log('📁 Gallery selected file:', file);
          if (file) {
            console.log('✅ Gallery file selected, calling onFileUpload');
            onFileUpload(catchEntryId, file);
            e.target.value = ''; // Reset input
          } else {
            console.log('❌ No gallery file selected');
          }
        }}
      />
      
      {/* Photo Preview Grid */}
      {photos.length > 0 ? (
        <div className="row g-2 mb-3">
          {photos.map((photo, photoIndex) => (
            <div key={photoIndex} className="col-4 col-sm-3 col-md-2">
              <div className="position-relative">
                <img
                  src={photo}
                  alt={`${t('catch.photoOf')} ${t(`catch.fishGroups.${fishGroup.replace(/[^a-zA-Z]/g, '')}`)}`}
                  className="img-fluid rounded"
                  style={{
                    width: '100%',
                    height: '80px',
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleFullSizeView(photo)}
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 p-1 lh-1"
                  onClick={() => onRemovePhoto(catchEntryId, photoIndex)}
                  disabled={loading}
                  title={t('catch.removePhoto')}
                  style={{ 
                    width: '32px', 
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px'
                  }}
                >
                  <IconX size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted small">
          {t('catch.noPhotosAdded')}
        </div>
      )}
    </div>
  );
};

export default React.memo(PhotoSection);