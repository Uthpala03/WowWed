function OnboardingLayout({ children, step = 1 }) {
  return (
    <div className="onboarding">
      <div className="onboarding__visual" aria-hidden="true">
        <div className="onboarding__visual-overlay" />
      </div>
      <div className="onboarding__panel">
        <div className="onboarding__card">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="WowWed" className="onboarding__logo" />
          <div className="onboarding__steps">
            <span className={`onboarding__step${step > 1 ? ' is-done' : ' is-active'}`}>{step > 1 ? '✓' : '1'}</span>
            <span className="onboarding__step-line" />
            <span className={`onboarding__step${step >= 2 ? ' is-active' : ''}`}>2</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default OnboardingLayout;
