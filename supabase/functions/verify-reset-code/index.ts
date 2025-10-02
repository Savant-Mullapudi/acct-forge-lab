import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  email: string;
  code: string;
  newPassword?: string; // Optional - if not provided, only verify code
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { email, code, newPassword }: VerifyCodeRequest = await req.json();
    
    if (!email || !code) {
      throw new Error("Email and code are required");
    }

    const { data: resetCodes, error: fetchError } = await supabaseClient
      .from('password_reset_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError || !resetCodes || resetCodes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const resetCode = resetCodes[0];

    // If newPassword is provided, update the password and mark code as used
    if (newPassword) {
      await supabaseClient
        .from('password_reset_codes')
        .update({ used: true })
        .eq('id', resetCode.id);

      const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
        resetCode.user_id,
        { password: newPassword }
      );

      if (updateError) {
        throw updateError;
      }

      // Sync password change to AWS Cognito
      try {
        const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
        const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
        const awsRegion = Deno.env.get("AWS_REGION");
        const cognitoUserPoolId = Deno.env.get("AWS_COGNITO_USER_POOL_ID");

        if (awsAccessKeyId && awsSecretAccessKey && awsRegion && cognitoUserPoolId) {
          console.log('Syncing password change to Cognito for:', email);
          
          // AWS Signature V4 signing (simplified for AdminSetUserPassword)
          const service = "cognito-idp";
          const host = `${service}.${awsRegion}.amazonaws.com`;
          const target = "AWSCognitoIdentityProviderService.AdminSetUserPassword";
          
          const payload = JSON.stringify({
            UserPoolId: cognitoUserPoolId,
            Username: email,
            Password: newPassword,
            Permanent: true,
          });

          const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
          const dateStamp = timestamp.slice(0, 8);

          const canonicalHeaders = `content-type:application/x-amz-json-1.1\nhost:${host}\nx-amz-date:${timestamp}\nx-amz-target:${target}\n`;
          const signedHeaders = "content-type;host;x-amz-date;x-amz-target";

          const encoder = new TextEncoder();
          const payloadHash = await crypto.subtle.digest("SHA-256", encoder.encode(payload));
          const payloadHashHex = Array.from(new Uint8Array(payloadHash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHashHex}`;
          const canonicalRequestHash = await crypto.subtle.digest("SHA-256", encoder.encode(canonicalRequest));
          const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          const credentialScope = `${dateStamp}/${awsRegion}/${service}/aws4_request`;
          const stringToSign = `AWS4-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${canonicalRequestHashHex}`;

          const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string) => {
            const kDate = await crypto.subtle.importKey("raw", encoder.encode(`AWS4${key}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
            const kDateSig = await crypto.subtle.sign("HMAC", kDate, encoder.encode(dateStamp));
            const kRegion = await crypto.subtle.importKey("raw", kDateSig, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
            const kRegionSig = await crypto.subtle.sign("HMAC", kRegion, encoder.encode(regionName));
            const kService = await crypto.subtle.importKey("raw", kRegionSig, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
            const kServiceSig = await crypto.subtle.sign("HMAC", kService, encoder.encode(serviceName));
            const kSigning = await crypto.subtle.importKey("raw", kServiceSig, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
            return kSigning;
          };

          const signingKey = await getSignatureKey(awsSecretAccessKey, dateStamp, awsRegion, service);
          const signature = await crypto.subtle.sign("HMAC", signingKey, encoder.encode(stringToSign));
          const signatureHex = Array.from(new Uint8Array(signature))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${awsAccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;

          const cognitoResponse = await fetch(`https://${host}/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-amz-json-1.1",
              "X-Amz-Date": timestamp,
              "X-Amz-Target": target,
              "Authorization": authorizationHeader,
            },
            body: payload,
          });

          if (!cognitoResponse.ok) {
            const errorText = await cognitoResponse.text();
            console.error('Cognito password sync error:', errorText);
          } else {
            console.log('Password synced to Cognito successfully');
          }
        }
      } catch (cognitoError) {
        console.error('Cognito password sync failed:', cognitoError);
        // Don't block the password reset if Cognito sync fails
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error verifying reset code:", error);
    
    return new Response(
      JSON.stringify({ error: "Failed to reset password" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

serve(handler);
