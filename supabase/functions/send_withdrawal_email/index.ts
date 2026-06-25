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
    const { id: withdrawalId, user_id, amount, status, rejection_reason } = record;

    if (!withdrawalId || !user_id || !status) {
      throw new Error("Missing required fields");
    }

    if (!["processed", "rejected"].includes(status)) {
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
      .eq("id", user_id)
      .single();

    if (userError || !user?.email) {
      throw new Error("User not found or email missing");
    }

    const isApproved = status === "processed";
    const formattedAmount = `R ${Number(amount || 0).toLocaleString()}`;
    const subject = isApproved
      ? `💰 Withdrawal of ${formattedAmount} approved — IllDOIT SPACE`
      : `❌ Withdrawal of ${formattedAmount} rejected — IllDOIT SPACE`;

    const html = isApproved
      ? `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #059669, #10b981); padding: 40px 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg></h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi <strong>${user.display_name || "there"}</strong>,</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Your withdrawal request for <strong style="color: #059669; font-size: 20px;">${formattedAmount}</strong> has been <strong style="color: #059669;">approved</strong>.</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">The funds are being processed and will be sent to your bank account. Depending on your bank, this may take 1–3 business days.</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">Keep hustling,<br><strong style="color: #059669;">IllDOIT SPACE Team</strong></p>
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
</html>`
      : `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 40px 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi <strong>${user.display_name || "there"}</strong>,</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Your withdrawal request for <strong style="color: #dc2626;">${formattedAmount}</strong> was <strong style="color: #dc2626;">rejected</strong>.</p>
              ${rejection_reason
                ? `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;"><strong>Reason:</strong> ${rejection_reason}</p>`
                : ""}
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Your funds have been returned to your wallet. You can submit a new withdrawal request at any time.</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">If you have questions, please contact support.<br><br><strong style="color: #dc2626;">IllDOIT SPACE Team</strong></p>
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
