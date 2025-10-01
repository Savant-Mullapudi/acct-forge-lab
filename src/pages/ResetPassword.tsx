import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import "../styles/reset-password.css";
import logoFullDark from '@/assets/logo-full-dark.png';
import loginBackground from '@/assets/login-background.png';

export default function ResetPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedOtp, setTouchedOtp] = useState(false);
  const [touchedPwd, setTouchedPwd] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const emailValid = (v: string) => /\S+@\S+\.\S+/.test(v);
  const emailError = touchedEmail && !emailValid(email) ? "Please enter a valid email address" : "";
  const otpError = touchedOtp && otp.length !== 6 ? "Please enter the 6-digit code" : "";
  const pwdError = touchedPwd && newPassword.length < 6 ? "Password must be at least 6 characters" : "";
  const confirmError = touchedConfirm && newPassword !== confirmPassword ? "Passwords do not match" : "";

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setTouchedEmail(true);

    if (!emailValid(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: functionError } = await supabase.functions.invoke('send-reset-code', {
        body: { email: email.trim() },
      });

      if (functionError) {
        console.error('Send code error:', functionError);
      }

      setStep(2);
      setLoading(false);
    } catch (error) {
      console.error('Send code error:', error);
      setStep(2);
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setTouchedOtp(true);

    if (otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verify the code exists and is valid before proceeding (without password)
      const { data, error: verifyError } = await supabase.functions.invoke('verify-reset-code', {
        body: { 
          email: email.trim(),
          code: otp,
          // Don't send newPassword yet - just verify the code
        },
      });

      // If code is invalid or expired, show error and stay on step 2
      if (verifyError || data?.error) {
        setError(data?.error || "Invalid or expired code. Please try again.");
        setLoading(false);
        return;
      }

      // Code is valid, proceed to step 3
      setStep(3);
      setLoading(false);
    } catch (error) {
      console.error('Verify code error:', error);
      setError("Failed to verify code. Please try again.");
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setTouchedPwd(true);
    setTouchedConfirm(true);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-reset-code', {
        body: { 
          email: email.trim(),
          code: otp,
          newPassword: newPassword,
        },
      });

      if (verifyError || data?.error) {
        setError(data?.error || "Invalid or expired code. Please try again.");
        setLoading(false);
        return;
      }

      navigate('/login');
    } catch (error) {
      console.error('Reset password error:', error);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
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

        {step === 1 && (
          <>
            <h1 className="rp-title">Reset your password</h1>
            <p className="rp-subtitle">We'll email you a 6-digit verification code</p>

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

            <form className="rp-form" onSubmit={handleSendOTP} noValidate>
              <div className="field">
                <input
                  className={`input ${emailError ? 'input-error' : ''}`}
                  type="email"
                  placeholder=" "
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouchedEmail(true)}
                  aria-invalid={!!emailError}
                  aria-describedby="resetEmailErr"
                  data-testid="input-email"
                  required
                />
                <label className="floating-label">Email address</label>
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
                data-testid="button-send-code"
              >
                {loading ? 'SENDING...' : 'SEND CODE'}
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
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="rp-title">Enter verification code</h1>
            <p className="rp-subtitle">If an account exists for <strong>{email}</strong>, we've sent a 6-digit code</p>

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

            <form className="rp-form" onSubmit={handleVerifyOTP} noValidate>
              <div className="field">
                <input
                  className={`input ${otpError ? 'input-error' : ''}`}
                  type="text"
                  placeholder=" "
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  onBlur={() => setTouchedOtp(true)}
                  aria-invalid={!!otpError}
                  aria-describedby="otpErr"
                  data-testid="input-otp"
                  required
                />
                <label className="floating-label">6-digit code</label>
                {otpError && (
                  <div
                    id="otpErr"
                    className="field-error"
                    data-testid="text-otp-error"
                  >
                    {otpError}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="rp-submit"
                disabled={loading}
                data-testid="button-verify-code"
              >
                {loading ? 'VERIFYING...' : 'VERIFY CODE'}
              </button>

              <div className="rp-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rp-link"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  data-testid="link-back"
                >
                  Back
                </button>
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="rp-title">Set new password</h1>
            <p className="rp-subtitle">Enter your new password below</p>

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

            <form className="rp-form" onSubmit={handleResetPassword} noValidate>
              <div className="field">
                <input
                  className={`input ${pwdError ? 'input-error' : ''}`}
                  type={showPwd ? "text" : "password"}
                  placeholder=" "
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onBlur={() => setTouchedPwd(true)}
                  aria-invalid={!!pwdError}
                  aria-describedby="pwdErr"
                  data-testid="input-new-password"
                  required
                />
                <label className="floating-label">New password</label>
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPwd(!showPwd)}
                  tabIndex={-1}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  data-testid="button-toggle-password"
                >
                  {showPwd ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 3l18 18M10.5 10.677a2 2 0 002.823 2.823M7.362 7.561C5.68 8.74 4.279 10.42 3 12c1.889 2.991 5.282 6 9 6 1.55 0 3.043-.523 4.395-1.453M12 6c4.008 0 6.701 3.158 9 6a15.66 15.66 0 01-1.658 2.122"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </button>
                {pwdError && (
                  <div
                    id="pwdErr"
                    className="field-error"
                    data-testid="text-password-error"
                  >
                    {pwdError}
                  </div>
                )}
              </div>

              <div className="field">
                <input
                  className={`input ${confirmError ? 'input-error' : ''}`}
                  type={showConfirm ? "text" : "password"}
                  placeholder=" "
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouchedConfirm(true)}
                  aria-invalid={!!confirmError}
                  aria-describedby="confirmErr"
                  data-testid="input-confirm-password"
                  required
                />
                <label className="floating-label">Confirm password</label>
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirm ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 3l18 18M10.5 10.677a2 2 0 002.823 2.823M7.362 7.561C5.68 8.74 4.279 10.42 3 12c1.889 2.991 5.282 6 9 6 1.55 0 3.043-.523 4.395-1.453M12 6c4.008 0 6.701 3.158 9 6a15.66 15.66 0 01-1.658 2.122"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </button>
                {confirmError && (
                  <div
                    id="confirmErr"
                    className="field-error"
                    data-testid="text-confirm-password-error"
                  >
                    {confirmError}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="rp-submit"
                disabled={loading}
                data-testid="button-reset-password"
              >
                {loading ? 'UPDATING...' : 'RESET PASSWORD'}
              </button>
            </form>
          </>
        )}
      </div>

      <div className="rp-col-art">
        <img src={loginBackground} alt="" />
      </div>
    </div>
  );
}
