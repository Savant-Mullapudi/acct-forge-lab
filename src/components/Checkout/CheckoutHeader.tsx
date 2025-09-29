import React from 'react';
import logoFullDark from '@/assets/logo-full-dark.png';

export default function CheckoutHeader() {
  return (
    <header className="checkout-header" role="banner" aria-label="Checkout Header">
      <div className="inner">
        <div className="logo-wrap">
          <img
            src={logoFullDark}
            alt="TraceAQ Aero"
            className="logo"
            width={240}
            height={45}
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="secure" aria-label="Secure checkout">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 15a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor"/>
            <path d="M17 8h-1V6a4 4 0 10-8 0v2H7a1 1 0 00-1 1v9a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1zM9 6a3 3 0 116 0v2H9V6z" fill="currentColor"/>
          </svg>
          <span>Secure Checkout</span>
        </div>
      </div>

      <style>{`
        .checkout-header {
          width: 100%;
          background: #fff;
          border-bottom: 1px solid #e6e6e6;
          box-shadow: 0 6px 20px rgba(16, 24, 40, 0.06);
          position: relative;
          z-index: 20;
        }

        .inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .logo-wrap { display: flex; align-items: center; }
        .logo {
          display: block;
          width: 160px;
          height: auto;
          object-fit: contain;
        }

        .secure {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #e6e6e6;
          color: #111;
          font-size: 13px;
          background: #f9fafb;
          user-select: none;
        }

        @media (max-width: 900px) {
          .inner { padding: 16px; }
          .logo { width: 120px; }
        }

        @media (max-width: 600px) {
          .inner {
            flex-direction: column;
            align-items: flex-start;
            padding: 10px 8px;
            gap: 8px;
          }
          .logo { width: 100px; }
          .secure {
            font-size: 12px;
            padding: 4px 8px;
            margin-top: 2px;
          }
        }
      `}</style>
    </header>
  );
}
