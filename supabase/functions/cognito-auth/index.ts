import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { CognitoJwtVerifier } from "https://esm.sh/aws-jwt-verify@4.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CognitoAuthRequest {
  accessToken: string;
  idToken: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken, idToken } = await req.json() as CognitoAuthRequest;

    if (!accessToken || !idToken) {
      return new Response(
        JSON.stringify({ error: "Access token and ID token are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize Cognito JWT verifier
    const userPoolId = Deno.env.get("AWS_COGNITO_USER_POOL_ID");
    const clientId = Deno.env.get("AWS_COGNITO_CLIENT_ID");
    const region = Deno.env.get("AWS_REGION");

    if (!userPoolId || !clientId || !region) {
      console.error("Missing Cognito configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Verify the ID token
    const verifier = CognitoJwtVerifier.create({
      userPoolId: userPoolId,
      tokenUse: "id",
      clientId: clientId,
    });

    const payload = await verifier.verify(idToken);
    console.log("Token verified successfully:", payload.sub);

    // Extract user information from the token
    const email = payload.email as string;
    const firstName = payload.given_name as string || "";
    const lastName = payload.family_name as string || "";

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists in Supabase
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log("Existing user found:", userId);
    } else {
      // Create a new user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          cognito_sub: payload.sub,
        },
      });

      if (authError) {
        console.error("Error creating user:", authError);
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      userId = authData.user.id;
      console.log("New user created:", userId);
    }

    // Generate a Supabase session token
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email,
    });

    if (sessionError || !sessionData) {
      console.error("Error generating session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Failed to generate session" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: userId,
        email: email,
        sessionUrl: sessionData.properties.action_link,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in Cognito auth:", error);
    
    if (error.name === "JwtExpiredError") {
      return new Response(
        JSON.stringify({ error: "Token expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || "Authentication failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
