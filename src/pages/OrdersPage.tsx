import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api.js";
import { formatMoney } from "../lib/money.js";
import { statusPillClass } from "../lib/status.js";

type OrderItem = {
  id: string;
  status: string;
  totalCents: number;
  currency: string;
  paidAt: string | null;
  createdAt: string;
  itemCount: number;
  ticketCount: number;
  event: {
    id: string;
    title: string;
    slug: string;
    startsAt: string | null;
  };
  payment: { id: string; status: string; provider: string } | null;
};

export function OrdersPage() {
  const query = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => apiFetch<{ items: OrderItem[] }>("/api/v1/orders"),
  });

  return (
    <main className="page">
      <header className="page-hero-block">
        <p className="muted">Histórico</p>
        <h1>Meus pedidos</h1>
        <p>
          Acompanhe status e valores. Ingressos digitais ficam em{" "}
          <Link to="/tickets" style={{ color: "#7ee0d8" }}>
            Meus ingressos
          </Link>
          .
        </p>
      </header>

      {query.isLoading ? <p className="muted">Carregando pedidos…</p> : null}
      {query.isError ? (
        <p className="error">
          {(query.error as Error).message ?? "Não foi possível carregar os pedidos."}
        </p>
      ) : null}

      <div className="stack">
        {(query.data?.items ?? []).map((order) => (
          <article key={order.id} className="surface-card stack">
            <div className="row-between">
              <span className={statusPillClass(order.status)}>{order.status}</span>
              <strong style={{ fontSize: "1.2rem" }}>
                {formatMoney(order.totalCents, order.currency)}
              </strong>
            </div>
            <div>
              <strong style={{ fontSize: "1.1rem" }}>{order.event.title}</strong>
              <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                {new Date(order.createdAt).toLocaleString("pt-BR")}
                {order.event.startsAt
                  ? ` · evento em ${new Date(order.event.startsAt).toLocaleDateString("pt-BR")}`
                  : ""}
              </p>
            </div>
            <span className="muted">
              {order.itemCount} item(ns) · {order.ticketCount} ingresso(s)
              {order.payment ? ` · pagamento ${order.payment.status}` : ""}
            </span>
            <div className="inline-form">
              <Link className="button secondary" to={`/events/${order.event.slug}`}>
                Ver evento
              </Link>
              {order.ticketCount > 0 ? (
                <Link className="button" to="/tickets">
                  Ver ingressos
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {!query.isLoading && (query.data?.items.length ?? 0) === 0 ? (
        <div className="empty-state">
          <strong>Você ainda não tem pedidos</strong>
          <p className="muted" style={{ margin: 0 }}>
            Reserve um ingresso no catálogo e finalize o checkout.
          </p>
          <Link className="button" to="/">
            Explorar eventos
          </Link>
        </div>
      ) : null}
    </main>
  );
}
