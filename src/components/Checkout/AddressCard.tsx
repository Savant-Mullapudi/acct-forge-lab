import React from 'react';

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

type Props = {
  value?: Address;
  onChange?: (addr: Address) => void;
  open: boolean;
  onToggle: () => void;
  onContinue: () => void;
};

const zipUS = /^\d{5}(-\d{4})?$/;
const zipCA = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
const stateUS = /^[A-Z]{2}$/;

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

  const update = (k: keyof Address, v: string) => {
    const next = { ...addr, [k]: v };
    setAddr(next);
    onChange?.(next);
  };

  const line1Error =
    touched.line1 && !addr.line1?.trim() ? 'Street address is required' : '';

  const cityError =
    touched.city && !addr.city?.trim() ? 'City is required' : '';

  const countryValue = (addr.country || '').trim();
  const isUS = countryValue === 'United States';
  const isCA = countryValue === 'Canada';

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
    if (!/^\d+$/.test(v)) return 'Only numbers allowed';
    return '';
  })();

  const countryError =
    touched.country && !countryValue ? 'Country is required' : '';

  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Japan', 'India', 'Other'];
  
  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  const caProvinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];
  
  const stateOptions = isUS ? usStates : isCA ? caProvinces : [];

  const noErrors =
    !line1Error && !cityError && !stateError && !postalError && !countryError;

  const requiredFilled =
    (addr.line1 ?? '').trim() !== '' &&
    (addr.city ?? '').trim() !== '' &&
    (addr.state ?? '').trim() !== '' &&
    (addr.postalCode ?? '').trim() !== '' &&
    countryValue !== '' &&
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
                <i className="fa fa-chevron-down" aria-hidden="true" style={{ fontSize: 10, color: 'grey' }} />
              </a>
            ) : null}
          </div>
        </div>

        {!open && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 14 }}>
              {saved.line1}
              {saved.line2 ? `, ${saved.line2}` : ''}
            </div>
            <div style={{ fontSize: 14, marginTop: 6 }}>
              {saved.city}{saved.city && ','} {saved.state} {saved.postalCode}
            </div>
            <div style={{ fontSize: 14, marginTop: 6 }}>{saved.country}</div>
          </div>
        )}

        {open && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
              Enter the billing address for this account.
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', gap: 10 }}>
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

                <div className="field">
                  <select
                    className={`input ${stateError ? 'input-error' : ''}`}
                    aria-label="state"
                    aria-invalid={!!stateError}
                    aria-describedby="stateError"
                    value={addr.state ?? ''}
                    onChange={e => update('state', e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, state: true }))}
                    disabled={!isUS && !isCA}
                    style={{
                      paddingTop: 18,
                      paddingBottom: 8,
                      backgroundColor: '#fff',
                      cursor: (!isUS && !isCA) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value=""></option>
                    {stateOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <label className="floating-label" style={{ top: addr.state ? 6 : 18 }}>State/Prov. *</label>
                  {stateError && <div id="stateError" className="field-error">{stateError}</div>}
                </div>

                <div className="field">
                  <input
                    className={`input ${postalError ? 'input-error' : ''}`}
                    placeholder=" "
                    aria-label="postal code"
                    aria-invalid={!!postalError}
                    aria-describedby="postalError"
                    value={addr.postalCode ?? ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      update('postalCode', val);
                    }}
                    onBlur={() => setTouched(t => ({ ...t, postalCode: true }))}
                  />
                  <label className="floating-label">Postal code *</label>
                  {postalError && <div id="postalError" className="field-error">{postalError}</div>}
                </div>
              </div>

              <div className="field">
                <select
                  className={`input ${countryError ? 'input-error' : ''}`}
                  aria-label="country"
                  aria-invalid={!!countryError}
                  aria-describedby="countryError"
                  value={addr.country ?? ''}
                  onChange={e => {
                    update('country', e.target.value);
                    update('state', '');
                  }}
                  onBlur={() => setTouched(t => ({ ...t, country: true }))}
                  style={{
                    paddingTop: 18,
                    paddingBottom: 8,
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value=""></option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <label className="floating-label" style={{ top: addr.country ? 6 : 18 }}>Country *</label>
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
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
