import { Navigate } from 'react-router-dom';

/** Legacy route — sends users to couple onboarding */
function GetStartedPage() {
  return <Navigate to="/get-started/couple" replace />;
}

export default GetStartedPage;
