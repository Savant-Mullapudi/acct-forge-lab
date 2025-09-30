import React from 'react';

export default function PaymentMethodCardPlaceholder({
  open,
  onToggle,
  filled,
}: { open: boolean; onToggle: () => void; filled: boolean }) {
  const isFormValid = false; // Disabled until payment details are loaded via Stripe Elements

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
          <form onSubmit={(e) => e.preventDefault()} style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 12 }}>
              Choose your payment method
            </div>

            <div style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: '#fff',
              marginBottom: 16,
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Initializing payment options...
            </div>

            <div style={{ 
              fontSize: 12, 
              color: '#6b7280', 
              marginTop: 16,
              lineHeight: 1.5
            }}>
              By subscribing, you authorize Trace Air Quality, Inc. to charge your payment method according to the terms, until you cancel.
            </div>

            <button 
              type="button"
              disabled={!isFormValid}
              data-testid="button-continue"
              style={{
                width: '50%',
                marginTop: 20,
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                background: '#d1d5db',
                color: '#9ca3af',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'not-allowed',
                opacity: 0.6,
              }}
            >
              REVIEW & CONFIRM
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
