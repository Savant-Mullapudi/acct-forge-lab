import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { supabase } from "@/integrations/supabase/client";
import ResearcherDiscountCard from '@/components/Checkout/ResearcherDiscountCard';
import SignUpCard from '@/components/Checkout/SignUpCard';
import AddressCard from '@/components/Checkout/AddressCard';
import PaymentMethodCard from '@/components/Checkout/PaymentMethodCard';
import PaymentMethodCardPlaceholder from '@/components/Checkout/PaymentMethodCardPlaceholder';
import OrderSummary from '@/components/Checkout/OrderSummary';
import OrderSummaryWithPayment from '@/components/Checkout/OrderSummaryWithPayment';
import CheckoutHeader from '@/components/Checkout/CheckoutHeader';
import '../styles/checkout.css';
import 'font-awesome/css/font-awesome.min.css';

type Step = 'signup' | 'address' | 'payment';

export default function Checkout() {
  const [step, setStep] = React.useState<Step>('signup');
  const [signupFilled, setSignupFilled] = React.useState(false);
  const [addressFilled, setAddressFilled] = React.useState(false);
  const [paymentFilled, setPaymentFilled] = React.useState(false);
  const [reviewConfirmed, setReviewConfirmed] = React.useState(false);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = React.useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = React.useState<string | null>(null);

  const handlePaymentStepOpen = async () => {
    setAddressFilled(true);
    setStep('payment');
    
    // Create payment intent when payment step opens
    if (!clientSecret) {
      setIsLoadingPayment(true);
      console.log('Starting payment initialization...');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check:', session ? 'Found' : 'Not found');
        
        if (!session) {
          console.error('No active session - user needs to sign up first');
          alert('Please complete the sign up step first');
          setStep('signup');
          setIsLoadingPayment(false);
          return;
        }

        console.log('Calling create-payment-intent function...');
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            priceId: 'price_1SD8wWCaDTRDsxQRp5dKKTIs', // Replace with your actual price ID
            promotionCode: appliedCouponCode,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        console.log('Function response:', { data, error });

        if (error) {
          console.error('Error creating payment intent:', error);
          alert(`Payment initialization failed: ${error.message || 'Unknown error'}`);
          return;
        }

        if (data?.clientSecret) {
          console.log('Payment intent created successfully');
          setClientSecret(data.clientSecret);
        } else {
          console.error('No client secret in response');
          alert('Payment initialization failed: No client secret received');
        }
      } catch (error) {
        console.error('Error in handlePaymentStepOpen:', error);
        alert(`Payment initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoadingPayment(false);
      }
    }
  };

  return (
    <>
      <CheckoutHeader />
      <div className="checkout">
        <div className="grid">
          {clientSecret ? (
            <Elements 
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#000D94',
                  },
                },
              }}
            >
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
                  onContinue={handlePaymentStepOpen}
                />

                <PaymentMethodCard
                  open={step === 'payment'}
                  onToggle={() => setStep('payment')}
                  filled={paymentFilled}
                  onReviewConfirm={() => setReviewConfirmed(true)}
                />
              </div>
              
              <OrderSummaryWithPayment 
                subscribeEnabled={reviewConfirmed} 
                onCouponApplied={setAppliedCouponCode}
              />
            </Elements>
          ) : (
            <>
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
                  onContinue={handlePaymentStepOpen}
                />
                
                <PaymentMethodCardPlaceholder
                  open={step === 'payment'}
                  onToggle={() => setStep('payment')}
                  filled={false}
                />
                
              </div>
              
              <aside className="aside">
                <OrderSummary 
                  subscribeEnabled={false} 
                  onCouponApplied={setAppliedCouponCode}
                />
              </aside>
            </>
          )}
        </div>
      </div>
    </>
  );
}
