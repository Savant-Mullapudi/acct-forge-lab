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

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Netherlands',
  'Belgium',
  'Switzerland',
  'Austria',
  'Sweden',
  'Norway',
  'Denmark',
  'Finland',
  'Ireland',
  'New Zealand',
  'Japan',
  'South Korea',
  'Singapore',
];

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

const CANADA_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'YT', name: 'Yukon' },
];

const zipUS = /^\d{5}(-\d{4})?$/;
const zipCA = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

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

  const updateCountry = (v: string) => {
    const next = { ...addr, country: v, state: '' };
    setAddr(next);
    onChange?.(next);
  };

  const getStateOptions = () => {
    if (addr.country === 'United States') return US_STATES;
    if (addr.country === 'Canada') return CANADA_PROVINCES;
    return [];
  };

  const stateOptions = getStateOptions();

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
    if (!v && (isUS || isCA)) return 'State/Province is required';
    return '';
  })();

  const postalError = (() => {
    if (!touched.postalCode) return '';
    const v = (addr.postalCode || '').trim();
    if (!v) return 'Postal code is required';
    if (!/^\d+$/.test(v.replace(/[-\s]/g, ''))) {
      return 'Postal code must contain only numbers';
    }
    if (isUS && !zipUS.test(v)) return 'Enter a valid US ZIP (12345 or 12345-6789)';
    if (isCA && !zipCA.test(v)) return 'Enter a valid Canadian postal code (A1A 1A1)';
    return '';
  })();

  const countryError =
    touched.country && !countryValue ? 'Country is required' : '';

  const noErrors =
    !line1Error && !cityError && !stateError && !postalError && !countryError;

  const stateRequired = isUS || isCA;
  const requiredFilled =
    (addr.line1 ?? '').trim() !== '' &&
    (addr.city ?? '').trim() !== '' &&
    (!stateRequired || (addr.state ?? '').trim() !== '') &&
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
                <label className="floating-label">Address line 2 (optional)</label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 180px', gap: 10 }}>
                <div className="field">
                  <input
                    className={`input ${postalError ? 'input-error' : ''}`}
                    placeholder=" "
                    aria-label="postal code"
                    aria-invalid={!!postalError}
                    aria-describedby="postalError"
                    value={addr.postalCode ?? ''}
                    onChange={e => update('postalCode', e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, postalCode: true }))}
                  />
                  <label className="floating-label">Zip/Postal *</label>
                  {postalError && <div id="postalError" className="field-error">{postalError}</div>}
                </div>

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
                    disabled={!addr.country || stateOptions.length === 0}
                    style={{
                      paddingTop: '18px',
                      paddingBottom: '8px',
                      color: addr.state ? '#111' : '#9ca3af',
                      cursor: !addr.country || stateOptions.length === 0 ? 'not-allowed' : 'pointer',
                      backgroundColor: !addr.country || stateOptions.length === 0 ? '#f3f4f6' : '#fff',
                    }}
                  >
                    <option value="" disabled>
                      {!addr.country ? 'Select country first' : stateOptions.length === 0 ? 'N/A' : 'State/province *'}
                    </option>
                    {stateOptions.map(state => (
                      <option key={state.code} value={state.code}>{state.name}</option>
                    ))}
                  </select>
                  {stateError && <div id="stateError" className="field-error">{stateError}</div>}
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
                    updateCountry(e.target.value);
                    setTouched(t => ({ ...t, country: true, state: false }));
                  }}
                  onBlur={() => setTouched(t => ({ ...t, country: true }))}
                  style={{
                    paddingTop: '18px',
                    paddingBottom: '8px',
                    color: addr.country ? '#111' : '#9ca3af',
                  }}
                >
                  <option value="" disabled>Country/Region *</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
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

              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                The address will be used for billing and receipts.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
