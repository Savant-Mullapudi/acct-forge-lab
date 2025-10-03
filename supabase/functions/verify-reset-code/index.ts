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

          // Helper function for HMAC signing
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

          // Create signing key
          let signingKey = encoder.encode(`AWS4${awsSecretAccessKey}`);
          signingKey = await hmac(signingKey, dateStamp);
          signingKey = await hmac(signingKey, awsRegion);
          signingKey = await hmac(signingKey, service);
          signingKey = await hmac(signingKey, "aws4_request");

          const signature = await hmac(signingKey, stringToSign);
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
            console.error('Cognito password sync error (direct AdminSetUserPassword):', errorText);

            // Fallback: resolve actual Cognito Username via ListUsers filtered by email, then retry
            try {
              const listTarget = "AWSCognitoIdentityProviderService.ListUsers";
              const listPayload = JSON.stringify({
                UserPoolId: cognitoUserPoolId,
                Filter: `email = \"${email}\"`,
                Limit: 1,
              });

              const timestamp2 = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
              const dateStamp2 = timestamp2.slice(0, 8);
              const canonicalHeaders2 = `content-type:application/x-amz-json-1.1\nhost:${host}\nx-amz-date:${timestamp2}\nx-amz-target:${listTarget}\n`;
              const signedHeaders2 = "content-type;host;x-amz-date;x-amz-target";

              const payloadHash2 = await crypto.subtle.digest("SHA-256", encoder.encode(listPayload));
              const payloadHashHex2 = Array.from(new Uint8Array(payloadHash2)).map((b) => b.toString(16).padStart(2, "0")).join("");
              const canonicalRequest2 = `POST\n/\n\n${canonicalHeaders2}\n${signedHeaders2}\n${payloadHashHex2}`;
              const canonicalRequestHash2 = await crypto.subtle.digest("SHA-256", encoder.encode(canonicalRequest2));
              const canonicalRequestHashHex2 = Array.from(new Uint8Array(canonicalRequestHash2)).map((b) => b.toString(16).padStart(2, "0")).join("");
              const credentialScope2 = `${dateStamp2}/${awsRegion}/${service}/aws4_request`;
              const stringToSign2 = `AWS4-HMAC-SHA256\n${timestamp2}\n${credentialScope2}\n${canonicalRequestHashHex2}`;

              // Create signing key for ListUsers
              let signingKey2 = encoder.encode(`AWS4${awsSecretAccessKey}`);
              signingKey2 = await hmac(signingKey2, dateStamp2);
              signingKey2 = await hmac(signingKey2, awsRegion);
              signingKey2 = await hmac(signingKey2, service);
              signingKey2 = await hmac(signingKey2, "aws4_request");

              const signature2 = await hmac(signingKey2, stringToSign2);
              const signatureHex2 = Array.from(new Uint8Array(signature2)).map((b) => b.toString(16).padStart(2, "0")).join("");
              const authorizationHeader2 = `AWS4-HMAC-SHA256 Credential=${awsAccessKeyId}/${credentialScope2}, SignedHeaders=${signedHeaders2}, Signature=${signatureHex2}`;

              const listResp = await fetch(`https://${host}/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-amz-json-1.1",
                  "X-Amz-Date": timestamp2,
                  "X-Amz-Target": listTarget,
                  "Authorization": authorizationHeader2,
                },
                body: listPayload,
              });

              if (listResp.ok) {
                const listJson: any = await listResp.json();
                const username = listJson?.Users?.[0]?.Username;
                if (username) {
                  console.log('Resolved Cognito Username via ListUsers:', username);

                  // Retry AdminSetUserPassword with resolved Username
                  const retryPayload = JSON.stringify({
                    UserPoolId: cognitoUserPoolId,
                    Username: username,
                    Password: newPassword,
                    Permanent: true,
                  });

                  const timestamp3 = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
                  const dateStamp3 = timestamp3.slice(0, 8);
                  const canonicalHeaders3 = `content-type:application/x-amz-json-1.1\nhost:${host}\nx-amz-date:${timestamp3}\nx-amz-target:${target}\n`;
                  const signedHeaders3 = "content-type;host;x-amz-date;x-amz-target";

                  const payloadHash3 = await crypto.subtle.digest("SHA-256", encoder.encode(retryPayload));
                  const payloadHashHex3 = Array.from(new Uint8Array(payloadHash3)).map((b) => b.toString(16).padStart(2, "0")).join("");
                  const canonicalRequest3 = `POST\n/\n\n${canonicalHeaders3}\n${signedHeaders3}\n${payloadHashHex3}`;
                  const canonicalRequestHash3 = await crypto.subtle.digest("SHA-256", encoder.encode(canonicalRequest3));
                  const canonicalRequestHashHex3 = Array.from(new Uint8Array(canonicalRequestHash3)).map((b) => b.toString(16).padStart(2, "0")).join("");
                  const credentialScope3 = `${dateStamp3}/${awsRegion}/${service}/aws4_request`;
                  const stringToSign3 = `AWS4-HMAC-SHA256\n${timestamp3}\n${credentialScope3}\n${canonicalRequestHashHex3}`;

                  // Create signing key for retry
                  let signingKey3 = encoder.encode(`AWS4${awsSecretAccessKey}`);
                  signingKey3 = await hmac(signingKey3, dateStamp3);
                  signingKey3 = await hmac(signingKey3, awsRegion);
                  signingKey3 = await hmac(signingKey3, service);
                  signingKey3 = await hmac(signingKey3, "aws4_request");

                  const signature3 = await hmac(signingKey3, stringToSign3);
                  const signatureHex3 = Array.from(new Uint8Array(signature3)).map((b) => b.toString(16).padStart(2, "0")).join("");
                  const authorizationHeader3 = `AWS4-HMAC-SHA256 Credential=${awsAccessKeyId}/${credentialScope3}, SignedHeaders=${signedHeaders3}, Signature=${signatureHex3}`;

                  const retryResp = await fetch(`https://${host}/`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/x-amz-json-1.1",
                      "X-Amz-Date": timestamp3,
                      "X-Amz-Target": target,
                      "Authorization": authorizationHeader3,
                    },
                    body: retryPayload,
                  });

                  if (!retryResp.ok) {
                    const retryText = await retryResp.text();
                    console.error('Cognito retry password sync error:', retryText);
                  } else {
                    console.log('Password synced to Cognito successfully (after resolving Username)');
                  }
                } else {
                  console.error('Cognito ListUsers did not return a Username for email:', email);
                }
              } else {
                const listText = await listResp.text();
                console.error('Cognito ListUsers request failed:', listText);
              }
            } catch (listErr) {
              console.error('Cognito ListUsers fallback failed:', listErr);
            }
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
