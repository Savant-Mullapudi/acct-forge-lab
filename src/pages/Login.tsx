import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import "../styles/login.css";
import logoFullDark from '@/assets/logo-full-dark.png';
import loginBackground from '@/assets/login-background.png';

export default function Login() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [tEmail, setTEmail] = useState(false);
  const [tPwd, setTPwd] = useState(false);

  const navigate = useNavigate();

  const emailValid = (v: string) => /\S+@\S+\.\S+/.test(v);
  const emailError = !emailValid(email)
    ? "Please enter a valid email address"
    : "";
  const pwdError = pwd.trim().length === 0 ? "Password is required" : "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTEmail(true);
    setTPwd(true);

    if (!emailValid(email) || pwd.trim().length === 0) {
      setError("Please fix the errors below.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Authenticate with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pwd,
      });

      if (authError) {
        // Generic error message to prevent user enumeration
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      const user = data.user;
      if (!user) {
        setError("An unexpected error occurred. Please try again.");
        setLoading(false);
        return;
      }

      // Verify profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile check error:', profileError);
        await supabase.auth.signOut();
        setError("Unable to verify account. Please contact support.");
        setLoading(false);
        return;
      }

      // Create profile if it doesn't exist (using user metadata from signup)
      if (!profile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            first_name: user.user_metadata?.first_name ?? null,
            last_name: user.user_metadata?.last_name ?? null,
          });

        if (insertError) {
          console.error('Profile creation error:', insertError);
          await supabase.auth.signOut();
          setError("Unable to set up account. Please contact support.");
          setLoading(false);
          return;
        }
      }

      // Successful login - navigate to Aero
      setLoading(false);
      window.location.href = "https://aero.traceaq.com/";
    } catch (error) {
      console.error('Unexpected login error:', error);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="lp-wrap">
      <div className="lp-col lp-col-form">
        <div className="lp-brand">
          <img
            src={logoFullDark}
            alt="Trace AQ | Aero"
            width={350}
            height={50}
          />
        </div>

        <h1 className="lp-title lp-title-center">
          Log in to your account
        </h1>

        {error && (
          <div
            className="lp-error"
            role="alert"
            data-testid="text-error-message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="currentColor"
                opacity="0.1"
              />
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

        <form className="lp-form lp-form-grow" onSubmit={onSubmit} noValidate>
          <div className="field">
            <input
              className={`input ${tEmail && emailError ? "input-error" : ""}`}
              type="email"
              placeholder=" "
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTEmail(true)}
              aria-invalid={!!(tEmail && emailError)}
              aria-describedby="loginEmailErr"
              data-testid="input-email"
              required
            />
            <label className="floating-label">
              Email address <span className="lp-req">*</span>
            </label>
            {tEmail && emailError && (
              <div
                id="loginEmailErr"
                className="field-error"
                data-testid="text-email-error"
              >
                {emailError}
              </div>
            )}
          </div>

          <div className="field lp-field-password">
            <input
              className={`input ${tPwd && pwdError ? "input-error" : ""}`}
              type={showPwd ? "text" : "password"}
              placeholder=" "
              autoComplete="current-password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              onBlur={() => setTPwd(true)}
              aria-invalid={!!(tPwd && pwdError)}
              aria-describedby="loginPwdErr"
              data-testid="input-password"
              required
            />
            <label className="floating-label">
              Password <span className="lp-req">*</span>
            </label>

            <button
              type="button"
              className="lp-eye"
              aria-label={showPwd ? "Hide password" : "Show password"}
              onClick={() => setShowPwd((s) => !s)}
              data-testid="button-toggle-password"
            >
              {showPwd ? (
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M3 3l18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-1.2M9.9 5.1A10.7 10.7 0 0121 12c-1.5 2.6-4.9 6-9 6-1.3 0-2.6-.3-3.7-.9M5.2 7.1A10.7 10.7 0 003 12c1.4 2.4 4.6 5.5 8.6 5.9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </button>

            {tPwd && pwdError && (
              <div
                id="loginPwdErr"
                className="field-error"
                data-testid="text-password-error"
              >
                {pwdError}
              </div>
            )}
          </div>

          <div className="lp-row-between">
            <label className="lp-toggle">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                data-testid="input-remember-me"
              />
              <span className="lp-toggle-slider" />
              <span className="lp-toggle-label">Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => navigate('/reset-password')}
              className="lp-link"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              data-testid="link-forgot-password"
            >
              Forgot password?
            </button>
          </div>

          <button
            className="lp-submit"
            type="submit"
            disabled={loading}
            data-testid="button-login"
          >
            {loading ? "LOGGING IN…" : "LOG IN"}
          </button>

          <p className="lp-small lp-center">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="lp-link"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              data-testid="link-toggle-mode"
            >
              Sign up
            </button>
          </p>
        </form>

        <div className="lp-footer">
          <div className="lp-footer-links lp-center">
            <a
              href="mailto:checkout@traceaq.com?subject=Help Request"
              data-testid="link-help"
              style={{ color: "#2563eb"}}
            >
              Help
            </a>
            <span className="lp-dot">|</span>
            <a
              href="https://traceaq.com/terms-of-use"
              target="_blank"
              rel="noreferrer"
              data-testid="link-terms"
              style={{ color: "#2563eb"}}
            >
              Terms
            </a>
            <span className="lp-dot">|</span>
            <a
              href="https://traceaq.com/privacy-policy"
              target="_blank"
              rel="noreferrer"
              data-testid="link-privacy"
              style={{ color: "#2563eb"}}
            >
              Privacy
            </a>
          </div>

          <p className="lp-small lp-recaptcha lp-center">
            This site is protected by reCAPTCHA Enterprise. Google's{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noreferrer"
            >
              Terms of Service
            </a>{" "}
            apply.
          </p>
        </div>
      </div>

      <div className="lp-col lp-col-art" aria-hidden>
        <img
          src={loginBackground}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </div>
  );
}
