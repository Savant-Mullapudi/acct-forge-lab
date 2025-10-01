import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  email: string;
  code: string;
  newPassword: string;
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
    
    if (!email || !code || !newPassword) {
      throw new Error("Email, code, and new password are required");
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
