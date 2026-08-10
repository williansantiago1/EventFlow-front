import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

type RealtimeStatus = "connecting" | "open" | "closed";

type RealtimeContextValue = {
  status: RealtimeStatus;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

function resolveWsUrl(): string {
  if (import.meta.env.DEV && typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/api/v1/ws`;
  }
  const base = String(import.meta.env.VITE_API_URL ?? "http://localhost:3001");
  const url = new URL(base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/api/v1/ws";
  url.search = "";
  url.hash = "";
  return url.toString();
}

const REALTIME_QUERY_ROOTS = ["dashboard", "events", "tickets"] as const;

/**
 * Connects to the API WebSocket and invalidates react-query caches on domain events.
 * Reconnects with exponential backoff when the socket closes unexpectedly.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const retryRef = useRef(0);
  const closedRef = useRef(false);

  useEffect(() => {
    closedRef.current = false;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (closedRef.current) return;

      const wsUrl = resolveWsUrl();
      setStatus("connecting");
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        retryRef.current = 0;
        setStatus("open");
      };

      socket.onmessage = () => {
        for (const root of REALTIME_QUERY_ROOTS) {
          void queryClient.invalidateQueries({ queryKey: [root] });
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        setStatus("closed");
        if (closedRef.current) return;
        const attempt = retryRef.current;
        retryRef.current = attempt + 1;
        const delayMs = Math.min(1000 * 2 ** attempt, 30_000);
        retryTimer = setTimeout(connect, delayMs);
      };
    };

    connect();

    return () => {
      closedRef.current = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [queryClient]);

  const value = useMemo(() => ({ status }), [status]);

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }
  return ctx;
}
