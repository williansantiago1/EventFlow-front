import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { formatMoney } from "../lib/money";

type CheckoutState = {
  eventTitle?: string;
  eventSlug?: string;
  items?: Array<{
    offerId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  totalCents?: number;
};

export function CheckoutPage() {
  const { reservationId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const summary = (location.state as CheckoutState | null) ?? {};
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = summary.items ?? [];
  const totalCents =
    summary.totalCents ??
    items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  const checkout = useMutation({
    mutationFn: async () => {
      const orderResult = await apiFetch<{
        order: { id: string };
        payment: { id: string };
      }>("/api/v1/orders", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        json: { reservationId },
      });

      await apiFetch(`/api/v1/payments/fake/${orderResult.payment.id}/approve`, {
        method: "POST",
        json: {},
      });

      return orderResult;
    },
    onSuccess: () => {
      setMessage("Pagamento aprovado. Emitindo seus ingressos…");
      setTimeout(() => navigate("/tickets"), 1200);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Falha no checkout.");
    },
  });

  return (
    <main className="page">
      <div className="checkout-shell">
        <header className="page-hero-block">
          <p className="muted">Quase lá</p>
          <h1>Checkout</h1>
          <p>
            {summary.eventTitle
              ? `Confirme a compra de ${summary.eventTitle}.`
              : "Confirme o pedido e finalize o pagamento demonstrativo."}
          </p>
        </header>

        <div className="step-rail" aria-label="Etapas">
          <span className="step-chip is-done">1 · Reserva</span>
          <span className="step-chip is-active">2 · Pagamento</span>
          <span className="step-chip">3 · Ingressos</span>
        </div>

        <section className="surface-card stack">
          {items.length > 0 ? (
            <>
              <h2 style={{ margin: 0 }}>Resumo</h2>
              <ul className="summary-list">
                {items.map((item) => (
                  <li key={item.offerId}>
                    <span>
                      <strong>{item.name}</strong>
                      <br />
                      <span className="muted">
                        {item.quantity} × {formatMoney(item.unitPriceCents)}
                      </span>
                    </span>
                    <strong>{formatMoney(item.unitPriceCents * item.quantity)}</strong>
                  </li>
                ))}
              </ul>
              <div className="summary-total">
                <span>Total</span>
                <strong>{formatMoney(totalCents)}</strong>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ margin: 0 }}>Reserva pronta</h2>
              <p className="muted" style={{ margin: 0 }}>
                Sua seleção está reservada. Ao pagar, o pedido é criado e os
                ingressos são emitidos automaticamente.
              </p>
            </>
          )}

          <p className="mono-soft">Reserva {reservationId}</p>

          <div className="checkout-note">
            <strong>Pagamento fake</strong>
            <span>Só para teste. Nenhum valor é cobrado.</span>
          </div>

          {message ? <p className="success">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}

          <button
            className="button auth-submit"
            type="button"
            disabled={checkout.isPending || !reservationId || Boolean(message)}
            onClick={() => {
              setError(null);
              checkout.mutate();
            }}
          >
            {checkout.isPending
              ? "Processando pagamento…"
              : message
                ? "Redirecionando…"
                : "Confirmar e pagar"}
          </button>

          <p className="muted" style={{ margin: 0, textAlign: "center" }}>
            {summary.eventSlug ? (
              <>
                <Link to={`/events/${summary.eventSlug}`}>Voltar ao evento</Link>
                {" · "}
              </>
            ) : null}
            <Link to="/orders">Ver pedidos</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
