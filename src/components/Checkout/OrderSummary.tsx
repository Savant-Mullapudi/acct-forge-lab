export default function OrderSummary() {
  return (
    <div className="card cardLg orderCard">
      <h3 className="order-title">Order Summary</h3>
      <div className="order-content">
        <div className="order-item">
          <span>Trace AQ (Annual)</span>
          <span className="order-price">$299.00</span>
        </div>
        <div className="order-divider" />
        <div className="order-item">
          <span>Subtotal</span>
          <span>$299.00</span>
        </div>
        <div className="order-item">
          <span>Tax</span>
          <span>$0.00</span>
        </div>
        <div className="order-divider" />
        <div className="order-item order-total">
          <span>Total</span>
          <span className="order-price">$299.00</span>
        </div>
      </div>
    </div>
  );
}
