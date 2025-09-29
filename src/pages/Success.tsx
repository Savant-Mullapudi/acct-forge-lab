import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import '../styles/payment-success.css';

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-14 w-14"
      role="img"
      focusable="false"
      style={{ width: 56, height: 56 }}
    >
      <circle cx="12" cy="12" r="12" fill="#22c55e" />
      <path
        d="M7 12.5l3.2 3.2 6-6"
        fill="none"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3v10m0 0l-4-4m4 4l4-4" stroke="#00FF5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="3" y="15" width="14" height="2" rx="1" fill="#00FF5E"/>
    </svg>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = useMemo(() => searchParams.get("session_id"), [searchParams]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<null | {
    planName: string;
    startDateISO: string;
    renewalDateISO: string;
    status: string;
    email?: string;
    invoiceUrl?: string;
  }>(null);

  useEffect(() => {
    setTimeout(() => {
      const today = new Date();
      const startDateISO = today.toISOString().slice(0, 10);
      const renewalDate = new Date(today);
      renewalDate.setMonth(today.getMonth() + 1);
      const renewalDateISO = renewalDate.toISOString().slice(0, 10);
      setData({
        planName: "Trace AQ (Annual)",
        startDateISO,
        renewalDateISO,
        status: "Active",
        email: "checkout@gmail.com",
        invoiceUrl: "#"
      });
      setLoading(false);
    }, 800);
  }, [sessionId]);

  return (
    <div className="payment-success-container no-header-padding">
      <main className="payment-success-main">
        <div className="payment-success-check">
          <CheckIcon />
        </div>
        <h1 className="payment-success-title">Your subscription is active</h1>
        <p className="payment-success-desc">
          Thank you for subscribing to Trace AQ.
        </p>
        {data?.email && (
          <p className="payment-success-email">
            A confirmation email has been sent to <span className="font-medium">{data.email}</span>
          </p>
        )}
        <section className="payment-success-details-card wide">
          <div className="payment-success-details-header">
            <h2 className="payment-success-details-title">Subscription Details</h2>
            {data?.invoiceUrl && (
              <a
                href={data.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="payment-success-details-download"
              >
                Download Invoice <DownloadIcon />
              </a>
            )}
          </div>
          <ul className="payment-success-details-list">
            <li><span className="text-slate-500">Plan:</span> {data?.planName ?? "—"}</li>
            <li><span className="text-slate-500">Start Date:</span> {formatDate(data?.startDateISO)}</li>
            <li><span className="text-slate-500">Renewal Date:</span> {formatDate(data?.renewalDateISO)}</li>
            <li><span className="text-slate-500">Status:</span> {data?.status ? data.status[0].toUpperCase() + data.status.slice(1) : "—"}</li>
          </ul>
        </section>
        <section className="payment-success-next">
          <h3 className="payment-success-next-title">Next step</h3>
          <p className="payment-success-next-desc">
            <span className="mr-1">👉</span>
            Click <span className="font-semibold">"complete your profile"</span> to set up your login and access the Trace AQ app.
          </p>
          <div className="mt-6 flex items-center justify-center">
            <Link to="/login" className="payment-success-dashboard-btn">
              GO TO LOGIN PAGE
            </Link>
          </div>
        </section>
        {loading && (
          <p className="mt-8 text-sm text-slate-500">Fetching your subscription details…</p>
        )}
        {error && (
          <p className="mt-8 text-sm text-red-600">Could not fetch subscription details. You can still continue to your dashboard.</p>
        )}
      </main>
    </div>
  );
}
