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
    const { id: disputeId, raised_by, order_id, reason, resolution_summary, status } = record;

    if (!disputeId || !status || status !== "resolved") {
      return new Response(
        JSON.stringify({ message: "No email needed" }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order with buyer and seller info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, amount, buyer_id, seller_id, buyer:users!buyer_id(email, display_name), seller:users!seller_id(email, display_name)")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Fetch the dispute resolution action from audit logs or use the status change
    // We determine action based on related transaction status
    const { data: txn } = await supabase
      .from("transactions")
      .select("status")
      .eq("order_id", order_id)
      .eq("type", "escrow")
      .single();

    const action = txn?.status === "cancelled" ? "refund" : "release";
    const formattedAmount = `R ${Number(order.amount || 0).toLocaleString()}`;

    const buyerName = order.buyer?.display_name || "Buyer";
    const sellerName = order.seller?.display_name || "Seller";
    const buyerEmail = order.buyer?.email;
    const sellerEmail = order.seller?.email;

    const subject = `⚖️ Dispute resolved — ${action === "refund" ? "Refund issued" : "Funds released"} — I'll Do It`;

    const html = (name: string, role: string) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0;">⚖️ Dispute Resolved</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi <strong>${name}</strong>,</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">The dispute for order <strong>#${order.id?.slice(0, 8)}</strong> (${formattedAmount}) has been resolved by an admin.</p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                <strong>Outcome:</strong> ${action === "refund" ? "The buyer has been refunded in full." : "The funds have been released to the seller."}
              </p>
              ${resolution_summary
                ? `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;"><strong>Admin notes:</strong> ${resolution_summary}</p>`
                : ""}
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">If you have questions about this resolution, please contact support.<br><br><strong style="color: #6366f1;">The I'll Do It Team</strong></p>
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

    const recipients: { email: string; htmlContent: string }[] = [];
    if (buyerEmail) {
      recipients.push({ email: buyerEmail, htmlContent: html(buyerName, "buyer") });
    }
    if (sellerEmail) {
      recipients.push({ email: sellerEmail, htmlContent: html(sellerName, "seller") });
    }

    const results = [];
    for (const r of recipients) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "I'll Do It <noreply@updates.illdoit.space>",
          to: [r.email],
          subject,
          html: r.htmlContent,
        }),
      });
      const data = await res.json();
      results.push({ email: r.email, data });
    }

    return new Response(JSON.stringify({ success: true, results }), {
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
