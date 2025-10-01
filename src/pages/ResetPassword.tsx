import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import "../styles/reset-password.css";
import logoFullDark from '@/assets/logo-full-dark.png';
import loginBackground from '@/assets/login-background.png';

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();

  const emailValid = (v: string) => /\S+@\S+\.\S+/.test(v);
  const emailError = touched && !emailValid(email) ? "Please enter a valid email address" : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);

    if (!emailValid(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetError) {
        setError("Unable to send reset email. Please try again.");
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch (error) {
      console.error('Password reset error:', error);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rp-wrap">
        <div className="rp-col rp-col-form">
          <div className="rp-brand">
            <img
              src={logoFullDark}
              alt="Trace AQ | Aero"
              width={350}
              height={50}
            />
          </div>

          <h1 className="rp-title">Check your email</h1>
          <p className="rp-subtitle">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="rp-subtitle">
            Click the link in the email to reset your password.
          </p>

          <button
            className="rp-submit"
            onClick={() => navigate('/login')}
            data-testid="button-back-to-login"
          >
            BACK TO LOGIN
          </button>
        </div>

        <div className="rp-col-art">
          <img src={loginBackground} alt="" />
        </div>
      </div>
    );
  }

  return (
    <div className="rp-wrap">
      <div className="rp-col rp-col-form">
        <div className="rp-brand">
          <img
            src={logoFullDark}
            alt="Trace AQ | Aero"
            width={350}
            height={50}
          />
        </div>

        <h1 className="rp-title">Reset your password</h1>
        <p className="rp-subtitle">We'll email you a link to reset your password</p>

        {error && (
          <div className="rp-error" role="alert" data-testid="text-error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1" />
              <path
                d="M12 7v6m0 4h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form className="rp-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <input
              className={`input ${emailError ? 'input-error' : ''}`}
              type="email"
              placeholder="Email address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={!!emailError}
              aria-describedby="resetEmailErr"
              data-testid="input-email"
              required
            />
            {emailError && (
              <div
                id="resetEmailErr"
                className="field-error"
                data-testid="text-email-error"
              >
                {emailError}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="rp-submit"
            disabled={loading}
            data-testid="button-send-email"
          >
            {loading ? 'SENDING...' : 'SEND EMAIL'}
          </button>

          <div className="rp-center">
            <a
              href="/login"
              className="rp-link"
              data-testid="link-back-to-login"
            >
              Back to login
            </a>
          </div>
        </form>
      </div>

      <div className="rp-col-art">
        <img src={loginBackground} alt="" />
      </div>
    </div>
  );
}
