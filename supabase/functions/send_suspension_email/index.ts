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
    const { id, account_status, suspension_reason } = record;

    if (!id || !account_status) {
      throw new Error("Missing required fields: id, account_status");
    }

    if (!["suspended", "banned"].includes(account_status)) {
      return new Response(
        JSON.stringify({ message: "No email needed for this status" }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, display_name")
      .eq("id", id)
      .single();

    if (userError || !user?.email) {
      throw new Error("User not found or email missing");
    }

    const isBanned = account_status === "banned";
    const subject = isBanned
      ? "🚫 Your account has been banned — IllDOIT SPACE"
      : "⚠️ Your account has been suspended — IllDOIT SPACE";

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 40px 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0;">${isBanned ? "🚫" : "⚠️"}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi <strong>${user.display_name || "there"}</strong>,</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Your IllDOIT SPACE account has been <strong style="color: #dc2626;">${isBanned ? "banned" : "suspended"}</strong> by an admin.</p>
              ${suspension_reason
                ? `<p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 16px; padding: 12px 16px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;"><strong style="color: #dc2626;">Reason:</strong> ${suspension_reason}</p>`
                : '<p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">This action restricts your ability to use the platform, including posting content, messaging, and transactions.</p>'}
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">If you believe this was a mistake or would like to appeal, please contact support.<br><br><strong style="color: #dc2626;">IllDOIT SPACE Team</strong></p>
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
        from: "IllDOIT SPACE <noreply@updates.illdoit.space>",
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
