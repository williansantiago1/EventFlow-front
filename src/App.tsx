import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { Layout } from "./components/Layout.js";
import { useAuth } from "./lib/auth.js";
import { CheckInPage } from "./pages/CheckinPage.js";
import { CheckoutPage } from "./pages/CheckoutPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { EventDetailPage } from "./pages/EventDetailPage.js";
import { HomePage } from "./pages/HomePage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { MyTicketsPage } from "./pages/MyTicketsPage.js";
import { OrdersPage } from "./pages/OrdersPage.js";
import { OrgEventManagePage } from "./pages/OrgEventManagePage.js";
import { OrgEventsPage } from "./pages/OrgEventsPage.js";
import { OrgTeamPage } from "./pages/OrgTeamPage.js";
import { OrganizerWizardPage } from "./pages/OrganizerWizardPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";

function Protected({ children }: { readonly children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <main className="page">
        <p>Carregando sessão…</p>
      </main>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function OrganizerManageGate({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const { canManageEvents, isOrganizer, loading } = useAuth();
  if (loading) {
    return (
      <main className="page">
        <p>Carregando sessão…</p>
      </main>
    );
  }
  // New organizers can open the wizard before creating the first profile.
  if (!isOrganizer || canManageEvents) {
    return children;
  }
  return <Navigate to="/org/checkin" replace />;
}

function OrganizerStaffGate({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const { canCheckIn, loading } = useAuth();
  if (loading) {
    return (
      <main className="page">
        <p>Carregando sessão…</p>
      </main>
    );
  }
  if (!canCheckIn) {
    return <Navigate to="/org/events/new" replace />;
  }
  return children;
}

function OrganizerHome() {
  const { canManageEvents, canCheckIn } = useAuth();
  if (canManageEvents) {
    return <DashboardPage />;
  }
  if (canCheckIn) {
    return <Navigate to="/org/checkin" replace />;
  }
  return <Navigate to="/org/events/new" replace />;
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="events/:slug" element={<EventDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="checkout/:reservationId"
          element={
            <Protected>
              <CheckoutPage />
            </Protected>
          }
        />
        <Route
          path="tickets"
          element={
            <Protected>
              <MyTicketsPage />
            </Protected>
          }
        />
        <Route
          path="orders"
          element={
            <Protected>
              <OrdersPage />
            </Protected>
          }
        />

        <Route
          path="org"
          element={
            <Protected>
              <OrganizerHome />
            </Protected>
          }
        />
        <Route
          path="org/events"
          element={
            <Protected>
              <OrganizerManageGate>
                <OrgEventsPage />
              </OrganizerManageGate>
            </Protected>
          }
        />
        <Route
          path="org/events/new"
          element={
            <Protected>
              <OrganizerManageGate>
                <OrganizerWizardPage />
              </OrganizerManageGate>
            </Protected>
          }
        />
        <Route
          path="org/events/:eventId"
          element={
            <Protected>
              <OrganizerManageGate>
                <OrgEventManagePage />
              </OrganizerManageGate>
            </Protected>
          }
        />
        <Route
          path="org/team"
          element={
            <Protected>
              <OrganizerManageGate>
                <OrgTeamPage />
              </OrganizerManageGate>
            </Protected>
          }
        />
        <Route
          path="org/dashboard"
          element={
            <Protected>
              <OrganizerManageGate>
                <DashboardPage />
              </OrganizerManageGate>
            </Protected>
          }
        />
        <Route
          path="org/checkin"
          element={
            <Protected>
              <OrganizerStaffGate>
                <CheckInPage />
              </OrganizerStaffGate>
            </Protected>
          }
        />

        {/* Legacy paths */}
        <Route path="organizer" element={<Navigate to="/org/events/new" replace />} />
        <Route path="dashboard" element={<Navigate to="/org" replace />} />
        <Route path="checkin" element={<Navigate to="/org/checkin" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
