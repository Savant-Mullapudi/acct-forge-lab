import React from 'react';
import ResearcherDiscountCard from '@/components/Checkout/ResearcherDiscountCard';
import SignUpCard from '@/components/Checkout/SignUpCard';
import AddressCard from '@/components/Checkout/AddressCard';
import PaymentMethodCard from '@/components/Checkout/PaymentMethodCard';
import OrderSummary from '@/components/Checkout/OrderSummary';
import CheckoutHeader from '@/components/Checkout/CheckoutHeader';
import '../styles/checkout.css';
import 'font-awesome/css/font-awesome.min.css';

type Step = 'signup' | 'address' | 'payment';

export default function Checkout() {
  const [step, setStep] = React.useState<Step>('signup');
  const [signupFilled, setSignupFilled] = React.useState(false);
  const [addressFilled, setAddressFilled] = React.useState(false);
  const [paymentFilled, setPaymentFilled] = React.useState(false);

  return (
    <>
      <CheckoutHeader />
      <div className="checkout">
        <div className="grid">
          <div className="leftCol">
            <ResearcherDiscountCard />

            <SignUpCard
              open={step === 'signup'}
              onToggle={() => setStep('signup')}
              onContinue={() => {
                setSignupFilled(true);
                setStep('address');
              }}
            />

            <AddressCard
              open={step === 'address'}
              onToggle={() => setStep('address')}
              onContinue={() => {
                setAddressFilled(true);
                setStep('payment');
              }}
            />

            <PaymentMethodCard
              open={step === 'payment'}
              onToggle={() => setStep('payment')}
              filled={paymentFilled}
            />
          </div>
          <aside className="aside">
            <OrderSummary />
          </aside>
        </div>
      </div>
    </>
  );
}
