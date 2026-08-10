import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { coverGradient, formatEventWhen } from "../lib/event-visual";
import { formatMoney } from "../lib/money";

type Offer = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  available: number;
  maxPerOrder: number;
};

type EventDetail = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  status: string;
  startsAt: string | null;
  coverImageUrl?: string | null;
  location: { venueName: string; city: string; state: string } | null;
  category?: { id: string; name: string; slug: string } | null;
  offers: Offer[];
};

export function EventDetailPage() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const justPublished = Boolean(
    (location.state as { justPublished?: boolean } | null)?.justPublished,
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["event", slug],
    queryFn: () => apiFetch<{ event: EventDetail }>(`/api/v1/events/${slug}`),
    enabled: Boolean(slug),
  });

  const selected = useMemo(() => {
    const event = query.data?.event;
    if (!event) return [];
    return event.offers
      .map((offer) => ({
        offer,
        quantity: quantities[offer.id] ?? 0,
      }))
      .filter((row) => row.quantity > 0);
  }, [quantities, query.data?.event]);

  const totalCents = selected.reduce(
    (sum, row) => sum + row.offer.priceCents * row.quantity,
    0,
  );

  const reserve = useMutation({
    mutationFn: async () => {
      if (!query.data) throw new Error("Evento indisponível.");
      const items = selected.map((row) => ({
        offerId: row.offer.id,
        quantity: row.quantity,
      }));
      if (items.length === 0) {
        throw new Error("Selecione ao menos um ingresso.");
      }
      return apiFetch<{ reservation: { id: string } }>("/api/v1/reservations", {
        method: "POST",
        headers: {
          "Idempotency-Key": crypto.randomUUID(),
        },
        json: {
          eventId: query.data.event.id,
          items,
        },
      });
    },
    onSuccess: (data) => {
      const event = query.data?.event;
      navigate(`/checkout/${data.reservation.id}`, {
        state: {
          eventTitle: event?.title,
          eventSlug: event?.slug,
          items: selected.map((row) => ({
            offerId: row.offer.id,
            name: row.offer.name,
            quantity: row.quantity,
            unitPriceCents: row.offer.priceCents,
          })),
          totalCents,
        },
      });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Falha na reserva.");
    },
  });

  if (query.isLoading) {
    return (
      <main className="page">
        <p className="muted">Carregando evento…</p>
      </main>
    );
  }
  if (query.isError || !query.data) {
    return (
      <main className="page">
        <div className="empty-state">
          <strong>Evento não encontrado</strong>
          <Link className="button" to="/">
            Voltar ao catálogo
          </Link>
        </div>
      </main>
    );
  }

  const event = query.data.event;
  const cover = event.coverImageUrl
    ? `linear-gradient(180deg, rgba(11,18,32,0.15), rgba(11,18,32,0.55)), url(${event.coverImageUrl})`
    : coverGradient(event.slug);

  return (
    <main className="page event-detail">
      {justPublished ? (
        <div className="surface-card stack">
          <p className="success" style={{ margin: 0 }}>
            Evento publicado com sucesso.
          </p>
          <div className="inline-form">
            <Link className="button" to="/org">
              Ir ao dashboard
            </Link>
            <Link className="button secondary" to={`/org/events`}>
              Gerenciar eventos
            </Link>
          </div>
        </div>
      ) : null}

      <section className="event-detail-hero" style={{ backgroundImage: cover }}>
        <div className="event-detail-hero-inner">
          {event.category ? (
            <span className="category-pill">{event.category.name}</span>
          ) : (
            <span className="badge">{event.status}</span>
          )}
          <h1>{event.title}</h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.88)" }}>
            {formatEventWhen(event.startsAt)}
            {event.location
              ? ` · ${event.location.venueName}, ${event.location.city}/${event.location.state}`
              : ""}
          </p>
        </div>
      </section>

      <section className="surface-card stack">
        <h2 style={{ margin: 0 }}>Sobre</h2>
        {event.summary ? (
          <p className="muted" style={{ margin: 0, fontSize: "1.05rem" }}>
            {event.summary}
          </p>
        ) : null}
        {event.description ? <p style={{ margin: 0 }}>{event.description}</p> : null}
      </section>

      <section className="surface-card stack">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2 style={{ margin: 0 }}>Ingressos</h2>
          {selected.length > 0 ? (
            <strong>{formatMoney(totalCents)}</strong>
          ) : null}
        </div>

        {event.offers.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Nenhuma oferta disponível no momento.
          </p>
        ) : (
          event.offers.map((offer) => (
            <div key={offer.id} className="offer-row">
              <div className="row-between">
                <div>
                  <strong>{offer.name}</strong>
                  <br />
                  <span className="muted">{offer.available} disponíveis</span>
                </div>
                <strong>{formatMoney(offer.priceCents, offer.currency)}</strong>
              </div>
              <label className="field" style={{ maxWidth: 160 }}>
                Quantidade
                <input
                  type="number"
                  min={0}
                  max={Math.min(offer.maxPerOrder, offer.available)}
                  value={quantities[offer.id] ?? 0}
                  onChange={(e) =>
                    setQuantities((prev) => ({
                      ...prev,
                      [offer.id]: Number(e.target.value),
                    }))
                  }
                />
              </label>
            </div>
          ))
        )}

        {!user ? (
          <p className="muted" style={{ margin: 0 }}>
            <Link to="/login">Entre</Link> para reservar ingressos.
          </p>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
        <button
          className="button"
          type="button"
          disabled={!user || reserve.isPending || selected.length === 0}
          onClick={() => {
            setError(null);
            reserve.mutate();
          }}
        >
          {reserve.isPending
            ? "Reservando…"
            : selected.length > 0
              ? `Reservar · ${formatMoney(totalCents)}`
              : "Selecione um ingresso"}
        </button>
      </section>
    </main>
  );
}
