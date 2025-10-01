import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user?.email) {
      throw new Error("User not authenticated");
    }

    const { priceId, promotionCode } = await req.json();

    if (!priceId) {
      throw new Error("Missing required parameter: priceId");
    }

    console.log("Creating payment intent for user:", user.email, "with price:", priceId, "promotion code:", promotionCode || "none");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
      });
      customerId = customer.id;
      console.log("Created new customer:", customerId);
    }

    // Get the price to determine amount and currency
    const price = await stripe.prices.retrieve(priceId);
    console.log("Price details:", price.type, price.unit_amount, price.currency);

    // Calculate the final amount with optional promotion code
    let finalAmount = price.unit_amount || 0;
    const paymentMetadata: any = {
      priceId: priceId,
      userId: user.id,
      userEmail: user.email,
    };

    // If a promotion code is provided, apply the discount
    if (promotionCode) {
      try {
        const coupon = await stripe.coupons.retrieve(promotionCode);
        if (coupon.valid) {
          if (coupon.percent_off) {
            finalAmount = Math.round(finalAmount * (1 - coupon.percent_off / 100));
            console.log(`Applied ${coupon.percent_off}% discount. Original: ${price.unit_amount}, Final: ${finalAmount}`);
          } else if (coupon.amount_off) {
            finalAmount = Math.max(0, finalAmount - coupon.amount_off);
            console.log(`Applied ${coupon.amount_off} amount discount. Original: ${price.unit_amount}, Final: ${finalAmount}`);
          }
          paymentMetadata.promotionCode = promotionCode;
          paymentMetadata.discountApplied = 'true';
        }
      } catch (error) {
        console.error("Error applying promotion code:", error);
        // Continue without the discount if there's an error
      }
    }

    // Create payment intent with specific payment methods (excluding Affirm)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: price.currency,
      customer: customerId,
      payment_method_types: ['card', 'cashapp', 'klarna', 'amazon_pay', 'link'],
      metadata: paymentMetadata,
    });

    console.log("Created payment intent:", paymentIntent.id);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in create-payment-intent:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
