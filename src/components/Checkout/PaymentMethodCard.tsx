import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from '@/hooks/use-toast';

export default function PaymentMethodCard({
  open,
  onToggle,
  filled,
  onReviewConfirm,
}: { open: boolean; onToggle: () => void; filled: boolean; onReviewConfirm?: () => void }) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isPaymentReady, setIsPaymentReady] = React.useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleReviewConfirm = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!isPaymentReady) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method to continue.",
        variant: "destructive",
      });
      return;
    }

    // Just enable the subscribe button
    if (onReviewConfirm) {
      onReviewConfirm();
    }
  };

  const isFormValid = isPaymentReady && !isProcessing;

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
          <form onSubmit={handleReviewConfirm} style={{ marginTop: 20 }}>
            {/* Payment method label */}
            <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 12 }}>
              Choose your payment method
            </div>
            
            {/* Stripe Payment Element - supports cards, Cash App Pay, Klarna, Amazon Pay, and more */}
            <div style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: '#fff',
              marginBottom: 16,
            }}>
              <PaymentElement
                options={{
                  layout: 'tabs',
                }}
                onReady={() => setIsPaymentReady(true)}
              />
            </div>

            {/* Authorization text */}
            <div style={{ 
              fontSize: 12, 
              color: '#6b7280', 
              marginTop: 16,
              lineHeight: 1.5
            }}>
              By subscribing, you authorize Trace Air Quality, Inc. to charge your payment method according to the terms, until you cancel.
            </div>

            {/* Continue button */}
            <button 
              type="submit"
              disabled={!isFormValid}
              data-testid="button-continue"
              style={{
                width: '50%',
                marginTop: 20,
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                background: isFormValid ? '#000D94' : '#d1d5db',
                color: isFormValid ? '#fff' : '#9ca3af',
                fontWeight: 600,
                fontSize: 14,
                cursor: isFormValid ? 'pointer' : 'not-allowed',
                transition: 'background-color .2s, transform .1s',
                opacity: isFormValid ? 1 : 0.6,
              }}
              onMouseOver={(e) => {
                if (isFormValid) e.currentTarget.style.background = '#001480';
              }}
              onMouseOut={(e) => {
                if (isFormValid) e.currentTarget.style.background = '#000D94';
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
