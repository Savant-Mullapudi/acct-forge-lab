import React from "react";
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from '@/hooks/use-toast';
import OrderSummary from './OrderSummary';

type Props = {
  productName?: string;
  seats?: number;
  unitPrice?: number;
  currency?: string;
  subscribeEnabled?: boolean;
};

const OrderSummaryWithPayment: React.FC<Props> = (props) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleSubscribe = async () => {
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
      // Store payment details in sessionStorage before redirect
      const amount = props.unitPrice || 229;
      const currency = props.currency || 'USD';
      
      sessionStorage.setItem('payment_amount', amount.toString());
      sessionStorage.setItem('payment_currency', currency);
      
      // Confirm payment with Stripe
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
      // If no error, user will be redirected to return_url
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
