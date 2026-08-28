import { Navigate, Outlet, createBrowserRouter, RouterProvider } from 'react-router-dom';
import ErrorBoundary from './components/ui/ErrorBoundary';
import BudgetPage from './pages/dashboard/BudgetPage';
import SeatingChartPage from './pages/dashboard/SeatingChartPage';
import {
  getBudget,
  getGuests,
  getSeating,
  getWeddingProfile,
} from './utils/storage';

function dashboardContext() {
  return {
    budget: getBudget(),
    guests: getGuests() || [],
    seating: getSeating(),
    profile: getWeddingProfile(),
  };
}

function DashboardLayout() {
  return (
    <div className="app dash">
      <main className="app-main app-main--dash">
        <ErrorBoundary>
          <Outlet context={dashboardContext()} />
        </ErrorBoundary>
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Navigate to="budget" replace /> },
      { path: 'budget', element: <BudgetPage /> },
      { path: 'seating', element: <SeatingChartPage /> },
    ],
  },
  { path: '/', element: <Navigate to="/dashboard/budget" replace /> },
  { path: '*', element: <Navigate to="/dashboard/budget" replace /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
