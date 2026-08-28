import { Component } from 'react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="dash-page">
          <div className="dash-card">
            <h1>Something went wrong</h1>
            <p style={{ color: 'var(--color-danger)' }}>{this.state.error.message}</p>
            <Link to="/dashboard/budget" className="dash-btn dash-btn--primary">Reload budget page</Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
