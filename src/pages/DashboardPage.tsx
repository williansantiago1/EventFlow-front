import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { apiFetch } from "../lib/api.js";
import { getDemoContext, setDemoContext } from "../lib/demo-context.js";
import { formatMoney } from "../lib/money.js";
import { statusPillClass } from "../lib/status.js";

type OrganizerSummary = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

type Dashboard = {
  organizerId: string;
  totals: {
    events: number;
    paidOrders: number;
    ticketsIssued: number;
    checkins: number;
    revenueCents: number;
    currency: string;
  };
  events: Array<{
    eventId: string;
    title: string;
    status: string;
    paidOrders: number;
    ticketsIssued: number;
    checkins: number;
    revenueCents?: number;
  }>;
};

async function downloadDashboardCsv(organizerId: string): Promise<void> {
  const apiUrl = import.meta.env.DEV
    ? ""
    : String(import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const headers = new Headers();
  const token = localStorage.getItem("ef_access");
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  const response = await fetch(
    `${apiUrl}/api/v1/organizers/${organizerId}/dashboard.csv`,
    { headers, credentials: "include" },
  );
  if (!response.ok) {
    throw new Error("Falha ao exportar CSV.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `dashboard-${organizerId}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DashboardPage() {
  const [organizerId, setOrganizerId] = useState(() => getDemoContext().organizerId ?? "");
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvBusy, setCsvBusy] = useState(false);

  const organizers = useQuery({
    queryKey: ["organizers"],
    queryFn: async () => {
      const data = await apiFetch<{ items: OrganizerSummary[] }>("/api/v1/organizers");
      return data.items;
    },
  });

  useEffect(() => {
    if (!organizers.data?.length) return;
    const stored = getDemoContext().organizerId;
    const preferred =
      (stored && organizers.data.find((item) => item.id === stored)?.id) ||
      organizers.data[0]?.id ||
      "";
    if (preferred && preferred !== organizerId) {
      setOrganizerId(preferred);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizers.data]);

  useEffect(() => {
    if (organizerId) {
      setDemoContext({ organizerId });
    }
  }, [organizerId]);

  const dashboard = useQuery({
    queryKey: ["dashboard", organizerId],
    enabled: Boolean(organizerId),
    refetchInterval: 10_000,
    queryFn: async () => {
      const data = await apiFetch<{ dashboard: Dashboard }>(
        `/api/v1/organizers/${organizerId}/dashboard`,
      );
      return data.dashboard;
    },
  });

  return (
    <main className="page">
      <header className="page-hero-block">
        <p className="muted">Operação</p>
        <h1>Dashboard</h1>
        <p>Vendas, ingressos e check-ins do seu organizador.</p>
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
        <div className="inline-form">
          <Link className="button secondary" to="/org/events">
            Eventos
          </Link>
          <button
            type="button"
            className="button"
            disabled={!organizerId || csvBusy}
            onClick={() => {
              setCsvError(null);
              setCsvBusy(true);
              void downloadDashboardCsv(organizerId)
                .catch((err: unknown) => {
                  setCsvError(
                    err instanceof Error ? err.message : "Falha ao exportar CSV.",
                  );
                })
                .finally(() => setCsvBusy(false));
            }}
          >
            {csvBusy ? "Exportando…" : "Baixar CSV"}
          </button>
        </div>
      </div>

      {csvError ? <p className="error">{csvError}</p> : null}
      {organizers.isError ? (
        <p className="error">
          {(organizers.error as Error).message ?? "Falha ao carregar organizadores."}
        </p>
      ) : null}
      {dashboard.isLoading ? <p className="muted">Carregando métricas…</p> : null}
      {dashboard.isError ? (
        <p className="error">
          {(dashboard.error as Error).message ?? "Falha ao carregar."}
        </p>
      ) : null}

      {dashboard.data ? (
        <>
          <section className="metric-grid">
            <article className="metric">
              <span>Receita</span>
              <strong>
                {formatMoney(
                  dashboard.data.totals.revenueCents,
                  dashboard.data.totals.currency,
                )}
              </strong>
            </article>
            <article className="metric">
              <span>Pedidos pagos</span>
              <strong>{dashboard.data.totals.paidOrders}</strong>
            </article>
            <article className="metric">
              <span>Ingressos emitidos</span>
              <strong>{dashboard.data.totals.ticketsIssued}</strong>
            </article>
            <article className="metric">
              <span>Check-ins</span>
              <strong>{dashboard.data.totals.checkins}</strong>
            </article>
            <article className="metric">
              <span>Eventos</span>
              <strong>{dashboard.data.totals.events}</strong>
            </article>
          </section>

          <section className="stack">
            <div className="page-header">
              <h2 style={{ margin: 0 }}>Eventos</h2>
              <Link className="button secondary" to="/org/events/new">
                Novo evento
              </Link>
            </div>
            {dashboard.data.events.length === 0 ? (
              <div className="empty-state">
                <strong>Nenhum evento ainda</strong>
                <Link className="button" to="/org/events/new">
                  Criar evento
                </Link>
              </div>
            ) : (
              dashboard.data.events.map((event) => (
                <article key={event.eventId} className="surface-card row-between">
                  <div className="stack" style={{ gap: "0.35rem" }}>
                    <span className={statusPillClass(event.status)}>{event.status}</span>
                    <strong>{event.title}</strong>
                    <p className="muted" style={{ margin: 0 }}>
                      {event.paidOrders} pedidos · {event.ticketsIssued} ingressos ·{" "}
                      {event.checkins} check-ins
                    </p>
                  </div>
                  <Link className="button ghost" to={`/org/events/${event.eventId}`}>
                    Abrir
                  </Link>
                </article>
              ))
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
