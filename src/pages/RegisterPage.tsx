import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";

type Intent = "participant" | "organizer";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [intent, setIntent] = useState<Intent>(
    params.get("intent") === "organizer" ? "organizer" : "participant",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(name, email, password);
      navigate(intent === "organizer" ? "/org/events/new" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no cadastro.");
    } finally {
      setLoading(false);
    }
  }

  const isOrganizer = intent === "organizer";

  return (
    <section className="auth-screen">
      <aside className="auth-aside" aria-hidden>
        <div className="auth-aside-glow" />
        <div className="auth-aside-content">
          <p className="brand auth-aside-brand">
            <span className="brand-mark" />
            EventFlow
          </p>
          <h2 className="auth-aside-title">
            {isOrganizer
              ? "Publique. Venda. Opere o evento."
              : "Ache o evento. Garanta o ingresso."}
          </h2>
          <p className="auth-aside-copy">
            {isOrganizer
              ? "Depois do cadastro você monta o perfil, cria o evento e abre as vendas."
              : "Uma conta para reservar, pagar e guardar o QR no celular."}
          </p>
          <ul className="auth-aside-points">
            {isOrganizer ? (
              <>
                <li>Wizard de publicação em minutos</li>
                <li>Lotes, estoque e check-in</li>
                <li>Dashboard com vendas ao vivo</li>
              </>
            ) : (
              <>
                <li>Catálogo com disponibilidade real</li>
                <li>Reserva com tempo limitado</li>
                <li>Ingresso digital com QR</li>
              </>
            )}
          </ul>
        </div>
      </aside>

      <div className="auth-main">
        <div className="auth-form-wrap">
          <header className="auth-form-header">
            <Link to="/" className="brand auth-form-brand">
              <span className="brand-mark" aria-hidden />
              EventFlow
            </Link>
            <h1>Criar conta</h1>
            <p className="muted">
              {isOrganizer
                ? "Comece como organizador — o perfil sai no próximo passo."
                : "Comece como cliente — o organizador fica para depois, se quiser."}
            </p>
          </header>

          <div
            className="intent-cards"
            role="radiogroup"
            aria-label="Como você quer começar"
          >
            <button
              type="button"
              role="radio"
              aria-checked={intent === "participant"}
              className={`intent-card${intent === "participant" ? " is-active" : ""}`}
              onClick={() => setIntent("participant")}
            >
              <strong>Cliente</strong>
              <span>Comprar ingressos</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={intent === "organizer"}
              className={`intent-card${intent === "organizer" ? " is-active" : ""}`}
              onClick={() => setIntent("organizer")}
            >
              <strong>Organizador</strong>
              <span>Criar e vender eventos</span>
            </button>
          </div>

          <form className="stack auth-form" onSubmit={(e) => void onSubmit(e)}>
            <label className="field">
              Nome
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Como devemos te chamar"
                required
              />
            </label>
            <label className="field">
              E-mail
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                required
              />
            </label>
            <label className="field">
              Senha
              <div className="password-field">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </label>

            {error ? <p className="error">{error}</p> : null}

            <button className="button auth-submit" disabled={loading} type="submit">
              {loading
                ? "Criando conta…"
                : isOrganizer
                  ? "Criar conta e abrir wizard"
                  : "Criar conta"}
            </button>
          </form>

          <p className="auth-footer muted">
            Já tem conta?{" "}
            <Link to={isOrganizer ? "/login?as=organizer" : "/login"}>Entrar</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
