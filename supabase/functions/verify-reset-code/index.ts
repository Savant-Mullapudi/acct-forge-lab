// @ts-nocheck
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
          
          const service = "cognito-idp";
          const host = `${service}.${awsRegion}.amazonaws.com`;
          const encoder = new TextEncoder();

          // Helper function for HMAC signing
          const hmac = async (key: Uint8Array, data: string): Promise<Uint8Array> => {
            const cryptoKey = await crypto.subtle.importKey(
              "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
            );
            const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
            return new Uint8Array(signature);
          };

          // Helper to create AWS signing key
          const createSigningKey = async (dateStamp: string): Promise<Uint8Array> => {
            let key = encoder.encode(`AWS4${awsSecretAccessKey}`);
            key = await hmac(key, dateStamp);
            key = await hmac(key, awsRegion);
            key = await hmac(key, service);
            key = await hmac(key, "aws4_request");
            return key;
          };

          // Helper to sign AWS request
          const signRequest = async (target: string, payload: string) => {
            const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
            const dateStamp = timestamp.slice(0, 8);
            const canonicalHeaders = `content-type:application/x-amz-json-1.1\nhost:${host}\nx-amz-date:${timestamp}\nx-amz-target:${target}\n`;
            const signedHeaders = "content-type;host;x-amz-date;x-amz-target";

            const payloadHash = await crypto.subtle.digest("SHA-256", encoder.encode(payload));
            const payloadHashHex = Array.from(new Uint8Array(payloadHash))
              .map((b) => b.toString(16).padStart(2, "0")).join("");

            const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHashHex}`;
            const canonicalRequestHash = await crypto.subtle.digest("SHA-256", encoder.encode(canonicalRequest));
            const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
              .map((b) => b.toString(16).padStart(2, "0")).join("");

            const credentialScope = `${dateStamp}/${awsRegion}/${service}/aws4_request`;
            const stringToSign = `AWS4-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${canonicalRequestHashHex}`;

            const signingKey = await createSigningKey(dateStamp);
            const signature = await hmac(signingKey, stringToSign);
            const signatureHex = Array.from(signature).map((b) => b.toString(16).padStart(2, "0")).join("");

            return {
              timestamp,
              authHeader: `AWS4-HMAC-SHA256 Credential=${awsAccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`
            };
          };

          // Try setting password with email first
          const setPasswordPayload = JSON.stringify({
            UserPoolId: cognitoUserPoolId,
            Username: email,
            Password: newPassword,
            Permanent: true,
          });

          const { timestamp, authHeader } = await signRequest(
            "AWSCognitoIdentityProviderService.AdminSetUserPassword",
            setPasswordPayload
          );

          const cognitoResponse = await fetch(`https://${host}/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-amz-json-1.1",
              "X-Amz-Date": timestamp,
              "X-Amz-Target": "AWSCognitoIdentityProviderService.AdminSetUserPassword",
              "Authorization": authHeader,
            },
            body: setPasswordPayload,
          });

          if (!cognitoResponse.ok) {
            console.error('Initial password sync failed, trying to resolve username...');

            // Fallback: Get actual Cognito username via ListUsers
            const listPayload = JSON.stringify({
              UserPoolId: cognitoUserPoolId,
              Filter: `email = \"${email}\"`,
              Limit: 1,
            });

            const listSig = await signRequest(
              "AWSCognitoIdentityProviderService.ListUsers",
              listPayload
            );

            const listResp = await fetch(`https://${host}/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-amz-json-1.1",
                "X-Amz-Date": listSig.timestamp,
                "X-Amz-Target": "AWSCognitoIdentityProviderService.ListUsers",
                "Authorization": listSig.authHeader,
              },
              body: listPayload,
            });

            if (listResp.ok) {
              const listJson: any = await listResp.json();
              const username = listJson?.Users?.[0]?.Username;
              
              if (username) {
                console.log('Resolved Cognito Username:', username);

                const retryPayload = JSON.stringify({
                  UserPoolId: cognitoUserPoolId,
                  Username: username,
                  Password: newPassword,
                  Permanent: true,
                });

                const retrySig = await signRequest(
                  "AWSCognitoIdentityProviderService.AdminSetUserPassword",
                  retryPayload
                );

                const retryResp = await fetch(`https://${host}/`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-amz-json-1.1",
                    "X-Amz-Date": retrySig.timestamp,
                    "X-Amz-Target": "AWSCognitoIdentityProviderService.AdminSetUserPassword",
                    "Authorization": retrySig.authHeader,
                  },
                  body: retryPayload,
                });

                if (retryResp.ok) {
                  console.log('Password synced to Cognito (with resolved username)');
                } else {
                  console.error('Retry failed:', await retryResp.text());
                }
              }
            }
          } else {
            console.log('Password synced to Cognito successfully');
          }
        }
      } catch (cognitoError) {
        console.error('Cognito password sync failed:', cognitoError);
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
