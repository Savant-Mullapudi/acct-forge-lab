import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PaymentMethodCardProps {
  open: boolean;
  onToggle: () => void;
  filled: boolean;
}

export default function PaymentMethodCard({ open, onToggle, filled }: PaymentMethodCardProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber && expiry && cvv) {
      // Simulate payment processing
      setTimeout(() => {
        navigate('/success?session_id=demo123');
      }, 1000);
    }
  };

  return (
    <div className={`card checkout-card ${open ? 'open' : ''}`}>
      <div className="card-header" onClick={onToggle}>
        <div className="card-number">3</div>
        <h3 className="card-title">Payment Method</h3>
      </div>
      {open && (
        <form className="card-content" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Card Number *</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="1234 5678 9012 3456"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Expiry Date *</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                required
              />
            </div>
            <div className="form-field">
              <label>CVV *</label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="123"
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-continue btn-payment">
            Complete Payment
          </button>
        </form>
      )}
    </div>
  );
}
