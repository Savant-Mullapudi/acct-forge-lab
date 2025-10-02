import React from "react";
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
      // Create profile and address records before payment
      const pendingProfileData = localStorage.getItem('pendingProfile');
      const pendingAddressData = localStorage.getItem('pendingAddress');

      if (pendingProfileData) {
        const profileData = JSON.parse(pendingProfileData);
        console.log('Creating profile record:', profileData);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: profileData.userId,
            email: profileData.email,
            first_name: profileData.firstName,
            last_name: profileData.lastName,
          });

        if (profileError && profileError.code !== '23505') { // Ignore duplicate key errors
          console.error('Error creating profile:', profileError);
          toast({
            title: "Error",
            description: "Failed to create profile. Please try again.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }
      }

      if (pendingAddressData) {
        const addressData = JSON.parse(pendingAddressData);
        console.log('Creating address record:', addressData);
        
        const { error: addressError } = await supabase
          .from('addresses')
          .insert({
            user_id: addressData.userId,
            address_line1: addressData.addressLine1,
            address_line2: addressData.addressLine2,
            city: addressData.city,
            state: addressData.state,
            postal_code: addressData.postalCode,
            country: addressData.country,
          });

        if (addressError && addressError.code !== '23505') { // Ignore duplicate key errors
          console.error('Error creating address:', addressError);
          toast({
            title: "Error",
            description: "Failed to create address. Please try again.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }
      }

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
        // Clear pending data
        localStorage.removeItem('pendingProfile');
        localStorage.removeItem('pendingAddress');
        
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
