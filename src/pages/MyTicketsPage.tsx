import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { formatEventWhen } from "../lib/event-visual";
import { statusPillClass } from "../lib/status";

type Ticket = {
  id: string;
  status: string;
  holderName: string;
  qrToken: string | null;
  event: { title: string; slug: string; startsAt: string | null };
  offer: { name: string };
  checkedIn: boolean;
};

export function MyTicketsPage() {
  const query = useQuery({
    queryKey: ["tickets", "mine"],
    queryFn: () => apiFetch<{ items: Ticket[] }>("/api/v1/tickets/mine"),
  });

  return (
    <main className="page">
      <header className="page-hero-block">
        <p className="muted">Acesso digital</p>
        <h1>Meus ingressos</h1>
        <p>Mostre o código na entrada. Pedidos ficam em Meus pedidos.</p>
      </header>

      <div className="page-header">
        <p className="muted" style={{ margin: 0 }}>
          {query.isLoading
            ? "Carregando…"
            : `${query.data?.items.length ?? 0} ingresso(s)`}
        </p>
        <Link className="button secondary" to="/orders">
          Ver pedidos
        </Link>
      </div>

      {query.isError ? (
        <p className="error">Não foi possível carregar os ingressos.</p>
      ) : null}

      <div className="ticket-grid">
        {(query.data?.items ?? []).map((ticket) => (
          <article key={ticket.id} className="ticket-card">
            <div className="ticket-card-top">
              <span className={statusPillClass(ticket.status)}>{ticket.status}</span>
              <strong style={{ fontSize: "1.15rem" }}>{ticket.event.title}</strong>
              <span className="muted">{formatEventWhen(ticket.event.startsAt)}</span>
            </div>
            <div className="ticket-card-body">
              <div className="row-between">
                <span>{ticket.offer.name}</span>
                <Link to={`/events/${ticket.event.slug}`}>Evento</Link>
              </div>
              <span className="muted">Titular: {ticket.holderName}</span>
              {ticket.checkedIn ? (
                <span className="success">Check-in realizado</span>
              ) : null}
              {ticket.qrToken ? (
                <div className="ticket-qr">
                  <span style={{ opacity: 0.7 }}>QR token</span>
                  {ticket.qrToken}
                </div>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  QR ainda não disponível.
                </p>
              )}
            </div>
          </article>
        ))}
      </div>

      {!query.isLoading && (query.data?.items.length ?? 0) === 0 ? (
        <div className="empty-state">
          <strong>Nenhum ingresso ainda</strong>
          <p className="muted" style={{ margin: 0 }}>
            Compre um evento no catálogo para gerar seu QR digital.
          </p>
          <Link className="button" to="/">
            Explorar eventos
          </Link>
        </div>
      ) : null}
    </main>
  );
}
