import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";

const DEMO = {
  buyer: {
    email: "buyer@eventflow.local",
    label: "Cliente",
    hint: "Comprar e ver ingressos",
  },
  organizer: {
    email: "organizer@eventflow.local",
    label: "Organizador",
    hint: "Eventos, equipe e vendas",
  },
  staff: {
    email: "staff@eventflow.local",
    label: "Staff",
    hint: "Check-in no evento",
  },
} as const;

type DemoKey = keyof typeof DEMO;

function resolveDemoKey(email: string, asOrganizer: boolean): DemoKey | null {
  const match = (Object.keys(DEMO) as DemoKey[]).find(
    (key) => DEMO[key].email === email,
  );
  if (match) return match;
  return asOrganizer ? "organizer" : null;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const asOrganizer = params.get("as") === "organizer";

  const [email, setEmail] = useState<string>(
    asOrganizer ? DEMO.organizer.email : DEMO.buyer.email,
  );
  const [password, setPassword] = useState("EventFlowDemo123!");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const activeDemo = resolveDemoKey(email, asOrganizer);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const memberships = await login(email, password);
      if (asOrganizer || memberships.length > 0) {
        navigate(memberships.length > 0 ? "/org" : "/org/events/new");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login.");
    } finally {
      setLoading(false);
    }
  }

  function pickDemo(key: DemoKey) {
    setEmail(DEMO[key].email);
    setPassword("EventFlowDemo123!");
    setError(null);
  }

  const asideCopy =
    activeDemo === "organizer" || asOrganizer
      ? {
          title: "Entre e cuide dos seus eventos.",
          body: "Dashboard, lotes, equipe e check-in no mesmo lugar.",
          points: ["Gestão pós-publicação", "Vendas e CSV", "Staff com papel certo"],
        }
      : activeDemo === "staff"
        ? {
            title: "Check-in rápido na porta.",
            body: "Use a conta staff para validar ingressos no evento.",
            points: ["Scanner online", "Busca manual", "Check-in único"],
          }
        : {
            title: "Seus ingressos, um login.",
            body: "Compre, acompanhe pedidos e abra o QR na hora.",
            points: ["Catálogo ao vivo", "Checkout demonstrativo", "Ingresso digital"],
          };

  return (
    <section className="auth-screen">
      <aside className="auth-aside" aria-hidden>
        <div className="auth-aside-glow" />
        <div className="auth-aside-content">
          <p className="brand auth-aside-brand">
            <span className="brand-mark" />
            EventFlow
          </p>
          <h2 className="auth-aside-title">{asideCopy.title}</h2>
          <p className="auth-aside-copy">{asideCopy.body}</p>
          <ul className="auth-aside-points">
            {asideCopy.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
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
            <h1>{asOrganizer ? "Entrar como organizador" : "Entrar"}</h1>
            <p className="muted">
              Use uma conta demo abaixo ou digite suas credenciais.
            </p>
          </header>

          <div
            className="intent-cards intent-cards-3"
            role="radiogroup"
            aria-label="Contas demo"
          >
            {(Object.keys(DEMO) as DemoKey[]).map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={activeDemo === key}
                className={`intent-card${activeDemo === key ? " is-active" : ""}`}
                onClick={() => pickDemo(key)}
              >
                <strong>{DEMO[key].label}</strong>
                <span>{DEMO[key].hint}</span>
              </button>
            ))}
          </div>

          <form className="stack auth-form" onSubmit={(e) => void onSubmit(e)}>
            <label className="field">
              E-mail
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="username"
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
                  autoComplete="current-password"
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
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div className="auth-footer-stack">
            <p className="auth-footer muted">
              {asOrganizer ? (
                <>
                  Quer só comprar ingresso? <Link to="/login">Entrar como cliente</Link>
                </>
              ) : (
                <>
                  Vai produzir eventos?{" "}
                  <Link to="/login?as=organizer">Entrar como organizador</Link>
                </>
              )}
            </p>
            <p className="auth-footer muted">
              Não tem conta?{" "}
              <Link to={asOrganizer ? "/register?intent=organizer" : "/register"}>
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
