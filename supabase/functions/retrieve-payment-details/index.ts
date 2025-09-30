import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentIntentId } = await req.json();
    
    if (!paymentIntentId) {
      return new Response(
        JSON.stringify({ error: "Payment intent ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    console.log("Retrieving payment intent:", paymentIntentId);
    
    // Retrieve payment intent with expanded payment_method
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['payment_method'],
    });
    
    console.log("Payment intent retrieved:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      payment_method_type: typeof paymentIntent.payment_method
    });

    let paymentMethodDisplay = 'Payment method';
    
    if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'object') {
      const pm = paymentIntent.payment_method as Stripe.PaymentMethod;
      
      if (pm.card) {
        const brand = pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1);
        paymentMethodDisplay = `${brand} **** ${pm.card.last4}`;
      } else if (pm.type) {
        paymentMethodDisplay = pm.type.charAt(0).toUpperCase() + pm.type.slice(1);
      }
    }

    return new Response(
      JSON.stringify({
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        paymentMethod: paymentMethodDisplay,
        status: paymentIntent.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error retrieving payment details:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to retrieve payment details" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
