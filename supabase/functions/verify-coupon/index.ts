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
    const { couponCode } = await req.json();
    
    if (!couponCode) {
      return new Response(
        JSON.stringify({ error: "Coupon code is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    console.log("Attempting to retrieve coupon:", couponCode);
    
    // Retrieve the coupon from Stripe
    const coupon = await stripe.coupons.retrieve(couponCode);
    
    console.log("Coupon retrieved:", { 
      id: coupon.id, 
      valid: coupon.valid,
      percentOff: coupon.percent_off,
      amountOff: coupon.amount_off,
      currency: coupon.currency
    });

    if (!coupon.valid) {
      return new Response(
        JSON.stringify({ error: "This coupon is not valid" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Return coupon details
    return new Response(
      JSON.stringify({
        valid: true,
        percentOff: coupon.percent_off,
        amountOff: coupon.amount_off,
        currency: coupon.currency,
        name: coupon.name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error verifying coupon:", error);
    
    if (error.code === "resource_missing") {
      return new Response(
        JSON.stringify({ error: "Invalid coupon code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || "Failed to verify coupon" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
