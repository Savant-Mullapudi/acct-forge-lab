import React from 'react';

type Props = {
  fullName?: string;
  email?: string;
  onEdit?: () => void;
  open: boolean;
  onToggle: () => void;
  onContinue: () => void;
};

const emailRegex = /^\S+@\S+\.\S+$/;

export default function SignUpCard({
  fullName = 'John Doe',
  email = 'johndoe@gmail.com',
  onEdit,
  open,
  onToggle,
  onContinue,
}: Props) {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [mail, setMail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [agreePrivacy, setAgreePrivacy] = React.useState(false);
  const [agreeMarketing, setAgreeMarketing] = React.useState(false);

  const [savedName, setSavedName] = React.useState(fullName);
  const [savedEmail, setSavedEmail] = React.useState(email);

  const [touched, setTouched] = React.useState({
    firstName: false,
    lastName: false,
    mail: false,
    password: false,
    confirm: false,
    terms: false,
    privacy: false,
  });

  const firstNameError =
    touched.firstName && firstName.trim() === '' ? 'First name is required' : '';
  const lastNameError =
    touched.lastName && lastName.trim() === '' ? 'Last name is required' : '';
  const mailError =
    touched.mail && !emailRegex.test(mail) ? 'Enter a valid email address' : '';
  const passwordError =
    touched.password && password.length < 8 ? 'Minimum 8 characters' : '';
  const confirmError =
    touched.confirm && confirm !== password ? 'Passwords do not match' : '';
  const termsError =
    touched.terms && !agreeTerms ? 'You must accept the Terms' : '';
  const privacyError =
    touched.privacy && !agreePrivacy ? 'You must accept auto-renewal' : '';

  const passwordsMatch = password.length >= 8 && password === confirm;
  const requiredFilled =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    emailRegex.test(mail) &&
    password.length >= 8 &&
    passwordsMatch &&
    agreeTerms &&
    agreePrivacy;

  function markAllTouched() {
    setTouched((t) => ({
      ...t,
      firstName: true,
      lastName: true,
      mail: true,
      password: true,
      confirm: true,
      terms: true,
      privacy: true,
    }));
  }

  function handleContinue() {
    if (!requiredFilled) {
      markAllTouched();
      return;
    }
    setSavedName(`${firstName.trim()} ${lastName.trim()}`);
    setSavedEmail(mail.trim());
    onContinue();
  }

  return (
    <section className={`card ${open ? 'is-open' : ''}`}>
      <div className="cardBody">
        <div className="rowTitle" style={{ marginBottom: 10 }}>
          <h3 className="sectionTitle">Sign Up</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {open ? (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Have an account? <a href="/login">Sign in</a>
              </div>
            ) : (
              <a
                className="btnGhost"
                onClick={onToggle}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
              >
                Edit
                <i
                  className="fa fa-chevron-down"
                  aria-hidden="true"
                  style={{ fontSize: 10, color: 'grey' }}
                />
              </a>
            )}
          </div>
        </div>

        {!open && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Full name</div>
              <div style={{ fontSize: 14 }}>{savedName}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Email address</div>
              <div style={{ fontSize: 14 }}>{savedEmail}</div>
            </div>
          </div>
        )}

        {open && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
              You will be owner of this account and receive full access to admin features.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field">
                <input
                  className={`input ${firstNameError ? 'input-error' : ''}`}
                  placeholder=" "
                  aria-label="first name"
                  aria-invalid={!!firstNameError}
                  aria-describedby="firstNameError"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                />
                <label className="floating-label">First name *</label>
                {firstNameError && (
                  <div id="firstNameError" className="field-error">{firstNameError}</div>
                )}
              </div>

              <div className="field">
                <input
                  className={`input ${lastNameError ? 'input-error' : ''}`}
                  placeholder=" "
                  aria-label="last name"
                  aria-invalid={!!lastNameError}
                  aria-describedby="lastNameError"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                />
                <label className="floating-label">Last name *</label>
                {lastNameError && (
                  <div id="lastNameError" className="field-error">{lastNameError}</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div className="field">
                <input
                  className={`input ${mailError ? 'input-error' : ''}`}
                  placeholder=" "
                  aria-label="email"
                  aria-invalid={!!mailError}
                  aria-describedby="emailError"
                  value={mail}
                  onChange={(e) => setMail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, mail: true }))}
                />
                <label className="floating-label">Email address *</label>
                {mailError && (
                  <div id="emailError" className="field-error">{mailError}</div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <div className="field">
                <input
                  className={`input ${passwordError ? 'input-error' : ''}`}
                  type="password"
                  placeholder=" "
                  aria-label="password"
                  aria-invalid={!!passwordError}
                  aria-describedby="passwordError"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                />
                <label className="floating-label">Password (min 8 chars) *</label>
                {passwordError && (
                  <div id="passwordError" className="field-error">{passwordError}</div>
                )}
              </div>

              <div className="field">
                <input
                  className={`input ${confirmError ? 'input-error' : ''}`}
                  type="password"
                  placeholder=" "
                  aria-label="confirm password"
                  aria-invalid={!!confirmError}
                  aria-describedby="confirmError"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                />
                <label className="floating-label">Confirm password *</label>
                {confirmError && (
                  <div id="confirmError" className="field-error">{confirmError}</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  name="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  onBlur={() => setTouched((t) => ({ ...t, terms: true }))}
                />
              <span style={{ fontSize: 13 }}>
                I agree to Trace AQ&apos;s{' '}
                <a
                  href="https://www.traceaq.com/terms-of-use"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#2563eb', textDecoration: 'underline' }}
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="https://www.traceaq.com/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#2563eb', textDecoration: 'underline' }}
                >
                  Privacy Policy
                </a>
              </span>
              </label>
              {termsError && <div className="field-error">{termsError}</div>}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <input
                  type="checkbox"
                  name="privacy"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  onBlur={() => setTouched((t) => ({ ...t, privacy: true }))}
                />
                <span style={{ fontSize: 13 }}>
                  I agree to the monthly recurring auto-renewal payment
                </span>
              </label>
              {privacyError && <div className="field-error">{privacyError}</div>}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <input
                  type="checkbox"
                  name="marketing"
                  checked={agreeMarketing}
                  onChange={(e) => setAgreeMarketing(e.target.checked)}
                />
                <span style={{ fontSize: 13 }}>
                  Yes, I'd like to receive newsletters and updates from Trace AQ
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 18 }}>
              <button
                className="btn"
                type="button"
                onClick={handleContinue}
                disabled={!requiredFilled}
                style={{
                  width: '50%',
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  background: requiredFilled ? '#000D94' : 'var(--muted)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: requiredFilled ? 'pointer' : 'not-allowed',
                  opacity: requiredFilled ? 1 : 0.6,
                }}
              >
                CONTINUE TO ADDRESS
              </button>

              <a
                className="btnGhost"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onToggle();
                }}
                role="button"
              >
                Cancel
              </a>
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
              Your account will be created once payment is complete.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
