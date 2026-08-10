import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api.js";
import { useOrganizerSelection } from "../lib/organizer-selection.js";
import { statusPillClass } from "../lib/status.js";

type OrgEvent = {
  id: string;
  title: string;
  slug: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

export function OrgEventsPage() {
  const { organizerId, setOrganizerId, organizers, canManage } =
    useOrganizerSelection();

  const events = useQuery({
    queryKey: ["org-events", organizerId],
    enabled: Boolean(organizerId),
    queryFn: async () => {
      const data = await apiFetch<{ items: OrgEvent[] }>(
        `/api/v1/organizers/${organizerId}/events`,
      );
      return data.items;
    },
  });

  return (
    <main className="page">
      <header className="page-hero-block">
        <p className="muted">Gestão</p>
        <h1>Meus eventos</h1>
        <p>Liste, edite e gerencie lotes depois da publicação.</p>
      </header>

      <div className="page-header">
        <label className="field" style={{ minWidth: 220 }}>
          Organizador
          <select
            value={organizerId}
            onChange={(e) => setOrganizerId(e.target.value)}
            disabled={organizers.isLoading || !organizers.data?.length}
          >
            {!organizers.data?.length ? (
              <option value="">Nenhum organizador</option>
            ) : (
              organizers.data.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.role})
                </option>
              ))
            )}
          </select>
        </label>
        {canManage ? (
          <Link className="button" to="/org/events/new">
            Novo evento
          </Link>
        ) : null}
      </div>

      {events.isLoading ? <p className="muted">Carregando eventos…</p> : null}
      {events.isError ? (
        <p className="error">
          {(events.error as Error).message ?? "Falha ao carregar eventos."}
        </p>
      ) : null}

      <div className="stack">
        {(events.data ?? []).map((event) => (
          <article key={event.id} className="surface-card row-between">
            <div className="stack" style={{ gap: "0.3rem" }}>
              <span className={statusPillClass(event.status)}>{event.status}</span>
              <strong style={{ fontSize: "1.1rem" }}>{event.title}</strong>
              <span className="muted">
                {event.startsAt
                  ? new Date(event.startsAt).toLocaleString("pt-BR")
                  : "Data a definir"}{" "}
                · /{event.slug}
              </span>
            </div>
            <div className="inline-form">
              <Link className="button secondary" to={`/org/events/${event.id}`}>
                Gerenciar
              </Link>
              {event.status === "PUBLISHED" ? (
                <Link className="button ghost" to={`/events/${event.slug}`}>
                  Ver página
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {!events.isLoading && (events.data?.length ?? 0) === 0 ? (
        <div className="empty-state">
          <strong>Nenhum evento ainda</strong>
          <p className="muted" style={{ margin: 0 }}>
            Publique o primeiro pelo wizard em poucos minutos.
          </p>
          {canManage ? (
            <Link className="button" to="/org/events/new">
              Criar primeiro evento
            </Link>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
