import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api.js";
import { formatMoney } from "../lib/money.js";
import { statusPillClass } from "../lib/status.js";

type ManageOffer = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  maxPerOrder: number;
  status: string;
  capacity: number;
  reserved: number;
  sold: number;
  available: number;
};

type ManageLot = {
  id: string;
  name: string;
  status: string;
  offers: ManageOffer[];
};

type ManageEvent = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  lots: ManageLot[];
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value.trim()) return null;
  return new Date(value).toISOString();
}

export function OrgEventManagePage() {
  const { eventId = "" } = useParams();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [lotName, setLotName] = useState("Lote extra");
  const [offerLotId, setOfferLotId] = useState("");
  const [offerName, setOfferName] = useState("Pista");
  const [offerPrice, setOfferPrice] = useState(5000);
  const [offerCapacity, setOfferCapacity] = useState(100);

  const detail = useQuery({
    queryKey: ["org-event", eventId],
    enabled: Boolean(eventId),
    queryFn: async () => {
      const data = await apiFetch<{ event: ManageEvent }>(
        `/api/v1/events/id/${eventId}`,
      );
      return data.event;
    },
  });

  useEffect(() => {
    const event = detail.data;
    if (!event) return;
    setTitle(event.title);
    setSummary(event.summary ?? "");
    setDescription(event.description ?? "");
    setStartsAt(toLocalInput(event.startsAt));
    setEndsAt(toLocalInput(event.endsAt));
    if (!offerLotId && event.lots[0]) {
      setOfferLotId(event.lots[0].id);
    }
  }, [detail.data, offerLotId]);

  const save = useMutation({
    mutationFn: async () => {
      const data = await apiFetch<{ event: ManageEvent }>(
        `/api/v1/events/id/${eventId}`,
        {
          method: "PATCH",
          json: {
            title,
            summary: summary || undefined,
            description: description || undefined,
            startsAt: fromLocalInput(startsAt),
            endsAt: fromLocalInput(endsAt),
          },
        },
      );
      return data.event;
    },
    onSuccess: async () => {
      setMessage("Evento atualizado.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["org-event", eventId] });
    },
    onError: (err: unknown) => {
      setMessage(null);
      setError(err instanceof Error ? err.message : "Falha ao salvar.");
    },
  });

  const transition = useMutation({
    mutationFn: async (action: "publish" | "cancel" | "finish") => {
      const data = await apiFetch<{ event: ManageEvent }>(
        `/api/v1/events/id/${eventId}/${action}`,
        { method: "POST" },
      );
      return data.event;
    },
    onSuccess: async (_data, action) => {
      setMessage(
        action === "publish"
          ? "Evento publicado."
          : action === "cancel"
            ? "Evento cancelado."
            : "Evento encerrado.",
      );
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["org-event", eventId] });
      await queryClient.invalidateQueries({ queryKey: ["org-events"] });
    },
    onError: (err: unknown) => {
      setMessage(null);
      setError(err instanceof Error ? err.message : "Falha na transição.");
    },
  });

  const createLot = useMutation({
    mutationFn: async (event: FormEvent) => {
      event.preventDefault();
      return apiFetch(`/api/v1/events/id/${eventId}/lots`, {
        method: "POST",
        json: { name: lotName },
      });
    },
    onSuccess: async () => {
      setMessage("Lote criado.");
      setError(null);
      setLotName("Lote extra");
      await queryClient.invalidateQueries({ queryKey: ["org-event", eventId] });
    },
    onError: (err: unknown) => {
      setMessage(null);
      setError(err instanceof Error ? err.message : "Falha ao criar lote.");
    },
  });

  const createOffer = useMutation({
    mutationFn: async (event: FormEvent) => {
      event.preventDefault();
      return apiFetch(`/api/v1/events/id/${eventId}/offers`, {
        method: "POST",
        json: {
          lotId: offerLotId,
          name: offerName,
          priceCents: offerPrice,
          capacity: offerCapacity,
        },
      });
    },
    onSuccess: async () => {
      setMessage("Oferta criada.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["org-event", eventId] });
    },
    onError: (err: unknown) => {
      setMessage(null);
      setError(err instanceof Error ? err.message : "Falha ao criar oferta.");
    },
  });

  const event = detail.data;
  const editable = event?.status === "DRAFT" || event?.status === "PUBLISHED";

  return (
    <main className="page">
      <p style={{ margin: 0 }}>
        <Link to="/org/events">← Voltar aos eventos</Link>
      </p>

      {detail.isLoading ? <p className="muted">Carregando evento…</p> : null}
      {detail.isError ? (
        <p className="error">
          {(detail.error as Error).message ?? "Evento não encontrado."}
        </p>
      ) : null}

      {event ? (
        <>
          <header className="page-hero-block">
            <span className={statusPillClass(event.status)}>{event.status}</span>
            <h1>{event.title}</h1>
            <p>/{event.slug}</p>
          </header>

          <div className="inline-form">
            {event.status === "PUBLISHED" ? (
              <Link className="button secondary" to={`/events/${event.slug}`}>
                Página pública
              </Link>
            ) : null}
            {event.status === "DRAFT" ? (
              <button
                type="button"
                className="button"
                disabled={transition.isPending}
                onClick={() => transition.mutate("publish")}
              >
                Publicar
              </button>
            ) : null}
            {event.status === "PUBLISHED" ? (
              <>
                <button
                  type="button"
                  className="button secondary"
                  disabled={transition.isPending}
                  onClick={() => transition.mutate("finish")}
                >
                  Encerrar
                </button>
                <button
                  type="button"
                  className="button ghost"
                  disabled={transition.isPending}
                  onClick={() => transition.mutate("cancel")}
                >
                  Cancelar
                </button>
              </>
            ) : null}
          </div>

          {message ? <p className="success">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}

          <section className="surface-card stack">
            <h2 style={{ margin: 0 }}>Dados do evento</h2>
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <label className="field">
                Título
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!editable}
                  required
                />
              </label>
              <label className="field">
                Resumo
                <input
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  disabled={!editable}
                />
              </label>
              <label className="field">
                Descrição
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!editable}
                />
              </label>
              <div className="form-two">
                <label className="field">
                  Início
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    disabled={!editable}
                  />
                </label>
                <label className="field">
                  Fim
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    disabled={!editable}
                  />
                </label>
              </div>
              {editable ? (
                <button className="button" type="submit" disabled={save.isPending}>
                  {save.isPending ? "Salvando…" : "Salvar alterações"}
                </button>
              ) : (
                <p className="muted">Este evento não pode mais ser editado.</p>
              )}
            </form>
          </section>

          <section className="surface-card stack">
            <h2 style={{ margin: 0 }}>Lotes e ofertas</h2>
            {(event.lots ?? []).length === 0 ? (
              <p className="muted">Nenhum lote ainda. Crie o primeiro abaixo.</p>
            ) : (
              event.lots.map((lot) => (
                <article key={lot.id} className="stack" style={{ gap: "0.5rem" }}>
                  <strong>
                    {lot.name}{" "}
                    <span className="muted" style={{ fontWeight: 400 }}>
                      ({lot.status})
                    </span>
                  </strong>
                  {lot.offers.length === 0 ? (
                    <p className="muted" style={{ margin: 0 }}>
                      Sem ofertas neste lote.
                    </p>
                  ) : (
                    <ul className="plain-list">
                      {lot.offers.map((offer) => (
                        <li key={offer.id}>
                          {offer.name} · {formatMoney(offer.priceCents, offer.currency)} ·{" "}
                          {offer.available}/{offer.capacity} disponíveis · {offer.status}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))
            )}

            <form className="inline-form" onSubmit={(e) => void createLot.mutate(e)}>
              <label className="field">
                Novo lote
                <input
                  value={lotName}
                  onChange={(e) => setLotName(e.target.value)}
                  required
                />
              </label>
              <button className="button secondary" type="submit" disabled={createLot.isPending}>
                Criar lote
              </button>
            </form>

            <form className="stack" onSubmit={(e) => void createOffer.mutate(e)}>
              <h3 style={{ margin: 0 }}>Nova oferta</h3>
              <label className="field">
                Lote
                <select
                  value={offerLotId}
                  onChange={(e) => setOfferLotId(e.target.value)}
                  required
                  disabled={!event.lots.length}
                >
                  {event.lots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-two">
                <label className="field">
                  Nome
                  <input
                    value={offerName}
                    onChange={(e) => setOfferName(e.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  Preço (centavos)
                  <input
                    type="number"
                    min={0}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(Number(e.target.value))}
                    required
                  />
                </label>
                <label className="field">
                  Capacidade
                  <input
                    type="number"
                    min={1}
                    value={offerCapacity}
                    onChange={(e) => setOfferCapacity(Number(e.target.value))}
                    required
                  />
                </label>
              </div>
              <button
                className="button"
                type="submit"
                disabled={createOffer.isPending || !event.lots.length}
              >
                Criar oferta
              </button>
            </form>
          </section>
        </>
      ) : null}
    </main>
  );
}
