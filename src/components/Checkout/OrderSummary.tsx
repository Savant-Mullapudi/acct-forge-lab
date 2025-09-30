import React from "react";
import "font-awesome/css/font-awesome.min.css";
import productDetailsImg from "@/assets/product-details.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  productName?: string;
  seats?: number;
  unitPrice?: number;
  currency?: string;
  subscribeEnabled?: boolean;
};

const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

const OrderSummary: React.FC<Props> = ({
  productName = "Trace AQ | Aero",
  seats = 1,
  unitPrice = 229,
  currency = "USD",
  subscribeEnabled = false,
}: Props) => {
  const [showDesc, setShowDesc] = React.useState(false);
  const [coupon, setCoupon] = React.useState("");
  const [showCouponInput, setShowCouponInput] = React.useState(false);
  const [appliedCoupon, setAppliedCoupon] = React.useState<{
    percentOff?: number;
    amountOff?: number;
    currency?: string;
    name?: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-coupon", {
        body: { couponCode: coupon.trim() },
      });

      if (error) throw error;

      if (data.valid) {
        setAppliedCoupon(data);
        toast.success(`Promo code "${coupon}" applied successfully!`);
      } else {
        toast.error(data.error || "Invalid promo code");
      }
    } catch (error: any) {
      console.error("Error verifying coupon:", error);
      toast.error(error.message || "Failed to verify promo code");
      setAppliedCoupon(null);
    } finally {
      setIsVerifying(false);
    }
  };

  // Calculate discount
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    const subtotal = unitPrice * seats;
    
    if (appliedCoupon.percentOff) {
      return (subtotal * appliedCoupon.percentOff) / 100;
    }
    
    if (appliedCoupon.amountOff) {
      // Convert cents to dollars if needed
      return appliedCoupon.amountOff / 100;
    }
    
    return 0;
  };

  const discount = calculateDiscount();
  const subtotal = unitPrice * seats;
  const total = Math.max(0, subtotal - discount);

  return (
    <aside className="aside">
      <section className="card cardLg orderCard">
        <div className="orderHeader">
          <h3 className="summaryTitle">Order Summary</h3>
          <span className="currencyChip" aria-label="Currency">
            <span role="img" aria-label="us-flag">
              🇺🇸
            </span>
            <span>USD</span>
          </span>
        </div>

        <button
          type="button"
          className="rowTitle orderRowBtn"
          aria-expanded={showDesc}
          onClick={() => setShowDesc((v) => !v)}
          style={{ cursor: "pointer" }}
        >
          <div className="orderRowLabel">Product Description</div>
          <i
            className="fa fa-chevron-down"
            aria-hidden="true"
            style={{
              fontSize: 12,
              transform: showDesc ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </button>
        {showDesc && (
          <div style={{ margin: "12px 0", textAlign: "center" }}>
            <img
              src={productDetailsImg}
              alt="Product Description"
              style={{
                maxWidth: "100%",
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(16,24,40,0.08)",
              }}
            />
          </div>
        )}

        <div style={{ borderBottom: "1px solid #E5E7EB", margin: "16px 0" }} />

        <div className="summaryProduct">
          <div className="productTitle" style={{ fontWeight: "normal" }}>
            {productName}
          </div>
          <div className="productPrice">{money(unitPrice, currency)}</div>
        </div>

        <div className="kvLines">
          <div className="kv">
            <span className="k">1 user</span>
          </div>
          <div className="kv">
            <span className="k">Aero Monthly Plan</span>
            <span className="v" style={{ color: "#929292" }}>
              {money(unitPrice, currency)} per seat
            </span>
          </div>
          <div className="kv">
            <span className="k">Taxes</span>
            <span className="v" style={{ color: "#929292" }}>
              Calculated at checkout
            </span>
          </div>
        </div>

        <div
          className="promoBadge"
          style={{ background: "#FAF5DC", width: "100%", textAlign: "center" }}
        >
          LIMITED-TIME INTRODUCTORY PRICING FOR EVERYONE
        </div>

        <div className="couponRow">
          <input
            className="input"
            style={{ width: "300px", fontSize: 13, padding: "8px 8px" }}
            placeholder="Promo code"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
            aria-label="Coupon code"
            disabled={isVerifying}
          />
          <button 
            type="button" 
            className="applyBtn"
            onClick={handleApplyCoupon}
            disabled={isVerifying}
          >
            {isVerifying ? "Verifying..." : "Apply"}
          </button>
        </div>

        {appliedCoupon && (
          <div className="kv" style={{ color: "#16a34a", fontWeight: 500 }}>
            <span className="k">
              Discount{appliedCoupon.percentOff ? ` (${appliedCoupon.percentOff}% off)` : ""}
            </span>
            <span className="v">-{money(discount, currency)}</span>
          </div>
        )}

        <div
          className="summaryLine totalLine"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Total due today</span>
          <span style={{ fontWeight: appliedCoupon ? 600 : 400 }}>
            {money(total, currency)}
          </span>
        </div>

        <button
          type="button"
          className="btnSubscribe"
          onClick={() => (window.location.href = "/success")}
          disabled={!subscribeEnabled}
          data-testid="button-subscribe"
          style={{
            background: subscribeEnabled ? "#00FF5E" : "#d1d5db",
            color: subscribeEnabled ? "#000" : "#9ca3af",
            cursor: subscribeEnabled ? "pointer" : "not-allowed",
            opacity: subscribeEnabled ? 1 : 0.6,
            fontSize: 14,
          }}
        >
          SUBSCRIBE <span className="arrow">›</span>
        </button>
      </section>
    </aside>
  );
};

export default OrderSummary;
