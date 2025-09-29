import { useState } from 'react';

interface AddressCardProps {
  open: boolean;
  onToggle: () => void;
  onContinue: () => void;
}

export default function AddressCard({ open, onToggle, onContinue }: AddressCardProps) {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address && city && zipCode) {
      onContinue();
    }
  };

  return (
    <div className={`card checkout-card ${open ? 'open' : ''}`}>
      <div className="card-header" onClick={onToggle}>
        <div className="card-number">2</div>
        <h3 className="card-title">Billing Address</h3>
      </div>
      {open && (
        <form className="card-content" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Street Address *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>City *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>ZIP Code *</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-continue">
            Continue to Payment
          </button>
        </form>
      )}
    </div>
  );
}
