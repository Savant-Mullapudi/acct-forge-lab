// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

async function createCognitoUser(
  email: string,
  password: string,
  userPoolId: string,
  region: string,
  firstName?: string,
  lastName?: string
) {
  const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials not configured");
  }

  // AWS Signature Version 4 signing
  const service = "cognito-idp";
  const host = `${service}.${region}.amazonaws.com`;
  const endpoint = `https://${host}/`;
  
  const payload = {
    UserPoolId: userPoolId,
    Username: email,
    TemporaryPassword: password,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "email_verified", Value: "true" },
      ...(firstName ? [{ Name: "given_name", Value: firstName }] : []),
      ...(lastName ? [{ Name: "family_name", Value: lastName }] : []),
    ],
    MessageAction: "SUPPRESS", // Don't send welcome email
  };

  const body = JSON.stringify(payload);
  const headers = {
    "Content-Type": "application/x-amz-json-1.1",
    "X-Amz-Target": "AWSCognitoIdentityProviderService.AdminCreateUser",
  };

  // Create AWS Signature V4
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  
  const canonicalUri = "/";
  const canonicalQuerystring = "";
  const canonicalHeaders = `content-type:${headers["Content-Type"]}\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:${headers["X-Amz-Target"]}\n`;
  const signedHeaders = "content-type;host;x-amz-date;x-amz-target";
  
  const encoder = new TextEncoder();
  const payloadHash = await crypto.subtle.digest("SHA-256", encoder.encode(body));
  const payloadHashHex = Array.from(new Uint8Array(payloadHash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  const canonicalRequest = `POST\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHashHex}`;
  
  const canonicalRequestHash = await crypto.subtle.digest("SHA-256", encoder.encode(canonicalRequest));
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHashHex}`;
  
  // Create signing key
  async function hmac(key: Uint8Array, data: string): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
    return new Uint8Array(signature);
  }
  
  let key = encoder.encode(`AWS4${secretAccessKey}`);
  key = await hmac(key, dateStamp);
  key = await hmac(key, region);
  key = await hmac(key, service);
  key = await hmac(key, "aws4_request");
  
  const signature = await hmac(key, stringToSign);
  const signatureHex = Array.from(signature)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;
  
  // Make request to Cognito
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...headers,
      "X-Amz-Date": amzDate,
      "Authorization": authorizationHeader,
    },
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cognito error: ${error}`);
  }

  const result = await response.json();
  
  // Set permanent password
  const setPwdPayload = {
    UserPoolId: userPoolId,
    Username: email,
    Password: password,
    Permanent: true,
  };

  const setPwdBody = JSON.stringify(setPwdPayload);
  const setPwdHeaders = {
    "Content-Type": "application/x-amz-json-1.1",
    "X-Amz-Target": "AWSCognitoIdentityProviderService.AdminSetUserPassword",
  };

  const setPwdAmzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const setPwdPayloadHash = await crypto.subtle.digest("SHA-256", encoder.encode(setPwdBody));
  const setPwdPayloadHashHex = Array.from(new Uint8Array(setPwdPayloadHash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  const setPwdCanonicalHeaders = `content-type:${setPwdHeaders["Content-Type"]}\nhost:${host}\nx-amz-date:${setPwdAmzDate}\nx-amz-target:${setPwdHeaders["X-Amz-Target"]}\n`;
  const setPwdCanonicalRequest = `POST\n${canonicalUri}\n${canonicalQuerystring}\n${setPwdCanonicalHeaders}\n${signedHeaders}\n${setPwdPayloadHashHex}`;
  
  const setPwdCanonicalRequestHash = await crypto.subtle.digest("SHA-256", encoder.encode(setPwdCanonicalRequest));
  const setPwdCanonicalRequestHashHex = Array.from(new Uint8Array(setPwdCanonicalRequestHash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  const setPwdDateStamp = setPwdAmzDate.slice(0, 8);
  const setPwdCredentialScope = `${setPwdDateStamp}/${region}/${service}/aws4_request`;
  const setPwdStringToSign = `AWS4-HMAC-SHA256\n${setPwdAmzDate}\n${setPwdCredentialScope}\n${setPwdCanonicalRequestHashHex}`;
  
  let setPwdKey = encoder.encode(`AWS4${secretAccessKey}`);
  setPwdKey = await hmac(setPwdKey, setPwdDateStamp);
  setPwdKey = await hmac(setPwdKey, region);
  setPwdKey = await hmac(setPwdKey, service);
  setPwdKey = await hmac(setPwdKey, "aws4_request");
  
  const setPwdSignature = await hmac(setPwdKey, setPwdStringToSign);
  const setPwdSignatureHex = Array.from(setPwdSignature)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  const setPwdAuthHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${setPwdCredentialScope}, SignedHeaders=${signedHeaders}, Signature=${setPwdSignatureHex}`;
  
  const setPwdResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...setPwdHeaders,
      "X-Amz-Date": setPwdAmzDate,
      "Authorization": setPwdAuthHeader,
    },
    body: setPwdBody,
  });

  if (!setPwdResponse.ok) {
    const error = await setPwdResponse.text();
    console.error("Failed to set permanent password:", error);
  }

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, firstName, lastName } = await req.json() as CreateUserRequest;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const userPoolId = Deno.env.get("AWS_COGNITO_USER_POOL_ID");
    const region = Deno.env.get("AWS_REGION");

    if (!userPoolId || !region) {
      console.error("Missing Cognito configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Creating Cognito user:", email);
    const result = await createCognitoUser(email, password, userPoolId, region, firstName, lastName);
    console.log("Cognito user created successfully");

    return new Response(
      JSON.stringify({ success: true, user: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating Cognito user:", error);
    
    // Handle user already exists error gracefully
    if (error.message?.includes("UsernameExistsException") || error.message?.includes("already exists")) {
      return new Response(
        JSON.stringify({ success: true, message: "User already exists in Cognito" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || "Failed to create Cognito user" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
