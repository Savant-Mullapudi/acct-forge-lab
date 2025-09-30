import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentMethodCard({
  open,
  onToggle,
  filled,
}: { open: boolean; onToggle: () => void; filled: boolean }) {
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiry, setExpiry] = React.useState('');
  const [cvv, setCvv] = React.useState('');
  const [cardholderName, setCardholderName] = React.useState('');
  const navigate = useNavigate();

  const handleReviewConfirm = () => {
    navigate('/success');
  };

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
          <div style={{ marginTop: 20 }}>
            {/* Card option with radio button */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              marginBottom: 20,
              background: '#fff'
            }}>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: '2px solid #2563eb',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#fff'
                }} />
              </div>
              <i className="fa fa-credit-card" style={{ fontSize: 20, color: '#111' }} />
              <span style={{ fontSize: 15, fontWeight: 500, color: '#111' }}>Card</span>
            </div>

            {/* Card information label */}
            <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 12 }}>
              Card information
            </div>
            
            <div style={{ display: 'grid', gap: 12 }}>
              {/* Card number with inline logos */}
              <div className="field" style={{ position: 'relative' }}>
                <input
                  className="input"
                  placeholder=" "
                  aria-label="card number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength={19}
                  style={{ paddingRight: 150 }}
                />
                <label className="floating-label">1234 1234 1234 1234</label>
                <div style={{ 
                  position: 'absolute', 
                  right: 12, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  display: 'flex', 
                  gap: 6, 
                  alignItems: 'center' 
                }}>
                  <i className="fa fa-cc-mastercard" style={{ fontSize: 24, color: '#EB001B' }} aria-label="Mastercard" />
                  <i className="fa fa-cc-visa" style={{ fontSize: 24, color: '#1434CB' }} aria-label="Visa" />
                  <i className="fa fa-cc-amex" style={{ fontSize: 24, color: '#006FCF' }} aria-label="American Express" />
                  <i className="fa fa-cc-discover" style={{ fontSize: 24, color: '#FF6000' }} aria-label="Discover" />
                </div>
              </div>

              {/* Expiry and CVV row */}
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
                  <label className="floating-label">MM / YY</label>
                </div>

                <div className="field" style={{ position: 'relative' }}>
                  <input
                    className="input"
                    placeholder=" "
                    aria-label="cvc"
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    maxLength={4}
                    style={{ paddingRight: 40 }}
                  />
                  <label className="floating-label">CVC</label>
                  <i className="fa fa-lock" 
                    style={{ 
                      position: 'absolute', 
                      right: 12, 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      fontSize: 14, 
                      color: '#9ca3af' 
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Cardholder name section */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 12 }}>
                Cardholder name
              </div>
              <div className="field">
                <input
                  className="input"
                  placeholder=" "
                  aria-label="cardholder name"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                />
                <label className="floating-label">Full name on card</label>
              </div>
            </div>

            {/* Authorization text */}
            <div style={{ 
              fontSize: 12, 
              color: '#6b7280', 
              marginTop: 16,
              lineHeight: 1.5
            }}>
              By subscribing, you authorize Trace Air Quality, Inc. to charge your card according to the terms, until you cancel.
            </div>

            {/* Review & Confirm button */}
            <button 
              onClick={handleReviewConfirm}
              style={{
                width: '100%',
                marginTop: 20,
                padding: '14px 18px',
                border: 'none',
                borderRadius: '8px',
                background: '#374151',
                color: '#fff',
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                transition: 'background-color .2s, transform .1s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#1f2937'}
              onMouseOut={(e) => e.currentTarget.style.background = '#374151'}
            >
              REVIEW & CONFIRM
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
