import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const webhookSecret = req.headers.get("x-webhook-secret");
    if (webhookSecret !== Deno.env.get("WEBHOOK_SECRET")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const { record } = await req.json();
    const { id, content_type, title, owner_id } = record;

    if (!id || !content_type || !owner_id) {
      throw new Error("Missing required fields");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, display_name")
      .eq("id", owner_id)
      .single();

    if (userError || !user?.email) {
      throw new Error("User not found or email missing");
    }

    const typeLabel = content_type === "service" ? "Service" : "Job";
    const subject = `🗑️ Your ${typeLabel.toLowerCase()} "${title}" has been removed — I'll Do It`;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0;">🗑️ Content Removed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi <strong>${user.display_name || "there"}</strong>,</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Your ${typeLabel.toLowerCase()} <strong>"${title}"</strong> has been removed from the platform by an admin.</p>
              <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">This typically happens when content violates our community guidelines or terms of service.</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">If you believe this was a mistake, please contact support.<br><br><strong style="color: #d97706;">The I'll Do It Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background: #f9fafb; padding: 20px 32px; text-align: center;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0;">&copy; 2026 I'll Do It. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "I'll Do It <noreply@updates.illdoit.space>",
        to: [user.email],
        subject,
        html,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
});
