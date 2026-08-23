import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import coupleVisual from '../../assets/couple-onboarding.jpg';
import vendorVisual from '../../assets/vendor-onboarding.jpg';

const visuals = {
  couple: coupleVisual,
  vendor: vendorVisual,
};

function OnboardingLayout({
  children,
  step = 1,
  totalSteps = 2,
  variant = 'couple',
  wide = false,
  hideSteps = false,
  backTo = '/',
  backLabel = '← Back to home',
}) {
  return (
    <div className={`onboarding onboarding--${variant}`}>
      <div className={`onboarding__visual onboarding__visual--${variant}`} aria-hidden="true">
        <img src={visuals[variant] || visuals.couple} alt="" className="onboarding__visual-img" />
        <div className="onboarding__visual-overlay" />
      </div>
      <div className="onboarding__panel">
        <div className={`onboarding__card${wide ? ' onboarding__card--wide' : ''}`}>
          <Link to={backTo} className="onboarding__home-link">{backLabel}</Link>
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="WowWed" className="onboarding__logo" />
          {!hideSteps && (
            <div className={`onboarding__steps${totalSteps > 2 ? ' onboarding__steps--long' : ''}`}>
              {Array.from({ length: totalSteps }, (_, index) => {
                const number = index + 1;
                const done = step > number;
                const active = step === number;
                return (
                  <Fragment key={number}>
                    {index > 0 && <span className={`onboarding__step-line${done || active ? ' is-done' : ''}`} />}
                    <span className={`onboarding__step${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}>
                      {done ? '✓' : number}
                    </span>
                  </Fragment>
                );
              })}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export default OnboardingLayout;
