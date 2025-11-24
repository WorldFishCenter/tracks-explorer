import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useTranslation } from 'react-i18next';
import { IconLock, IconCheck, IconAlertTriangle, IconCalendar, IconChartBar } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  // Edit mode state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form state
  const [country, setCountry] = useState('');
  const [vesselType, setVesselType] = useState('');
  const [mainGearType, setMainGearType] = useState('');
  const [boatName, setBoatName] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User statistics state
  const [totalCatchReports, setTotalCatchReports] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState(false);

  // Predefined lists (same as RegistrationModal)
  const countries = ['Tanzania', 'Zanzibar', 'Mozambique', 'Kenya'];
  const vesselTypes = [
    'Motorized Boat',
    'Dhow',
    'Raft',
    'Dugout Canoe',
    'Wooden Boat',
    'Planked Canoe',
    'Outrigger Canoe',
    'Flat Boat',
    'Surf Board',
    'Other',
    'Feet'
  ];
  const gearTypes = [
    'Nets',
    'Lines & Hooks',
    'Traps',
    'Spears & Harpoons',
    'Other'
  ];

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/users/${currentUser.id}`);

        if (!response.ok) {
          throw new Error('Failed to load profile');
        }

        const userData = await response.json();

        // Set form fields from user data
        setCountry(userData.Country || '');
        setVesselType(userData.vessel_type || '');
        setMainGearType(userData.main_gear_type || '');
        setBoatName(userData.Boat || '');
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(t('profile.errorLoadingProfile'));
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [currentUser, t]);

  // Load user statistics
  useEffect(() => {
    const loadUserStats = async () => {
      if (!currentUser) return;

      try {
        setStatsLoading(true);
        const identifier = currentUser.imeis?.[0] || currentUser.username || '';

        if (!identifier) return;

        const response = await fetch(`/api/catch-events/user/${identifier}`);

        if (response.ok) {
          const events = await response.json();
          setTotalCatchReports(events.length);
        }
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    loadUserStats();
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);

      const response = await fetch(`/api/users/${currentUser?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Country: country,
          vessel_type: vesselType,
          main_gear_type: mainGearType,
          Boat: vesselType !== 'Feet' ? boatName : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess(t('profile.profileUpdated'));
      setIsEditingProfile(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : t('profile.errorUpdatingProfile'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (newPassword.length < 6) {
      setError(t('profile.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError(t('profile.passwordsDoNotMatch'));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/users/${currentUser?.id}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess(t('profile.passwordChanged'));
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err instanceof Error ? err.message : t('profile.errorUpdatingProfile'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setError(null);
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError(null);
  };

  // Calculate member since date
  const getMemberSinceDate = () => {
    return format(new Date(), 'MMMM dd, yyyy');
  };

  // Create the page header
  const pageHeader = (
    <div className="page-header d-print-none">
      <div className="container-xl">
        <h2 className="page-title">{t('profile.title')}</h2>
      </div>
    </div>
  );

  const isBoatNameRequired = vesselType !== 'Feet';

  return (
    <MainLayout pageHeader={pageHeader}>
      {/* Success/Error Alerts */}
      {success && (
        <div className="alert alert-success" role="alert">
          <div className="d-flex">
            <div>
              <IconCheck className="me-2" />
            </div>
            <div>{success}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <div className="d-flex">
            <div>
              <IconAlertTriangle className="me-2" />
            </div>
            <div>{error}</div>
          </div>
        </div>
      )}

      <div className="row row-cards">
        {/* Account Overview Card */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{t('profile.accountInfo')}</h3>
            </div>
            <div className="list-group list-group-flush">
              <div className="list-group-item">
                <div className="row align-items-center">
                  <div className="col-auto">
                    <span className="avatar">{currentUser?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="col">
                    <div className="text-truncate">
                      <strong>{currentUser?.username || currentUser?.name || '-'}</strong>
                    </div>
                    <div className="text-muted small">{t('profile.username')}</div>
                  </div>
                </div>
              </div>
              <div className="list-group-item">
                <div className="row">
                  <div className="col">
                    <div className="text-muted small">{t('profile.accountType')}</div>
                    <div className="mt-1">
                      {(currentUser?.hasImei === true || (currentUser?.hasImei !== false && (currentUser?.imeis?.length ?? 0) > 0)) ? (
                        <span className="badge bg-primary-lt text-primary">{t('profile.pdsUser')}</span>
                      ) : (
                        <span className="badge bg-info-lt text-info">{t('profile.nonPdsUser')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="list-group-item">
                <div className="row">
                  <div className="col">
                    <div className="text-muted small">{t('profile.memberSince')}</div>
                    <div className="mt-1">
                      <IconCalendar size={16} className="me-1" />
                      {getMemberSinceDate()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{t('profile.statistics')}</h3>
            </div>
            <div className="card-body">
              {statsLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
              ) : (
                <div className="row">
                  <div className="col">
                    <div className="subheader">{t('profile.totalCatchReports')}</div>
                    <div className="h1 mb-0">{totalCatchReports}</div>
                  </div>
                  <div className="col-auto">
                    <IconChartBar size={48} className="text-muted" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Registration Details Card */}
        <div className="col-12">
          <form onSubmit={handleUpdateProfile} className="card">
            <div className="card-header">
              <h3 className="card-title">{t('profile.registrationDetails')}</h3>
              {!isEditingProfile && !isChangingPassword && (
                <div className="card-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    {t('profile.editProfile')}
                  </button>
                </div>
              )}
            </div>
            <div className="card-body">
              <div className="row g-3">
                {/* Country */}
                <div className="col-md-6">
                  <label className="form-label required">
                    {t('profile.country')}
                  </label>
                  {isEditingProfile ? (
                    <select
                      className="form-select"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      disabled={loading}
                      required
                    >
                      <option value="">{t('auth.registration.selectCountry')}</option>
                      {countries.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="form-control-plaintext">{country || '-'}</div>
                  )}
                </div>

                {/* Vessel Type */}
                <div className="col-md-6">
                  <label className="form-label required">
                    {t('profile.vesselType')}
                  </label>
                  {isEditingProfile ? (
                    <select
                      className="form-select"
                      value={vesselType}
                      onChange={(e) => setVesselType(e.target.value)}
                      disabled={loading}
                      required
                    >
                      <option value="">{t('auth.registration.selectVesselType')}</option>
                      {vesselTypes.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="form-control-plaintext">{vesselType || '-'}</div>
                  )}
                </div>

                {/* Boat Name */}
                <div className="col-md-6">
                  <label className={`form-label ${isBoatNameRequired && isEditingProfile ? 'required' : ''}`}>
                    {t('profile.boatName')}
                  </label>
                  {isEditingProfile ? (
                    <>
                      <input
                        type="text"
                        className="form-control"
                        value={boatName}
                        onChange={(e) => setBoatName(e.target.value)}
                        disabled={loading || !isBoatNameRequired}
                        required={isBoatNameRequired}
                        placeholder={
                          isBoatNameRequired
                            ? t('auth.registration.boatNamePlaceholder')
                            : t('profile.noBoatName')
                        }
                      />
                      {!isBoatNameRequired && (
                        <div className="form-hint">{t('auth.registration.boatNameNotRequired')}</div>
                      )}
                    </>
                  ) : (
                    <div className="form-control-plaintext">{boatName || t('profile.noBoatName')}</div>
                  )}
                </div>

                {/* Main Gear Type */}
                <div className="col-md-6">
                  <label className="form-label required">
                    {t('profile.mainGearType')}
                  </label>
                  {isEditingProfile ? (
                    <select
                      className="form-select"
                      value={mainGearType}
                      onChange={(e) => setMainGearType(e.target.value)}
                      disabled={loading}
                      required
                    >
                      <option value="">{t('auth.registration.selectGearType')}</option>
                      {gearTypes.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="form-control-plaintext">{mainGearType || '-'}</div>
                  )}
                </div>
              </div>
            </div>
            {isEditingProfile && (
              <div className="card-footer text-end">
                <button
                  type="button"
                  className="btn btn-link link-secondary me-2"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? t('profile.saving') : t('common.save')}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Password Change Card */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{t('profile.password')}</h3>
              {!isChangingPassword && !isEditingProfile && (
                <div className="card-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    {t('profile.changePassword')}
                  </button>
                </div>
              )}
            </div>
            {isChangingPassword && (
              <form onSubmit={handleChangePassword}>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label required">{t('profile.currentPassword')}</label>
                      <div className="input-group input-group-flat">
                        <span className="input-group-text">
                          <IconLock size={18} stroke={1.5} />
                        </span>
                        <input
                          type="password"
                          className="form-control"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label required">{t('profile.newPassword')}</label>
                      <div className="input-group input-group-flat">
                        <span className="input-group-text">
                          <IconLock size={18} stroke={1.5} />
                        </span>
                        <input
                          type="password"
                          className="form-control"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={loading}
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="form-hint">{t('auth.registration.passwordHint')}</div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label required">{t('profile.confirmNewPassword')}</label>
                      <div className="input-group input-group-flat">
                        <span className="input-group-text">
                          <IconLock size={18} stroke={1.5} />
                        </span>
                        <input
                          type="password"
                          className="form-control"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer text-end">
                  <button
                    type="button"
                    className="btn btn-link link-secondary me-2"
                    onClick={handleCancelPasswordChange}
                    disabled={loading}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? t('profile.saving') : t('profile.changePassword')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
