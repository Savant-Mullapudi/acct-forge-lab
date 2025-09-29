import React from 'react';
import { Country, State } from 'country-state-city';

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;        // store ISO code (e.g., 'CA', 'MH', etc.)
  postalCode?: string;
  country?: string;      // store ISO code (e.g., 'US', 'CA', 'IN')
};

type Props = {
  value?: Address;
  onChange?: (addr: Address) => void;
  open: boolean;
  onToggle: () => void;
  onContinue: () => void;
};

export default function AddressCard({
  value = {},
  onChange,
  open,
  onToggle,
  onContinue,
}: Props) {
  const [addr, setAddr] = React.useState<Address>(value);
  const [saved, setSaved] = React.useState<Address>(value);

  const [touched, setTouched] = React.useState({
    line1: false,
    city: false,
    state: false,
    postalCode: false,
    country: false,
  });

  // --- Country/State Lists ---
  const countries = React.useMemo(() => Country.getAllCountries(), []);
  const states = React.useMemo(
    () => (addr.country ? State.getStatesOfCountry(addr.country) : []),
    [addr.country]
  );

  // Helpers to get display names from codes (for preview when closed)
  const countryName = React.useMemo(() => {
    if (!addr.country) return '';
    const c = countries.find(c => c.isoCode === addr.country);
    return c?.name ?? '';
  }, [addr.country, countries]);

  const savedCountryName = React.useMemo(() => {
    if (!saved.country) return '';
    const c = countries.find(c => c.isoCode === saved.country);
    return c?.name ?? '';
  }, [saved.country, countries]);

  const stateName = React.useMemo(() => {
    if (!addr.country || !addr.state) return '';
    const s = states.find(s => s.isoCode === addr.state);
    return s?.name ?? '';
  }, [addr.country, addr.state, states]);

  const savedStateName = React.useMemo(() => {
    if (!saved.country || !saved.state) return '';
    const list = State.getStatesOfCountry(saved.country);
    const s = list.find(s => s.isoCode === saved.state);
    return s?.name ?? '';
  }, [saved.country, saved.state]);

  // --- Validation (keep your style) ---
  const update = (k: keyof Address, v: string) => {
    const next = { ...addr, [k]: v };
    setAddr(next);
    onChange?.(next);
  };

  const line1Error =
    touched.line1 && !addr.line1?.trim() ? 'Street address is required' : '';

  const cityError =
    touched.city && !addr.city?.trim() ? 'City is required' : '';

  const stateError = (() => {
    if (!touched.state) return '';
    const v = (addr.state || '').trim();
    if (!v) return 'State/Province is required';
    return '';
  })();

  const postalError = (() => {
    if (!touched.postalCode) return '';
    const v = (addr.postalCode || '').trim();
    if (!v) return 'Postal code is required';
    // Optional: keep numeric-only while you’re early. Many countries have letters, so
    // if you want global correctness, remove the numeric-only rule and just required.
    // return '';
    if (!/^\d+$/.test(v)) return 'Only numbers allowed';
    return '';
  })();

  const countryError =
    touched.country && !(addr.country || '').trim() ? 'Country is required' : '';

  const noErrors =
    !line1Error && !cityError && !stateError && !postalError && !countryError;

  const requiredFilled =
    (addr.line1 ?? '').trim() !== '' &&
    (addr.city ?? '').trim() !== '' &&
    (addr.state ?? '').trim() !== '' &&
    (addr.postalCode ?? '').trim() !== '' &&
    (addr.country ?? '').trim() !== '' &&
    noErrors;

  const markAllTouched = () =>
    setTouched({ line1: true, city: true, state: true, postalCode: true, country: true });

  function handleContinue() {
    if (!requiredFilled) {
      markAllTouched();
      return;
    }
    setSaved({ ...addr });
    onContinue();
  }

  // Reset state when country changes
  const handleCountryChange = (iso: string) => {
    update('country', iso);
    update('state', ''); // clear state/province
  };

  return (
    <section className={`card ${open ? 'is-open' : ''}`}>
      <div className="cardBody">
        <div className="rowTitle" style={{ marginBottom: 10 }}>
          <h3 className="sectionTitle">Address</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!open && requiredFilled ? (
              <a
                className="btnGhost"
                onClick={onToggle}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
              >
                Edit
                <i className="fa fa-chevron-right" aria-hidden="true" style={{ fontSize: 10, color: 'grey' }} />
              </a>
            ) : null}
          </div>
        </div>

        {/* Collapsed preview */}
        {!open && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 14 }}>
              {saved.line1}
              {saved.line2 ? `, ${saved.line2}` : ''}
            </div>
            <div style={{ fontSize: 14, marginTop: 6 }}>
              {saved.city}{saved.city && ','} {savedStateName} {saved.postalCode}
            </div>
            <div style={{ fontSize: 14, marginTop: 6 }}>{savedCountryName}</div>
          </div>
        )}

        {/* Expanded form */}
        {open && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
              Enter the billing address for this account.
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {/* Street */}
              <div className="field">
                <input
                  className={`input ${line1Error ? 'input-error' : ''}`}
                  placeholder=" "
                  aria-label="street address"
                  aria-invalid={!!line1Error}
                  aria-describedby="line1Error"
                  value={addr.line1 ?? ''}
                  onChange={e => update('line1', e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, line1: true }))}
                />
                <label className="floating-label">Street address *</label>
                {line1Error && <div id="line1Error" className="field-error">{line1Error}</div>}
              </div>

              {/* Apt/suite */}
              <div className="field">
                <input
                  className="input"
                  placeholder=" "
                  aria-label="apt suite"
                  value={addr.line2 ?? ''}
                  onChange={e => update('line2', e.target.value)}
                />
                <label className="floating-label">Apt, suite, etc. (optional)</label>
              </div>

              {/* City / State / Postal */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', gap: 10 }}>
                {/* City */}
                <div className="field">
                  <input
                    className={`input ${cityError ? 'input-error' : ''}`}
                    placeholder=" "
                    aria-label="city"
                    aria-invalid={!!cityError}
                    aria-describedby="cityError"
                    value={addr.city ?? ''}
                    onChange={e => update('city', e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, city: true }))}
                  />
                  <label className="floating-label">City *</label>
                  {cityError && <div id="cityError" className="field-error">{cityError}</div>}
                </div>

                {/* State/Province */}
                <div className="field">
                  <select
                    className={`input ${stateError ? 'input-error' : ''}`}
                    aria-label="state"
                    aria-invalid={!!stateError}
                    aria-describedby="stateError"
                    value={addr.state ?? ''}
                    onChange={e => update('state', e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, state: true }))}
                    disabled={!addr.country}
                    style={{
                      paddingTop: 18, paddingBottom: 8, paddingRight: 32,
                      backgroundColor: '#fff',
                      cursor: !addr.country ? 'not-allowed' : 'pointer',
                      appearance: 'none',
                      backgroundImage:
                        'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 8px center',
                      backgroundSize: '16px',
                    }}
                  >
                    <option value=""></option>
                    {states.map(s => (
                      <option key={`${s.countryCode}-${s.isoCode}`} value={s.isoCode}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <label
                    className="floating-label"
                    style={{ top: addr.state ? 6 : 18, pointerEvents: 'none' }}
                  >
                    State/Prov. *
                  </label>
                  {stateError && <div id="stateError" className="field-error">{stateError}</div>}
                </div>

                {/* Postal */}
                <div className="field">
                  <input
                    className={`input ${postalError ? 'input-error' : ''}`}
                    placeholder=" "
                    aria-label="postal code"
                    aria-invalid={!!postalError}
                    aria-describedby="postalError"
                    value={addr.postalCode ?? ''}
                    onChange={e => {
                      // If you want *global* correctness, remove numeric-only filter:
                      // update('postalCode', e.target.value);
                      const val = e.target.value.replace(/\D/g, '');
                      update('postalCode', val);
                    }}
                    onBlur={() => setTouched(t => ({ ...t, postalCode: true }))}
                  />
                  <label className="floating-label">Postal code *</label>
                  {postalError && <div id="postalError" className="field-error">{postalError}</div>}
                </div>
              </div>

              {/* Country */}
              <div className="field">
                <select
                  className={`input ${countryError ? 'input-error' : ''}`}
                  aria-label="country"
                  aria-invalid={!!countryError}
                  aria-describedby="countryError"
                  value={addr.country ?? ''}
                  onChange={e => handleCountryChange(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, country: true }))}
                  style={{
                    paddingTop: 18, paddingBottom: 8, paddingRight: 32,
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage:
                      'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '16px',
                  }}
                >
                  <option value=""></option>
                  {countries.map(c => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <label
                  className="floating-label"
                  style={{ top: addr.country ? 6 : 18, pointerEvents: 'none' }}
                >
                  Country *
                </label>
                {countryError && <div id="countryError" className="field-error">{countryError}</div>}
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
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
                    background: requiredFilled ? '#000D94' : '#515151',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: requiredFilled ? 'pointer' : 'not-allowed',
                  }}
                >
                  CONTINUE TO PAYMENT
                </button>

                <a
                  className="btnGhost"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setAddr(saved ?? {});
                    onToggle();
                  }}
                  role="button"
                >
                  Cancel
                </a>
              </div>

              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {/* Optional: show selected names for debugging */}
                {/* Country: {countryName} — State: {stateName} */}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
