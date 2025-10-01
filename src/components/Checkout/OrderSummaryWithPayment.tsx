import React from "react";
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import OrderSummary from './OrderSummary';

type Props = {
  productName?: string;
  seats?: number;
  unitPrice?: number;
  currency?: string;
  subscribeEnabled?: boolean;
  onCouponApplied?: (couponCode: string | null) => void;
};

const OrderSummaryWithPayment: React.FC<Props> = (props) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleSubscribe = async (total: number) => {
    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Payment system not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (!props.subscribeEnabled) {
      toast({
        title: "Payment Method Required",
        description: "Please complete the payment method step first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm payment with Stripe without redirect (to avoid iframe issues)
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment",
          variant: "destructive",
        });
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful, navigate to success page
        navigate(`/success?amount=${total}`);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An error occurred during payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return <OrderSummary {...props} onSubscribe={handleSubscribe} isProcessing={isProcessing} />;
};

export default OrderSummaryWithPayment;
