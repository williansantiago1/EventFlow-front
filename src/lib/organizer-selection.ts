import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api.js";
import { getDemoContext, setDemoContext } from "./demo-context.js";

export type OrganizerSummary = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export function useOrganizerSelection() {
  const [organizerId, setOrganizerId] = useState(
    () => getDemoContext().organizerId ?? "",
  );

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

  useEffect(() => {
    if (organizerId) {
      setDemoContext({ organizerId });
    }
  }, [organizerId]);

  const selected = organizers.data?.find((item) => item.id === organizerId) ?? null;
  const canManage =
    selected?.role === "OWNER" || selected?.role === "MANAGER";

  return {
    organizerId,
    setOrganizerId,
    organizers,
    selected,
    canManage,
  };
}
