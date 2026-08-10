const ORGANIZER_ID_KEY = "ef_organizer_id";
const EVENT_ID_KEY = "ef_event_id";
const EVENT_SLUG_KEY = "ef_event_slug";

export type DemoContext = {
  organizerId: string | null;
  eventId: string | null;
  eventSlug: string | null;
};

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore quota / private mode
  }
}

export function getDemoContext(): DemoContext {
  return {
    organizerId: read(ORGANIZER_ID_KEY),
    eventId: read(EVENT_ID_KEY),
    eventSlug: read(EVENT_SLUG_KEY),
  };
}

export function setDemoContext(partial: {
  organizerId?: string | null;
  eventId?: string | null;
  eventSlug?: string | null;
}): void {
  if (partial.organizerId !== undefined) {
    write(ORGANIZER_ID_KEY, partial.organizerId);
  }
  if (partial.eventId !== undefined) {
    write(EVENT_ID_KEY, partial.eventId);
  }
  if (partial.eventSlug !== undefined) {
    write(EVENT_SLUG_KEY, partial.eventSlug);
  }
}

export function clearDemoContext(): void {
  write(ORGANIZER_ID_KEY, null);
  write(EVENT_ID_KEY, null);
  write(EVENT_SLUG_KEY, null);
}
