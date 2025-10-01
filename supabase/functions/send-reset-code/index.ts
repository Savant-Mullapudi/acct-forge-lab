import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetCodeRequest {
  email: string;
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

    const { email }: ResetCodeRequest = await req.json();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      throw new Error("Valid email is required");
    }

    // Try to find user by email using listUsers
    const { data: usersData } = await supabaseClient.auth.admin.listUsers();
    const user = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Return success even if user doesn't exist (prevent account enumeration)
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await supabaseClient.from('password_reset_codes').insert({
      user_id: user.id,
      email: email.toLowerCase(),
      code: resetCode,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    const emailResponse = await resend.emails.send({
      from: "Trace AQ <onboarding@resend.dev>",
      to: [email],
      subject: "Your Password Reset Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Password Reset Code
          </h1>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            You requested to reset your password. Use the code below to continue:
          </p>
          
          <div style="background-color: #f5f5f5; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="color: #2563eb; font-size: 36px; margin: 0; letter-spacing: 8px;">
              ${resetCode}
            </h2>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            This code will expire in 15 minutes.
          </p>
          
          <p style="font-size: 14px; color: #666;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Reset code email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error sending reset code:", error);
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
};

serve(handler);
