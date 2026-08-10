import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { coverGradient, formatEventDay, formatEventWhen } from "../lib/event-visual";

type EventListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  city: string | null;
  startsAt: string | null;
  status: string;
  coverImageUrl?: string | null;
  category?: { id: string; name: string; slug: string } | null;
};

type Category = { id: string; name: string; slug: string };

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function HomePage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const [city, setCity] = useState(() => params.get("city") ?? "");
  const [categorySlug, setCategorySlug] = useState(
    () => params.get("category") ?? "",
  );

  const debouncedQ = useDebouncedValue(q, 300);
  const debouncedCity = useDebouncedValue(city, 300);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedQ.trim()) next.set("q", debouncedQ.trim());
    if (debouncedCity.trim()) next.set("city", debouncedCity.trim());
    if (categorySlug) next.set("category", categorySlug);
    setParams(next, { replace: true });
  }, [debouncedQ, debouncedCity, categorySlug, setParams]);

  const queryString = useMemo(() => {
    const search = new URLSearchParams();
    if (debouncedQ.trim()) search.set("q", debouncedQ.trim());
    if (debouncedCity.trim()) search.set("city", debouncedCity.trim());
    if (categorySlug) search.set("categorySlug", categorySlug);
    const raw = search.toString();
    return raw ? `?${raw}` : "";
  }, [debouncedQ, debouncedCity, categorySlug]);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<{ items: Category[] }>("/api/v1/categories"),
    retry: 1,
  });

  const query = useQuery({
    queryKey: ["events", queryString],
    queryFn: () =>
      apiFetch<{ items: EventListItem[] }>(`/api/v1/events${queryString}`),
    retry: 1,
  });

  const items = query.data?.items ?? [];

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <p className="brand" style={{ color: "#fff", fontSize: "1rem" }}>
            <span className="brand-mark" aria-hidden />
            EventFlow
          </p>
          <h1 className="brand-hero">Encontre o próximo evento. Garanta seu ingresso.</h1>
          <p>
            Catálogo ao vivo com reserva de estoque, checkout seguro e ingresso digital com QR.
          </p>
          <div className="hero-actions">
            <a className="button" href="#catalogo">
              Ver eventos
            </a>
            <Link className="button ghost-light" to="/login?as=organizer">
              Sou organizador
            </Link>
          </div>
        </div>
      </section>

      <section className="catalog" id="catalogo">
        <div className="catalog-toolbar">
          <div>
            <h2>Eventos em destaque</h2>
            <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
              {query.isLoading
                ? "Carregando…"
                : `${items.length} evento${items.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        <div className="filter-bar">
          <label className="search-field">
            <span className="sr-only">Buscar</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, cidade ou categoria"
              aria-label="Buscar eventos"
            />
          </label>
          <label className="field filter-field">
            Cidade
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex.: São Paulo"
              aria-label="Filtrar por cidade"
            />
          </label>
          <label className="field filter-field">
            Categoria
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              aria-label="Filtrar por categoria"
            >
              <option value="">Todas</option>
              {(categories.data?.items ?? []).map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {query.isError && (
          <p className="error">
            Não foi possível carregar o catálogo.
            {query.error instanceof Error ? ` ${query.error.message}` : ""}
          </p>
        )}

        <div className="grid events">
          {items.map((event, index) => {
            const day = formatEventDay(event.startsAt);
            const cover = event.coverImageUrl
              ? `url(${event.coverImageUrl})`
              : coverGradient(event.slug);
            return (
              <Link
                key={event.id}
                to={`/events/${event.slug}`}
                className="event-card"
                style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
              >
                <div
                  className="event-cover"
                  style={{ backgroundImage: cover }}
                >
                  {day ? (
                    <div className="event-date-chip">
                      <div>{day.day}</div>
                      <div>{day.month}</div>
                    </div>
                  ) : null}
                </div>
                <div className="event-body">
                  {event.category ? (
                    <span className="category-pill">{event.category.name}</span>
                  ) : null}
                  <strong>{event.title}</strong>
                  <span className="event-meta">
                    {formatEventWhen(event.startsAt)}
                    {event.city ? ` · ${event.city}` : ""}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {!query.isLoading && items.length === 0 && (
          <div className="panel">
            <p style={{ margin: 0 }}>Nenhum evento encontrado para esses filtros.</p>
          </div>
        )}
      </section>
    </>
  );
}
