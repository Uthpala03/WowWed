import { Link } from 'react-router-dom';

function Button({ children, variant = 'primary', className = '', to, type = 'button', ...props }) {
  const classes = `btn btn--${variant} ${className}`.trim();

  if (to) {
    return (
      <Link className={classes} to={to} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}

export default Button;
