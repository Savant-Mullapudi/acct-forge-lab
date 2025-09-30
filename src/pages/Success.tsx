import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
      const storedEmail = sessionStorage.getItem('user_email');
      const paymentIntentId = searchParams.get('payment_intent');

      if (paymentIntentId) {
        try {
          // Call edge function to retrieve payment details with expanded payment_method
          const { data, error } = await supabase.functions.invoke('retrieve-payment-details', {
            body: { paymentIntentId }
          });

          if (error) {
            console.error('Error retrieving payment details:', error);
            return;
          }

          if (data) {
            const formattedAmount = new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: data.currency 
            }).format(data.amount);
            
            setPaymentData({
              amount: formattedAmount,
              email: storedEmail || 'checkout@gmail.com',
              paymentMethod: data.paymentMethod
            });

            // Clear sessionStorage after use
            sessionStorage.removeItem('payment_amount');
            sessionStorage.removeItem('payment_currency');
            sessionStorage.removeItem('user_email');
          }
        } catch (error) {
          console.error('Error fetching payment details:', error);
        }
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
