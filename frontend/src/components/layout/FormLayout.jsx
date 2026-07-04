import { Link } from 'react-router-dom';

function FormLayout({ title, subtitle, children, backTo = '/' }) {
  return (
    <div className="form-page">
      <div className="form-page__card">
        <Link to={backTo} className="form-page__back">
          ← Back to home
        </Link>
        <div className="form-page__header">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="WowWed" className="form-page__logo" />
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export default FormLayout;
