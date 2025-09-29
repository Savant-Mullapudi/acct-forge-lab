import { useState } from 'react';

interface SignUpCardProps {
  open: boolean;
  onToggle: () => void;
  onContinue: () => void;
}

export default function SignUpCard({ open, onToggle, onContinue }: SignUpCardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onContinue();
    }
  };

  return (
    <div className={`card checkout-card ${open ? 'open' : ''}`}>
      <div className="card-header" onClick={onToggle}>
        <div className="card-number">1</div>
        <h3 className="card-title">Sign Up</h3>
      </div>
      {open && (
        <form className="card-content" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Email address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label>Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-continue">
            Continue to Address
          </button>
        </form>
      )}
    </div>
  );
}
