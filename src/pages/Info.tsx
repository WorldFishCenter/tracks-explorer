import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { useTranslation } from 'react-i18next';
import {
  IconInfoCircle,
  IconMap,
  IconFish,
  IconChartBar,
  IconBulb,
  IconTrendingUp,
  IconClock,
  IconUsers,
  IconPhoto,
  IconMapPin,
  IconLanguage,
  IconCircleCheck,
  IconLogin,
  IconCalendar,
  IconTarget,
  IconAward,
  IconChevronDown,
  IconUserPlus,
  IconCurrentLocation,
  IconMathMaxMin,
  IconUserCog
} from '@tabler/icons-react';

const Info: React.FC = () => {
  const { t } = useTranslation();

  const pageHeader = (
    <div className="page-header d-print-none">
      <div className="container-xl">
        <h2 className="page-title mb-0 mt-0">
          <IconInfoCircle className="me-2" size={32} />
          {t('info.title')}
        </h2>
      </div>
    </div>
  );

  return (
    <MainLayout pageHeader={pageHeader}>
      <div className="row g-4">
        {/* Hero Welcome Section */}
        <div className="col-12">
          <div className="card card-lg bg-primary-lt">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <IconBulb size={48} className="text-primary" />
                </div>
                <div className="col">
                  <h3 className="mb-1">{t('info.welcome.title')}</h3>
                  <p className="text-secondary mb-0">{t('info.welcome.subtitle')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <IconLogin className="me-2" />
                {t('info.gettingStarted.title')}
              </h3>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-12">
                  <div className="mb-2">
                    <IconUserPlus className="me-2" size={20} />
                    <strong>1. {t('info.gettingStarted.step1Title')}</strong>
                  </div>
                  <div className="text-secondary">{t('info.gettingStarted.step1Desc')}</div>
                </div>
                <div className="col-12">
                  <div className="mb-2">
                    <strong>2. {t('info.gettingStarted.step2Title')}</strong>
                  </div>
                  <div className="text-secondary">{t('info.gettingStarted.step2Desc')}</div>
                </div>
                <div className="col-12">
                  <div className="mb-2">
                    <IconLanguage className="me-2" size={20} />
                    <strong>3. {t('info.gettingStarted.step3Title')}</strong>
                  </div>
                  <div className="text-secondary">{t('info.gettingStarted.step3Desc')}</div>
                </div>
                <div className="col-12">
                  <div className="mb-2">
                    <strong>4. {t('info.gettingStarted.step4Title')}</strong>
                  </div>
                  <div className="text-secondary">{t('info.gettingStarted.step4Desc')}</div>
                </div>
                <div className="col-12">
                  <div className="alert alert-info mb-0">
                    <div className="d-flex">
                      <IconCircleCheck className="me-2 flex-shrink-0" size={20} />
                      <div>
                        <strong>{t('info.gettingStarted.refreshTitle')}</strong>
                        <div className="text-secondary mt-1">{t('info.gettingStarted.refreshDesc')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Features - Accordion */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{t('info.features.title')}</h3>
            </div>
            <div className="list-group list-group-flush">
              <div className="accordion" id="featuresAccordion">

                {/* Feature 1: View Fishing Trips */}
                <div className="accordion-item">
                  <div className="accordion-header">
                    <button
                      className="accordion-button"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseTrips"
                      aria-expanded="true"
                    >
                      <IconMap className="me-2" size={20} />
                      {t('info.features.viewTrips.title')}
                      <div className="accordion-button-toggle">
                        <IconChevronDown size={16} />
                      </div>
                    </button>
                  </div>
                  <div
                    id="collapseTrips"
                    className="accordion-collapse collapse show"
                    data-bs-parent="#featuresAccordion"
                  >
                    <div className="accordion-body pt-0">
                      <ul className="list-unstyled mb-3">
                        <li className="mb-2">
                          <IconCircleCheck className="text-success me-2" size={20} />
                          {t('info.features.viewTrips.point1')}
                        </li>
                        <li className="mb-2">
                          <IconCircleCheck className="text-success me-2" size={20} />
                          {t('info.features.viewTrips.point2')}
                        </li>
                        <li className="mb-2">
                          <IconCircleCheck className="text-success me-2" size={20} />
                          {t('info.features.viewTrips.point3')}
                        </li>
                      </ul>
                      <div className="alert alert-info mb-0">
                        <div className="d-flex">
                          <IconCalendar className="me-2 flex-shrink-0" size={20} />
                          <div>{t('info.features.viewTrips.tip')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 2: Report Catches */}
                <div className="accordion-item">
                  <div className="accordion-header">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseCatch"
                      aria-expanded="false"
                    >
                      <IconFish className="me-2" size={20} />
                      {t('info.features.reportCatch.title')}
                      <div className="accordion-button-toggle">
                        <IconChevronDown size={16} />
                      </div>
                    </button>
                  </div>
                  <div
                    id="collapseCatch"
                    className="accordion-collapse collapse"
                    data-bs-parent="#featuresAccordion"
                  >
                    <div className="accordion-body pt-0">
                      <div className="mb-3">
                        <h4 className="h5">{t('info.features.reportCatch.whenTitle')}</h4>
                        <p className="text-secondary">{t('info.features.reportCatch.whenDesc')}</p>
                      </div>
                      <div className="mb-3">
                        <h4 className="h5">{t('info.features.reportCatch.whatTitle')}</h4>
                        <ul className="mb-2">
                          <li>{t('info.features.reportCatch.whatPoint1')}</li>
                          <li>{t('info.features.reportCatch.whatPoint2')}</li>
                          <li>{t('info.features.reportCatch.whatPoint3')}</li>
                        </ul>
                      </div>
                      <div className="mb-3">
                        <h4 className="h5">
                          <IconPhoto className="me-2" size={20} />
                          {t('info.features.reportCatch.photosTitle')}
                        </h4>
                        <p className="text-secondary mb-0">{t('info.features.reportCatch.photosDesc')}</p>
                      </div>
                      <div className="alert alert-success mb-0">
                        <div className="fw-bold mb-1">{t('info.features.reportCatch.whyTitle')}</div>
                        <div>{t('info.features.reportCatch.whyDesc')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 3: My Stats */}
                <div className="accordion-item">
                  <div className="accordion-header">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseStats"
                      aria-expanded="false"
                    >
                      <IconChartBar className="me-2" size={20} />
                      {t('info.features.myStats.title')}
                      <div className="accordion-button-toggle">
                        <IconChevronDown size={16} />
                      </div>
                    </button>
                  </div>
                  <div
                    id="collapseStats"
                    className="accordion-collapse collapse"
                    data-bs-parent="#featuresAccordion"
                  >
                    <div className="accordion-body pt-0">
                      <ul className="list-unstyled mb-3">
                        <li className="mb-2">
                          <IconTrendingUp className="text-muted me-2" size={20} />
                          {t('info.features.myStats.point1')}
                        </li>
                        <li className="mb-2">
                          <IconUsers className="text-muted me-2" size={20} />
                          {t('info.features.myStats.point2')}
                        </li>
                        <li className="mb-2">
                          <IconAward className="text-muted me-2" size={20} />
                          {t('info.features.myStats.point3')}
                        </li>
                        <li className="mb-2">
                          <IconTarget className="text-muted me-2" size={20} />
                          {t('info.features.myStats.point4')}
                        </li>
                      </ul>
                      <div className="alert alert-info mb-0">
                        <div className="fw-bold mb-1">{t('info.features.myStats.benefitTitle')}</div>
                        <div>{t('info.features.myStats.benefitDesc')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 4: Live Location */}
                <div className="accordion-item">
                  <div className="accordion-header">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseLocation"
                      aria-expanded="false"
                    >
                      <IconMapPin className="me-2" size={20} />
                      {t('info.features.liveLocation.title')}
                      <div className="accordion-button-toggle">
                        <IconChevronDown size={16} />
                      </div>
                    </button>
                  </div>
                  <div
                    id="collapseLocation"
                    className="accordion-collapse collapse"
                    data-bs-parent="#featuresAccordion"
                  >
                    <div className="accordion-body pt-0">
                      <ul className="list-unstyled mb-0">
                        <li className="mb-2">
                          <IconCircleCheck className="text-muted me-2" size={20} />
                          {t('info.features.liveLocation.point1')}
                        </li>
                        <li className="mb-2">
                          <IconCircleCheck className="text-muted me-2" size={20} />
                          {t('info.features.liveLocation.point2')}
                        </li>
                        <li className="mb-2">
                          <IconCircleCheck className="text-muted me-2" size={20} />
                          {t('info.features.liveLocation.point3')}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Feature 5: Profile Management */}
                <div className="accordion-item">
                  <div className="accordion-header">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseProfile"
                      aria-expanded="false"
                    >
                      <IconUserCog className="me-2" size={20} />
                      {t('info.features.profile.title')}
                      <div className="accordion-button-toggle">
                        <IconChevronDown size={16} />
                      </div>
                    </button>
                  </div>
                  <div
                    id="collapseProfile"
                    className="accordion-collapse collapse"
                    data-bs-parent="#featuresAccordion"
                  >
                    <div className="accordion-body pt-0">
                      <ul className="list-unstyled mb-0">
                        <li className="mb-2">
                          <IconCircleCheck className="text-muted me-2" size={20} />
                          {t('info.features.profile.point1')}
                        </li>
                        <li className="mb-2">
                          <IconCircleCheck className="text-muted me-2" size={20} />
                          {t('info.features.profile.point2')}
                        </li>
                        <li className="mb-2">
                          <IconCircleCheck className="text-muted me-2" size={20} />
                          {t('info.features.profile.point3')}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Feature 6: GPS Location (Non-PDS Users) */}
                <div className="accordion-item">
                  <div className="accordion-header">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseGPS"
                      aria-expanded="false"
                    >
                      <IconCurrentLocation className="me-2" size={20} />
                      {t('info.features.gpsLocation.title')}
                      <div className="accordion-button-toggle">
                        <IconChevronDown size={16} />
                      </div>
                    </button>
                  </div>
                  <div
                    id="collapseGPS"
                    className="accordion-collapse collapse"
                    data-bs-parent="#featuresAccordion"
                  >
                    <div className="accordion-body pt-0">
                      <div className="mb-3">
                        <p className="text-secondary">{t('info.features.gpsLocation.desc')}</p>
                      </div>
                      <ul className="list-unstyled mb-0">
                        <li className="mb-2">
                          <IconCircleCheck className="text-muted me-2" size={20} />
                          {t('info.features.gpsLocation.point1')}
                        </li>
                        <li className="mb-2">
                          <IconCircleCheck className="text-muted me-2" size={20} />
                          {t('info.features.gpsLocation.point2')}
                        </li>
                        <li className="mb-2">
                          <IconCircleCheck className="text-muted me-2" size={20} />
                          {t('info.features.gpsLocation.point3')}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Feature 7: Bathymetry */}
                <div className="accordion-item">
                  <div className="accordion-header">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseBathymetry"
                      aria-expanded="false"
                    >
                      <IconMathMaxMin className="me-2" size={20} />
                      {t('info.features.bathymetry.title')}
                      <div className="accordion-button-toggle">
                        <IconChevronDown size={16} />
                      </div>
                    </button>
                  </div>
                  <div
                    id="collapseBathymetry"
                    className="accordion-collapse collapse"
                    data-bs-parent="#featuresAccordion"
                  >
                    <div className="accordion-body pt-0">
                      <div className="mb-3">
                        <p className="text-secondary">{t('info.features.bathymetry.desc')}</p>
                      </div>
                      <ul className="list-unstyled mb-3">
                        <li className="mb-2">
                          <IconCircleCheck className="text-muted me-2" size={20} />
                          {t('info.features.bathymetry.point1')}
                        </li>
                        <li className="mb-2">
                          <IconCircleCheck className="text-muted me-2" size={20} />
                          {t('info.features.bathymetry.point2')}
                        </li>
                        <li className="mb-2">
                          <IconCircleCheck className="text-muted me-2" size={20} />
                          {t('info.features.bathymetry.point3')}
                        </li>
                      </ul>
                      <div className="alert alert-info mb-0">
                        <div className="fw-bold mb-1">{t('info.features.bathymetry.tipTitle')}</div>
                        <div>{t('info.features.bathymetry.tipDesc')}</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <IconBulb className="me-2" />
                {t('info.tips.title')}
              </h3>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="d-flex">
                    <div className="me-3">
                      <IconFish className="text-primary" size={24} />
                    </div>
                    <div>
                      <h4 className="h5 mb-1">{t('info.tips.tip1Title')}</h4>
                      <p className="text-secondary mb-0">{t('info.tips.tip1Desc')}</p>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex">
                    <div className="me-3">
                      <IconPhoto className="text-primary" size={24} />
                    </div>
                    <div>
                      <h4 className="h5 mb-1">{t('info.tips.tip2Title')}</h4>
                      <p className="text-secondary mb-0">{t('info.tips.tip2Desc')}</p>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex">
                    <div className="me-3">
                      <IconClock className="text-primary" size={24} />
                    </div>
                    <div>
                      <h4 className="h5 mb-1">{t('info.tips.tip3Title')}</h4>
                      <p className="text-secondary mb-0">{t('info.tips.tip3Desc')}</p>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="d-flex">
                    <div className="me-3">
                      <IconTrendingUp className="text-primary" size={24} />
                    </div>
                    <div>
                      <h4 className="h5 mb-1">{t('info.tips.tip4Title')}</h4>
                      <p className="text-secondary mb-0">{t('info.tips.tip4Desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Understanding Your Data */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <IconTrendingUp size={32} className="text-primary me-2" />
                <h3 className="mb-0">{t('info.understanding.title')}</h3>
              </div>
              <div className="row">
                <div className="col-12 col-md-4 mb-3 mb-md-0">
                  <div className="fw-bold text-primary mb-1">{t('info.understanding.point1Title')}</div>
                  <div className="text-secondary small">{t('info.understanding.point1Desc')}</div>
                </div>
                <div className="col-12 col-md-4 mb-3 mb-md-0">
                  <div className="fw-bold text-primary mb-1">{t('info.understanding.point2Title')}</div>
                  <div className="text-secondary small">{t('info.understanding.point2Desc')}</div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="fw-bold text-primary mb-1">{t('info.understanding.point3Title')}</div>
                  <div className="text-secondary small">{t('info.understanding.point3Desc')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Info;
