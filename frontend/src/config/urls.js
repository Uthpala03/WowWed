const DEFAULT_API = 'http://localhost:5002';

export const API_BASE_URL = (process.env.REACT_APP_API_URL || DEFAULT_API).replace(/\/$/, '');

/** Direct seating ML, or the backend proxy when unset. */
export const SEATING_API_URL = (
  process.env.REACT_APP_SEATING_API_URL
  || `${API_BASE_URL}/api/ml/seating`
).replace(/\/$/, '');
