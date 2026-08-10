import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Layout() {
  const { user, logout, isOrganizer, canManageEvents, canCheckIn } = useAuth();
  const location = useLocation();
  const inOrganizerArea = location.pathname.startsWith("/org");
  const isHome = location.pathname === "/";

  return (
    <div className={`app-shell${inOrganizerArea ? " org-shell" : ""}`}>
      <header className="topnav">
        <div className="topnav-inner">
          <Link to={inOrganizerArea ? "/org" : "/"} className="brand">
            <span className="brand-mark" aria-hidden />
            EventFlow
            {inOrganizerArea ? (
              <span className="brand-suffix">Organizador</span>
            ) : null}
          </Link>
          <nav className="nav-links">
            {inOrganizerArea ? (
              <>
                {canManageEvents ? (
                  <>
                    <Link to="/org">Dashboard</Link>
                    <Link to="/org/events">Eventos</Link>
                    <Link to="/org/events/new">Novo evento</Link>
                    <Link to="/org/team">Equipe</Link>
                  </>
                ) : null}
                {canCheckIn ? <Link to="/org/checkin">Check-in</Link> : null}
                <Link to="/">Explorar eventos</Link>
                {user ? (
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => void logout()}
                  >
                    Sair
                  </button>
                ) : null}
              </>
            ) : (
              <>
                {!isHome ? <Link to="/">Eventos</Link> : null}
                {user ? (
                  <>
                    <Link to="/orders">Meus pedidos</Link>
                    <Link to="/tickets">Meus ingressos</Link>
                    {isOrganizer ? (
                      <Link to="/org">Área do organizador</Link>
                    ) : (
                      <Link to="/org/events/new">Criar evento</Link>
                    )}
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => void logout()}
                    >
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login">Entrar</Link>
                    <Link to="/register" className="button">
                      Criar conta
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
