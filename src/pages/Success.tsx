import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>('');
  const today = new Date();
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUserEmail();
  }, []);

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
                <span className="success-detail-value">$229.00</span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Date:</span>
                <span className="success-detail-value">{formattedDate}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Payment Method:</span>
                <span className="success-detail-value">Visa **** 1234</span>
              </div>
            </div>
          </div>

          <p className="success-confirmation-text">
            A confirmation email has been sent to {userEmail || 'your email'}
          </p>

          <button className="success-button" onClick={() => navigate('/Login')}>
            GO TO AERO
          </button>
        </main>
      </div>
    </>
  );
}
