import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchLiveLocations } from '../api/pelagicDataService';
import { LiveLocation } from '../types';
import { formatDateTime } from '../utils/formatters';

interface BoatSelectionModalProps {
  onSelect: (imei: string) => void;
  onClose: () => void;
}

const BoatSelectionModal: React.FC<BoatSelectionModalProps> = ({ onSelect, onClose }) => {
  const { t } = useTranslation();
  const [boats, setBoats] = useState<LiveLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBoats = async () => {
      try {
        setLoading(true);
        const data = await fetchLiveLocations();
        setBoats(data);
      } catch (err) {
        console.error('Error loading vessels:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBoats();
  }, []);

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">{t('navigation.selectBoat')}</h3>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{t('common.loading')}</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>{t('vessel.name')}</th>
                      <th>{t('vessel.imei')}</th>
                      <th>{t('vessel.lastPosition')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boats.map((boat) => (
                      <tr key={boat.imei} style={{ cursor: 'pointer' }} onClick={() => onSelect(boat.imei)}>
                        <td>{boat.boatName || t('common.unknown')}</td>
                        <td>{boat.imei}</td>
                        <td>{boat.lastSeen ? formatDateTime(new Date(boat.lastSeen)) : t('common.never')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoatSelectionModal;
