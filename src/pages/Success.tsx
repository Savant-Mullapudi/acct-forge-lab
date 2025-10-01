import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { addMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";
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
  const [searchParams] = useSearchParams();
  const [userEmail, setUserEmail] = useState<string>('');
  const { toast } = useToast();
  const amount = searchParams.get('amount') || '229.00';
  const today = new Date();
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
  const nextPaymentDate = addMonths(today, 1);
  const formattedNextPaymentDate = `${String(nextPaymentDate.getMonth() + 1).padStart(2, '0')}/${String(nextPaymentDate.getDate()).padStart(2, '0')}/${nextPaymentDate.getFullYear()}`;

  useEffect(() => {
    const getUserAndSendEmail = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
          
          // Send subscription confirmation email
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { error } = await supabase.functions.invoke('send-subscription-email', {
              body: { 
                amount: parseFloat(amount) * 100, // Convert to cents
                currency: 'USD'
              },
            });

            if (error) {
              console.error('Error sending email:', error);
              toast({
                title: "Email Error",
                description: "Confirmation email could not be sent, but your subscription is active.",
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    getUserAndSendEmail();
  }, [amount, toast]);

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
                <span className="success-detail-value">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Date:</span>
                <span className="success-detail-value">{formattedDate}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Next Payment Date:</span>
                <span className="success-detail-value">{formattedNextPaymentDate}</span>
              </div>
            </div>
          </div>

          <p className="success-confirmation-text">
            A confirmation email has been sent to {userEmail || 'your email'}
          </p>

          <button className="success-button" onClick={() => navigate('/login')}>
            GO TO AERO
          </button>
        </main>
      </div>
    </>
  );
}
