import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { loadStripe } from '@stripe/stripe-js';
import '../styles/payment-success.css';
import logoDark from '@/assets/logo-dark.png';

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      role="img"
      focusable="false"
      style={{ width: 80, height: 80 }}
    >
      <circle cx="50" cy="50" r="48" fill="none" stroke="#22c55e" strokeWidth="4" />
      <path
        d="M30 50l15 15 25-30"
        fill="none"
        stroke="#22c55e"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Success() {
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState({
    amount: '$229.00',
    paymentMethod: 'Visa **** 1234',
    email: 'checkout@gmail.com'
  });

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      // Get data from sessionStorage
      const storedAmount = sessionStorage.getItem('payment_amount');
      const storedCurrency = sessionStorage.getItem('payment_currency');
      const storedEmail = sessionStorage.getItem('user_email');

      // Get payment intent from URL if available
      const paymentIntentId = searchParams.get('payment_intent');

      let paymentMethodDisplay = 'Payment method';

      // Retrieve payment method details from Stripe if payment_intent is available
      if (paymentIntentId) {
        try {
          const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
          if (stripePublishableKey) {
            const stripe = await loadStripe(stripePublishableKey);
            if (stripe) {
              const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentId);
              
              if (paymentIntent?.payment_method) {
                // Format payment method display based on type
                const pm = paymentIntent.payment_method as any;
                
                if (pm.card) {
                  const brand = pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1);
                  paymentMethodDisplay = `${brand} **** ${pm.card.last4}`;
                } else if (pm.type) {
                  paymentMethodDisplay = pm.type.charAt(0).toUpperCase() + pm.type.slice(1);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error retrieving payment method:', error);
        }
      }

      if (storedAmount) {
        const amount = parseFloat(storedAmount);
        const currency = storedCurrency || 'USD';
        const formattedAmount = new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency 
        }).format(amount);
        
        setPaymentData({
          amount: formattedAmount,
          email: storedEmail || 'checkout@gmail.com',
          paymentMethod: paymentMethodDisplay
        });

        // Clear sessionStorage after use
        sessionStorage.removeItem('payment_amount');
        sessionStorage.removeItem('payment_currency');
        sessionStorage.removeItem('user_email');
      } else {
        // If no stored amount, at least update payment method
        setPaymentData(prev => ({
          ...prev,
          paymentMethod: paymentMethodDisplay
        }));
      }
    };

    fetchPaymentDetails();
  }, [searchParams]);

  const today = new Date();
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

  return (
    <>
      {/* Header */}
      <header className="success-header">
        <div className="success-header-inner">
          <img
            src={logoDark}
            alt="TraceAQ Aero"
            className="success-logo"
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="success-container">
        <main className="success-main">
          <div className="success-check-icon">
            <CheckIcon />
          </div>
          
          <h1 className="success-title">Payment Successful</h1>
          <p className="success-subtitle">Thank you for your purchase!</p>

          <div className="success-details-card">
            <h2 className="success-details-title">Payment Details</h2>
            
            <div className="success-details-list">
              <div className="success-detail-row">
                <span className="success-detail-label">Amount:</span>
                <span className="success-detail-value">{paymentData.amount}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Date:</span>
                <span className="success-detail-value">{formattedDate}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Payment Method:</span>
                <span className="success-detail-value">{paymentData.paymentMethod}</span>
              </div>
            </div>
          </div>

          <p className="success-confirmation-text">
            A confirmation email has been sent to {paymentData.email}
          </p>

          <button className="success-button" onClick={() => window.location.href = '/login'}>
            GO TO AERO
          </button>
        </main>
      </div>
    </>
  );
}
