import { useAuth } from "../context/AuthContext";

export default function AdminSettings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold text-white">Admin Settings</h1>

      <div className="mq-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Account Info</h2>
        <div className="space-y-3">
          {[
            { label: "Name", value: user?.name },
            { label: "Email", value: user?.email },
            { label: "Role", value: user?.role },
            { label: "Timezone", value: user?.timezone || "UTC" },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-3">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider w-20 shrink-0 pt-0.5">
                {row.label}
              </span>
              <span className="text-sm text-white">{row.value || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mq-card p-6 space-y-3">
        <h2 className="text-base font-semibold text-white">Google Meet Links</h2>
        <p className="text-sm text-ink-400">
          Meet links are automatically generated when you book a call. No OAuth setup required —
          links follow the format{" "}
          <code className="text-ink-300 text-xs bg-navy-700 px-1.5 py-0.5 rounded">
            meet.google.com/mq-xxxxx-xxx
          </code>
          .
        </p>
      </div>

      <div className="mq-card p-6 space-y-3">
        <h2 className="text-base font-semibold text-white">Email Notifications</h2>
        <p className="text-sm text-ink-400">
          Email notifications fire when a booking is confirmed. Configure your email provider
          (Resend / SendGrid / Nodemailer) in{" "}
          <code className="text-ink-300 text-xs bg-navy-700 px-1.5 py-0.5 rounded">
            backend/src/routes/bookings.js
          </code>
          .
        </p>
      </div>
    </div>
  );
}
