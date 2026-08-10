import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "../lib/api.js";
import { getDemoContext, setDemoContext } from "../lib/demo-context.js";

type OrganizerSummary = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

type EventSummary = {
  id: string;
  title: string;
  slug: string;
  status: string;
};

export function CheckInPage() {
  const demo = getDemoContext();
  const [organizerId, setOrganizerId] = useState(demo.organizerId ?? "");
  const [eventId, setEventId] = useState(demo.eventId ?? "");
  const [qrToken, setQrToken] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const events = useQuery({
    queryKey: ["organizer-events", organizerId],
    enabled: Boolean(organizerId),
    queryFn: async () => {
      const data = await apiFetch<{ items: EventSummary[] }>(
        `/api/v1/organizers/${organizerId}/events`,
      );
      return data.items;
    },
  });

  useEffect(() => {
    if (!events.data?.length) return;
    const stored = getDemoContext().eventId;
    const preferred =
      (stored && events.data.find((item) => item.id === stored)?.id) ||
      events.data[0]?.id ||
      "";
    if (preferred) {
      setEventId(preferred);
    }
  }, [events.data]);

  useEffect(() => {
    if (organizerId) {
      setDemoContext({ organizerId });
    }
  }, [organizerId]);

  useEffect(() => {
    if (eventId) {
      const selected = events.data?.find((item) => item.id === eventId);
      setDemoContext({
        eventId,
        eventSlug: selected?.slug ?? undefined,
      });
    }
  }, [eventId, events.data]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const data = await apiFetch<{
        checkin: { id: string; checkedInAt: string };
        ticket: { holderName: string; status: string };
        replayed?: boolean;
      }>(`/api/v1/events/id/${eventId}/checkins`, {
        method: "POST",
        json: { qrToken },
      });
      setResult(
        `${data.replayed ? "Já utilizado" : "Entrada válida"} — ${data.ticket.holderName} · ${new Date(data.checkin.checkedInAt).toLocaleString("pt-BR")}`,
      );
      setQrToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no check-in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="checkin-shell">
        <header className="page-hero-block">
          <p className="muted">Operação</p>
          <h1>Check-in</h1>
          <p>Selecione o evento e cole o token QR do ingresso.</p>
        </header>

        <section className="surface-card">
          <form className="stack" onSubmit={(e) => void onSubmit(e)}>
            <label className="field">
              Organizador
              <select
                value={organizerId}
                onChange={(e) => {
                  setOrganizerId(e.target.value);
                  setEventId("");
                }}
                disabled={organizers.isLoading || !organizers.data?.length}
                required
              >
                {!organizers.data?.length ? (
                  <option value="">Nenhum organizador</option>
                ) : (
                  organizers.data.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="field">
              Evento
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                disabled={!organizerId || events.isLoading || !events.data?.length}
                required
              >
                {!events.data?.length ? (
                  <option value="">Nenhum evento</option>
                ) : (
                  events.data.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.status})
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="field">
              QR Token
              <input
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="Cole o código do ingresso"
                autoComplete="off"
                required
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            {result ? <p className="success">{result}</p> : null}
            <button className="button auth-submit" type="submit" disabled={!eventId || busy}>
              {busy ? "Validando…" : "Validar entrada"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
