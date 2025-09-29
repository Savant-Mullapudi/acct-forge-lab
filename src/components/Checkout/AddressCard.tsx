import React from 'react';
import { Country, State } from 'country-state-city';

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;      // ISO code
  postalCode?: string;
  country?: string;    // ISO code
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

  // All countries + states (depends on selected country)
  const countries = React.useMemo(() => Country.getAllCountries(), []);
  const states = React.useMemo(
    () => (addr.country ? State.getStatesOfCountry(addr.country) : []),
    [addr.country]
  );

  // Look up display names from iso codes
  const savedCountryName = countries.find(c => c.isoCode === saved.country)?.name || '';
  const savedStateName =
    saved.country && saved.state
      ? State.getStatesOfCountry(saved.country).find(s => s.isoCode === saved.state)?.name || ''
      : '';

  // Helpers
  const update = (k: keyof Address, v: string) => {
    const next = { ...addr, [k]: v };
    setAddr(next);
    onChange?.(next);
  };

  // Basic validations
  const line1Error = touched.line1 && !addr.line1?.trim() ? 'Street address is required' : '';
  const cityError = touched.city && !addr.city?.trim() ? 'City is required' : '';
  const stateError =
    touched.state && !addr.state?.trim() ? 'State/Province is required' : '';
  const postalError =
    touched.postalCode && !addr.postalCode?.trim() ? 'Postal code is required' : '';
  const countryError =
    touched.country && !addr.country?.trim() ? 'Country is required' : '';

  const noErrors = !line1Error && !cityError && !stateError && !postalError && !countryError;

  const requiredFilled =
    (addr.line1 ?? '').trim() &&
    (addr.city ?? '').trim() &&
    (addr.state ?? '').trim() &&
    (addr.postalCode ?? '').trim() &&
    (addr.country ?? '').trim() &&
    noErrors;

  const markAllTouched = () =>
    setTouched({
      line1: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
    });

  function handleContinue() {
    if (!requiredFilled) {
      markAllTouched();
      return;
    }
    setSaved({ ...addr });
    onContinue();
  }

  return (
    <section className={`card ${open ? 'is-open' : ''}`}>
      <div className="cardBody">
        <div className="rowTitle" style={{ marginBottom: 10 }}>
          <h3 className="sectionTitle">Address</h3>
          {!open && requiredFilled && (
            <button
              className="btnGhost"
              onClick={onToggle}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Edit
              <i className="fa fa-chevron-right" aria-hidden="true" style={{ fontSize: 12, color: 'grey' }} />
            </button>
          )}
        </div>

        {/* Preview when closed */}
        {!open && (
          <div style={{ fontSize: 14 }}>
            <div>{saved.line1}{saved.line2 ? `, ${saved.line2}` : ''}</div>
            <div style={{ marginTop: 6 }}>
              {saved.city}{saved.city && ','} {savedStateName} {saved.postalCode}
            </div>
            <div style={{ marginTop: 6 }}>{savedCountryName}</div>
          </div>
        )}

        {/* Form when open */}
        {open && (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
              Enter the billing address for this account.
            </p>

            <div className="field">
              <input
                className={`input ${line1Error ? 'input-error' : ''}`}
                placeholder=" "
                value={addr.line1 ?? ''}
                onChange={e => update('line1', e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, line1: true }))}
              />
              <label className="floating-label">Street address *</label>
              {line1Error && <div className="field-error">{line1Error}</div>}
            </div>

            <div className="field">
              <input
                className="input"
                placeholder=" "
                value={addr.line2 ?? ''}
                onChange={e => update('line2', e.target.value)}
              />
              <label className="floating-label">Apt, suite (optional)</label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', gap: 10 }}>
              <div className="field">
                <input
                  className={`input ${cityError ? 'input-error' : ''}`}
                  placeholder=" "
                  value={addr.city ?? ''}
                  onChange={e => update('city', e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, city: true }))}
                />
                <label className="floating-label">City *</label>
                {cityError && <div className="field-error">{cityError}</div>}
              </div>

              <div className="field">
                <select
                  className={`input ${stateError ? 'input-error' : ''}`}
                  value={addr.state ?? ''}
                  onChange={e => update('state', e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, state: true }))}
                  disabled={!addr.country}
                >
                  <option value=""></option>
                  {states.map(s => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
                <label className="floating-label">State/Province *</label>
                {stateError && <div className="field-error">{stateError}</div>}
              </div>

              <div className="field">
                <input
                  className={`input ${postalError ? 'input-error' : ''}`}
                  placeholder=" "
                  value={addr.postalCode ?? ''}
                  onChange={e => update('postalCode', e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, postalCode: true }))}
                />
                <label className="floating-label">Postal code *</label>
                {postalError && <div className="field-error">{postalError}</div>}
              </div>
            </div>

            <div className="field">
              <select
                className={`input ${countryError ? 'input-error' : ''}`}
                value={addr.country ?? ''}
                onChange={e => {
                  update('country', e.target.value);
                  update('state', ''); // reset state
                }}
                onBlur={() => setTouched(t => ({ ...t, country: true }))}
              >
                <option value=""></option>
                {countries.map(c => (
                  <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                ))}
              </select>
              <label className="floating-label">Country *</label>
              {countryError && <div className="field-error">{countryError}</div>}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button
                className="btn"
                type="button"
                onClick={handleContinue}
                disabled={!requiredFilled}
              >
                CONTINUE TO PAYMENT
              </button>
              <button
                className="btnGhost"
                type="button"
                onClick={() => {
                  setAddr(saved ?? {});
                  onToggle();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
