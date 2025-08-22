import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconCamera, IconX } from '@tabler/icons-react';

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
      <div className="col-12">
        <button
          type="button"
          className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center position-relative"
          onClick={() => onTriggerFileInput(catchEntryId)}
          disabled={loading || photos.length >= 3}
          style={{ minHeight: '50px', fontSize: '15px', padding: '12px 16px' }}
        >
          <IconCamera size={24} className="me-2" />
          <span>{t('catch.uploadPhoto')}</span>
          <span className="badge bg-warning text-dark position-absolute top-0 end-0 translate-middle-y me-2" style={{ fontSize: '10px', padding: '2px 6px' }}>
            BETA
          </span>
        </button>
      </div>
      
      <input
        ref={(el) => {
          onSetRef(el);
          if (fileInputRef) {
            (fileInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          }
        }}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          console.log('🎬 File input onChange triggered');
          const file = e.target.files?.[0];
          console.log('📁 Selected file:', file);
          if (file) {
            console.log('✅ File selected, calling onFileUpload');
            onFileUpload(catchEntryId, file);
            e.target.value = ''; // Reset input
          } else {
            console.log('❌ No file selected');
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
                  style={{ width: '24px', height: '24px' }}
                >
                  <IconX size={12} />
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