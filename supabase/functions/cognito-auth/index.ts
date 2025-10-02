import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { decode as base64UrlDecode } from "https://deno.land/std@0.190.0/encoding/base64url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CognitoAuthRequest {
  accessToken: string;
  idToken: string;
}

interface JWK {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
}

interface JWKS {
  keys: JWK[];
}

interface JWTHeader {
  kid: string;
  alg: string;
}

interface JWTPayload {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  exp: number;
  iss: string;
  aud: string;
}

async function fetchJWKS(userPoolId: string, region: string): Promise<JWKS> {
  const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  const response = await fetch(jwksUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
  }
  return await response.json();
}

function decodeJWT(token: string): { header: JWTHeader; payload: JWTPayload; signature: string } {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  
  return { header, payload, signature: parts[2] };
}

async function verifyJWT(token: string, userPoolId: string, region: string, clientId: string): Promise<JWTPayload> {
  const { header, payload, signature } = decodeJWT(token);

  // Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error("Token expired");
  }

  // Verify issuer
  const expectedIssuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  if (payload.iss !== expectedIssuer) {
    throw new Error("Invalid issuer");
  }

  // Verify audience (client ID)
  if (payload.aud !== clientId) {
    throw new Error("Invalid audience");
  }

  // Fetch JWKS and find the right key
  const jwks = await fetchJWKS(userPoolId, region);
  const jwk = jwks.keys.find((key) => key.kid === header.kid);
  
  if (!jwk) {
    throw new Error("Public key not found in JWKS");
  }

  // Import the public key
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: jwk.kty,
      n: jwk.n,
      e: jwk.e,
      alg: jwk.alg,
      use: jwk.use,
    },
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["verify"]
  );

  // Verify signature
  const encoder = new TextEncoder();
  const data = encoder.encode(token.split(".").slice(0, 2).join("."));
  const signatureBytes = new Uint8Array(base64UrlDecode(signature));

  const isValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    signatureBytes,
    data
  );

  if (!isValid) {
    throw new Error("Invalid signature");
  }

  return payload;
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

    // Get Cognito configuration
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
    const payload = await verifyJWT(idToken, userPoolId, region, clientId);
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
    
    if (error.message?.includes("expired")) {
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
