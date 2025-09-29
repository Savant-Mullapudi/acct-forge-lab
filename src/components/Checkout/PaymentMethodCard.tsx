import React from 'react';

export default function PaymentMethodCard({
  open,
  onToggle,
  filled,
}: { open: boolean; onToggle: () => void; filled: boolean }) {
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiry, setExpiry] = React.useState('');
  const [cvv, setCvv] = React.useState('');

  return (
    <section className={`card ${open ? 'is-open' : ''}`}>
      <div className="cardBody">
        <div className="rowTitle" style={{ marginBottom: 10 }}>
          <h3 className="sectionTitle">Payment Method</h3>
          {!open && filled ? (
            <a className="btnGhost" onClick={onToggle} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              Edit
              <i className="fa fa-chevron-down" aria-hidden="true" style={{ fontSize: 10, color: 'grey' }} />
            </a>
          ) : null}
        </div>

        {open && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              We accept major credit and debit cards
            </div>
            
            {/* Payment method icons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <i className="fa fa-cc-visa" style={{ fontSize: 32, color: '#1434CB' }} aria-label="Visa" />
              <i className="fa fa-cc-mastercard" style={{ fontSize: 32, color: '#EB001B' }} aria-label="Mastercard" />
              <i className="fa fa-cc-amex" style={{ fontSize: 32, color: '#006FCF' }} aria-label="American Express" />
              <i className="fa fa-cc-discover" style={{ fontSize: 32, color: '#FF6000' }} aria-label="Discover" />
            </div>
            
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="field">
                <input
                  className="input"
                  placeholder=" "
                  aria-label="card number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength={19}
                />
                <label className="floating-label">Card number *</label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <input
                    className="input"
                    placeholder=" "
                    aria-label="expiry"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    maxLength={5}
                  />
                  <label className="floating-label">MM/YY *</label>
                </div>

                <div className="field">
                  <input
                    className="input"
                    placeholder=" "
                    aria-label="cvv"
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    maxLength={4}
                  />
                  <label className="floating-label">CVV *</label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
