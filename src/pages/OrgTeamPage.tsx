import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api.js";
import { useOrganizerSelection } from "../lib/organizer-selection.js";
import { statusPillClass } from "../lib/status.js";

type Member = {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
};

export function OrgTeamPage() {
  const queryClient = useQueryClient();
  const { organizerId, setOrganizerId, organizers, selected } =
    useOrganizerSelection();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MANAGER" | "CHECKIN">("CHECKIN");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const members = useQuery({
    queryKey: ["org-members", organizerId],
    enabled: Boolean(organizerId),
    queryFn: async () => {
      const data = await apiFetch<{ items: Member[] }>(
        `/api/v1/organizers/${organizerId}/members`,
      );
      return data.items;
    },
  });

  const invite = useMutation({
    mutationFn: async (event: FormEvent) => {
      event.preventDefault();
      return apiFetch(`/api/v1/organizers/${organizerId}/members`, {
        method: "POST",
        json: { email, role },
      });
    },
    onSuccess: async () => {
      setMessage("Membro adicionado.");
      setError(null);
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["org-members", organizerId] });
    },
    onError: (err: unknown) => {
      setMessage(null);
      setError(err instanceof Error ? err.message : "Falha ao convidar.");
    },
  });

  const isOwner = selected?.role === "OWNER";

  return (
    <main className="page">
      <header className="page-hero-block">
        <p className="muted">Acesso</p>
        <h1>Equipe</h1>
        <p>Convide gestores e staff de check-in já cadastrados.</p>
      </header>

      <label className="field" style={{ maxWidth: 320 }}>
        Organizador
        <select
          value={organizerId}
          onChange={(e) => setOrganizerId(e.target.value)}
          disabled={organizers.isLoading || !organizers.data?.length}
        >
          {!organizers.data?.length ? (
            <option value="">Nenhum organizador</option>
          ) : (
            organizers.data.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.role})
              </option>
            ))
          )}
        </select>
      </label>

      {members.isLoading ? <p className="muted">Carregando equipe…</p> : null}
      {members.isError ? (
        <p className="error">
          {(members.error as Error).message ?? "Falha ao carregar equipe."}
        </p>
      ) : null}

      <section className="surface-card stack">
        <h2 style={{ margin: 0 }}>Membros</h2>
        {(members.data ?? []).length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Nenhum membro listado.
          </p>
        ) : (
          <ul className="plain-list">
            {(members.data ?? []).map((member) => (
              <li key={member.id}>
                <strong>{member.name}</strong> · {member.email} ·{" "}
                <span className={statusPillClass(member.role)}>{member.role}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface-card stack">
        <h2 style={{ margin: 0 }}>Convidar membro</h2>
        {!isOwner ? (
          <p className="muted" style={{ margin: 0 }}>
            Apenas o OWNER pode convidar novos membros.
          </p>
        ) : (
          <form className="stack" onSubmit={(e) => void invite.mutate(e)}>
            <label className="field">
              E-mail do usuário
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@eventflow.local"
                required
              />
            </label>
            <label className="field">
              Papel
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "MANAGER" | "CHECKIN")}
              >
                <option value="CHECKIN">CHECKIN</option>
                <option value="MANAGER">MANAGER</option>
              </select>
            </label>
            <button className="button" type="submit" disabled={invite.isPending}>
              {invite.isPending ? "Convidando…" : "Adicionar à equipe"}
            </button>
          </form>
        )}
        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  );
}
