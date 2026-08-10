import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { setDemoContext } from "../lib/demo-context";
import { formatMoney } from "../lib/money";

const STEPS = [
  { id: 1, label: "Organizador" },
  { id: 2, label: "Evento" },
  { id: 3, label: "Oferta" },
] as const;

export function OrganizerWizardPage() {
  const navigate = useNavigate();
  const { refreshMe, memberships } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [organizerId, setOrganizerId] = useState<string | null>(
    memberships[0]?.organizerId ?? null,
  );
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventSlug, setEventSlug] = useState<string | null>(null);

  const [orgName, setOrgName] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [city, setCity] = useState("");
  const [offerName, setOfferName] = useState("Pista");
  const [priceCents, setPriceCents] = useState(5000);
  const [capacity, setCapacity] = useState(100);

  async function createOrganizer(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (organizerId) {
        setStep(2);
        return;
      }
      const data = await apiFetch<{ organizer: { id: string } }>("/api/v1/organizers", {
        method: "POST",
        json: { name: orgName },
      });
      setOrganizerId(data.organizer.id);
      setDemoContext({ organizerId: data.organizer.id });
      await refreshMe();
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar organizador.");
    } finally {
      setBusy(false);
    }
  }

  async function createEvent(event: FormEvent) {
    event.preventDefault();
    if (!organizerId) return;
    setError(null);
    setBusy(true);
    try {
      const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const data = await apiFetch<{ event: { id: string; slug: string } }>(
        `/api/v1/organizers/${organizerId}/events`,
        {
          method: "POST",
          json: {
            title: eventTitle,
            summary: "Evento criado pelo wizard EventFlow",
            startsAt,
            location: {
              venueName: "Arena EventFlow",
              addressLine1: "Rua das Flores, 100",
              city,
              state: "SP",
            },
          },
        },
      );
      setEventId(data.event.id);
      setEventSlug(data.event.slug);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar evento.");
    } finally {
      setBusy(false);
    }
  }

  async function createOfferAndPublish(event: FormEvent) {
    event.preventDefault();
    if (!eventId || !organizerId || !eventSlug) return;
    setError(null);
    setBusy(true);
    try {
      const lot = await apiFetch<{ lot: { id: string } }>(
        `/api/v1/events/id/${eventId}/lots`,
        {
          method: "POST",
          json: { name: "Lote 1" },
        },
      );
      await apiFetch(`/api/v1/events/id/${eventId}/offers`, {
        method: "POST",
        json: {
          lotId: lot.lot.id,
          name: offerName,
          priceCents,
          capacity,
        },
      });
      await apiFetch(`/api/v1/events/id/${eventId}/publish`, { method: "POST" });
      setDemoContext({
        organizerId,
        eventId,
        eventSlug,
      });
      await refreshMe();
      navigate(`/events/${eventSlug}`, { state: { justPublished: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao publicar evento.");
    } finally {
      setBusy(false);
    }
  }

  const hasOrganizer = Boolean(organizerId);

  return (
    <main className="page">
      <div className="wizard-shell">
        <header className="page-hero-block">
          <p className="muted">Publicação rápida</p>
          <h1>Novo evento</h1>
          <p>Três passos: perfil, evento e oferta. Depois você edita no painel.</p>
        </header>

        <div className="step-rail" aria-label="Passos do wizard">
          {STEPS.map((item) => (
            <span
              key={item.id}
              className={`step-chip${
                step === item.id ? " is-active" : step > item.id ? " is-done" : ""
              }`}
            >
              {item.id} · {item.label}
            </span>
          ))}
        </div>

        <section className="surface-card stack">
          {error ? <p className="error">{error}</p> : null}

          {step === 1 && (
            <form className="stack" onSubmit={(e) => void createOrganizer(e)}>
              <h2 style={{ margin: 0 }}>
                {hasOrganizer ? "Usar organizador atual" : "Criar organizador"}
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                {hasOrganizer
                  ? "Você já tem um perfil. Continue para criar o evento."
                  : "Nome público da sua produtora ou marca."}
              </p>
              {!hasOrganizer ? (
                <label className="field">
                  Nome do organizador
                  <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ex.: Arena Norte"
                    required
                  />
                </label>
              ) : null}
              <button className="button" type="submit" disabled={busy}>
                {busy ? "Salvando…" : "Continuar"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="stack" onSubmit={(e) => void createEvent(e)}>
              <h2 style={{ margin: 0 }}>Dados do evento</h2>
              <p className="muted" style={{ margin: 0 }}>
                Data inicial sugerida: daqui a 7 dias. Você pode ajustar depois.
              </p>
              <label className="field">
                Título do evento
                <input
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Ex.: Noite Indie no Parque"
                  required
                />
              </label>
              <label className="field">
                Cidade
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="São Paulo"
                  required
                />
              </label>
              <div className="inline-form">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setStep(1)}
                >
                  Voltar
                </button>
                <button className="button" type="submit" disabled={busy}>
                  {busy ? "Criando…" : "Continuar"}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form className="stack" onSubmit={(e) => void createOfferAndPublish(e)}>
              <h2 style={{ margin: 0 }}>Oferta e publicação</h2>
              <p className="muted" style={{ margin: 0 }}>
                Criamos o lote 1, a oferta e publicamos o evento.
              </p>
              <label className="field">
                Nome da oferta
                <input
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  required
                />
              </label>
              <div className="form-two">
                <label className="field">
                  Preço
                  <input
                    type="number"
                    value={priceCents}
                    onChange={(e) => setPriceCents(Number(e.target.value))}
                    min={0}
                    required
                  />
                  <span className="muted" style={{ fontWeight: 400 }}>
                    {formatMoney(priceCents)} (valor em centavos)
                  </span>
                </label>
                <label className="field">
                  Capacidade
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    min={1}
                    required
                  />
                </label>
              </div>
              <div className="inline-form">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setStep(2)}
                >
                  Voltar
                </button>
                <button className="button" type="submit" disabled={busy}>
                  {busy ? "Publicando…" : "Publicar evento"}
                </button>
              </div>
            </form>
          )}
        </section>

        <p className="muted" style={{ textAlign: "center", margin: 0 }}>
          Prefere editar depois? <Link to="/org/events">Ir para meus eventos</Link>
        </p>
      </div>
    </main>
  );
}
