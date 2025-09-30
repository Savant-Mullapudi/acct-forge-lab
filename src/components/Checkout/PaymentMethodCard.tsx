import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function PaymentMethodCard({
  open,
  onToggle,
  filled,
  onReviewConfirm,
}: { open: boolean; onToggle: () => void; filled: boolean; onReviewConfirm?: () => void }) {
  const [cardholderName, setCardholderName] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isCardComplete, setIsCardComplete] = React.useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleReviewConfirm = async () => {
    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Stripe is not loaded yet. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
        },
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      console.log("Payment method created:", paymentMethod.id);

      // Get the session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // TODO: Replace with actual price ID from your product
      const priceId = "price_1S0K8BCaDTRDsxQROQm3zmKm"; // $129/month recurring

      // Call edge function to create payment/subscription
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          priceId,
          paymentMethodId: paymentMethod.id,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log("Payment response:", data);

      if (data.success) {
        toast({
          title: "Payment Successful!",
          description: "Your payment has been processed successfully.",
        });
        
        onReviewConfirm?.();
        navigate('/success');
      } else {
        throw new Error("Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = isCardComplete && cardholderName.trim() !== '' && !isProcessing;

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
              {/* Stripe Card Element */}
              <div style={{
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#fff',
              }}>
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#111',
                        '::placeholder': {
                          color: '#9ca3af',
                        },
                      },
                      invalid: {
                        color: '#ef4444',
                      },
                    },
                  }}
                  onChange={(e) => setIsCardComplete(e.complete)}
                />
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
                  data-testid="input-cardholder-name"
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
              disabled={!isFormValid}
              data-testid="button-review-confirm"
              style={{
                width: '100%',
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
              {isProcessing ? 'PROCESSING...' : 'REVIEW & CONFIRM'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
