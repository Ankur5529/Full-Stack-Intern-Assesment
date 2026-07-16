import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MentorqueBrand from "../components/MentorqueLogo";

const ROLES = [
  { id: "USER", label: "User", emoji: "👤", desc: "Set availability & request calls" },
  { id: "MENTOR", label: "Mentor", emoji: "🧑‍💼", desc: "Manage your schedule" },
  { id: "ADMIN", label: "Admin", emoji: "⚙️", desc: "Match, recommend & book calls" },
];

const ROLE_DEST = { USER: "/availability", MENTOR: "/mentor", ADMIN: "/admin" };

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const expired = searchParams.get("expired") === "1";

  const [activeRole, setActiveRole] = useState("USER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(expired ? "Your session has expired. Please sign in again." : "");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      // Role mismatch warning (soft — still let them in to their actual dashboard)
      if (user.role !== activeRole) {
        setError(
          `Note: Your account is a ${user.role.toLowerCase()}. Redirecting to your dashboard.`
        );
        await new Promise((r) => setTimeout(r, 1200));
      }
      navigate(ROLE_DEST[user.role] || "/availability", { replace: true });
    } catch (err) {
      setError(err?.data?.error || err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(255,255,255,0.06), transparent)",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="flex justify-center mb-8">
          <MentorqueBrand />
        </div>

        {/* Card */}
        <div className="mq-card p-8">
          <h1 className="text-xl font-semibold text-white mb-1">Sign in</h1>
          <p className="text-sm text-ink-400 mb-6">
            Choose your role and enter your credentials.
          </p>

          {/* Role tabs */}
          <div
            role="tablist"
            className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-navy-800/60 border border-white/[0.06] mb-6"
          >
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                id={`role-tab-${r.id.toLowerCase()}`}
                aria-selected={activeRole === r.id}
                onClick={() => { setActiveRole(r.id); setError(""); }}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  activeRole === r.id
                    ? "bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "text-ink-400 hover:text-ink-50 hover:bg-white/[0.04]"
                }`}
              >
                <span className="text-lg leading-none">{r.emoji}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          {/* Role description */}
          <p className="text-xs text-ink-500 mb-5 text-center">
            {ROLES.find((r) => r.id === activeRole)?.desc}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="mq-label"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                className="mq-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mq-label">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                className="mq-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p
                className={`text-sm px-3 py-2 rounded-lg ${
                  error.startsWith("Note:")
                    ? "bg-white/[0.05] text-ink-400 border border-white/[0.08]"
                    : "bg-red-950/60 text-red-400 border border-red-900/50"
                }`}
              >
                {error}
              </p>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="mq-btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                `Sign in as ${ROLES.find((r) => r.id === activeRole)?.label}`
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <p className="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-2">
            Seed accounts
          </p>
          <div className="space-y-1 text-xs text-ink-400 font-mono">
            <div className="flex justify-between">
              <span>admin@mentorque.com</span>
              <span className="text-ink-500">admin123456</span>
            </div>
            <div className="flex justify-between">
              <span>arjun@mentorque.com</span>
              <span className="text-ink-500">user123456</span>
            </div>
            <div className="flex justify-between">
              <span>priya@mentorque.com</span>
              <span className="text-ink-500">mentor123456</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
