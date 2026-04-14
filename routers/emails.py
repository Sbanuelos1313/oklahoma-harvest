import resend
import os

resend.api_key = os.getenv("RESEND_API_KEY")
FROM_EMAIL = "From Our Place <noreply@from-our-place.com>"

def send_email(to: str, subject: str, html: str):
    """Fire and forget email — never blocks the main flow."""
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html
        })
    except Exception as e:
        print(f"Email failed to {to}: {e}")

def base_template(content: str, preview: str = "") -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>From Our Place</title>
</head>
<body style="margin:0;padding:0;background:#F0E6D3;font-family:'DM Sans',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">

  <!-- HEADER -->
  <div style="background:#2D1A0E;border-radius:16px 16px 0 0;padding:24px 28px;text-align:center;">
    <div style="font-size:28px;margin-bottom:6px;">🌾</div>
    <div style="font-family:Georgia,serif;font-size:22px;color:#FAF5EC;font-weight:700;">From Our Place</div>
    <div style="font-size:11px;color:rgba(250,245,236,0.5);letter-spacing:2px;text-transform:uppercase;margin-top:3px;">Farm to Table Marketplace</div>
  </div>

  <!-- BODY -->
  <div style="background:#FFFFFF;padding:28px;border-left:1px solid rgba(45,26,14,0.08);border-right:1px solid rgba(45,26,14,0.08);">
    {content}
  </div>

  <!-- FOOTER -->
  <div style="background:#2D1A0E;border-radius:0 0 16px 16px;padding:18px 28px;text-align:center;">
    <p style="font-size:11px;color:rgba(250,245,236,0.4);margin:0;">From Our Place · Farm to Table Marketplace</p>
    <p style="font-size:11px;color:rgba(250,245,236,0.3);margin:4px 0 0;">Oklahoma & beyond 🌾</p>
  </div>

</div>
</body>
</html>"""

# ── EMAIL FUNCTIONS ────────────────────────────────────────────────────────

def email_producer_approved(to_email: str, shop_name: str, producer_name: str):
    content = f"""
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#2D1A0E;margin:0 0 12px;">You're approved! 🎉</h2>
    <p style="font-size:15px;color:#5C4033;line-height:1.7;margin:0 0 16px;">Hi {producer_name},</p>
    <p style="font-size:15px;color:#5C4033;line-height:1.7;margin:0 0 20px;">
      <strong>{shop_name}</strong> has been approved and is now live on From Our Place. Shoppers in your area can discover your products!
    </p>
    <div style="background:#EDF4EC;border:1px solid #C8DBC5;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <div style="font-size:13px;font-weight:700;color:#4A6741;margin-bottom:8px;">Next steps:</div>
      <div style="font-size:13px;color:#5C4033;line-height:1.8;">
        ✓ Add your products to your inventory<br>
        ✓ Set up Stripe Connect to receive payments<br>
        ✓ Share your shop with your community
      </div>
    </div>
    <a href="https://from-our-place-api.onrender.com/static/producer.html"
       style="display:block;background:#4A6741;color:white;text-align:center;padding:13px;border-radius:11px;text-decoration:none;font-size:14px;font-weight:700;">
      Go to Producer Dashboard →
    </a>"""
    send_email(to_email, f"🌾 {shop_name} is now live on From Our Place!", base_template(content))


def email_new_order(to_email: str, producer_name: str, shop_name: str, order_id: int, shopper_name: str, items_text: str, total: float, fulfillment: str, hours: int = 12):
    content = f"""
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#2D1A0E;margin:0 0 12px;">New order received! 🛒</h2>
    <p style="font-size:15px;color:#5C4033;line-height:1.7;margin:0 0 16px;">Hi {producer_name},</p>
    <p style="font-size:15px;color:#5C4033;line-height:1.7;margin:0 0 16px;">
      You have a new order from <strong>{shopper_name}</strong>. Please respond within <strong>{hours} hours</strong> or it will be automatically cancelled.
    </p>
    <div style="background:#FFF3E0;border:1px solid rgba(184,106,26,0.2);border-radius:12px;padding:16px 20px;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:700;color:#B86A1A;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.8px;">Order #{order_id}</div>
      <div style="font-size:13px;color:#5C4033;line-height:1.8;">{items_text}</div>
      <div style="border-top:1px solid rgba(45,26,14,0.1);margin-top:10px;padding-top:10px;display:flex;justify-content:space-between;">
        <span style="font-size:13px;color:#8C6E5A;">Fulfillment: {fulfillment}</span>
        <span style="font-size:15px;font-weight:800;color:#2D1A0E;">Total: ${total:.2f}</span>
      </div>
    </div>
    <a href="https://from-our-place-api.onrender.com/static/producer.html"
       style="display:block;background:#4A6741;color:white;text-align:center;padding:13px;border-radius:11px;text-decoration:none;font-size:14px;font-weight:700;">
      Accept or Decline Order →
    </a>"""
    send_email(to_email, f"🛒 New order #{order_id} — respond within {hours} hours", base_template(content))


def email_order_confirmed(to_email: str, shopper_name: str, shop_name: str, order_id: int, fulfillment: str, total: float):
    content = f"""
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#2D1A0E;margin:0 0 12px;">Order confirmed ✓</h2>
    <p style="font-size:15px;color:#5C4033;line-height:1.7;margin:0 0 16px;">Hi {shopper_name},</p>
    <p style="font-size:15px;color:#5C4033;line-height:1.7;margin:0 0 16px;">
      Great news! <strong>{shop_name}</strong> has confirmed your order. They'll let you know when it's ready.
    </p>
    <div style="background:#EDF4EC;border:1px solid #C8DBC5;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <div style="font-size:13px;color:#5C4033;line-height:1.8;">
        <strong>Order #{order_id}</strong><br>
        Fulfillment: {fulfillment}<br>
        Total: <strong>${total:.2f}</strong>
      </div>
    </div>
    <a href="https://from-our-place-api.onrender.com/static/app.html"
       style="display:block;background:#4A6741;color:white;text-align:center;padding:13px;border-radius:11px;text-decoration:none;font-size:14px;font-weight:700;">
      View Your Orders →
    </a>"""
    send_email(to_email, f"✓ Order #{order_id} confirmed by {shop_name}", base_template(content))


def email_order_ready(to_email: str, shopper_name: str, shop_name: str, order_id: int, fulfillment: str):
    emoji = "🚚" if fulfillment == "delivery" else "🛍️"
    action = "is out for delivery" if fulfillment == "delivery" else "is ready for pickup"
    content = f"""
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#2D1A0E;margin:0 0 12px;">{emoji} Your order {action}!</h2>
    <p style="font-size:15px;color:#5C4033;line-height:1.7;margin:0 0 16px;">Hi {shopper_name},</p>
    <p style="font-size:15px;color:#5C4033;line-height:1.7;margin:0 0 20px;">
      Your order from <strong>{shop_name}</strong> (Order #{order_id}) {action}.
      {"Head over to pick it up!" if fulfillment != "delivery" else "It's on its way to you!"}
    </p>
    <a href="https://from-our-place-api.onrender.com/static/app.html"
       style="display:block;background:#4A6741;color:white;text-align:center;padding:13px;border-radius:11px;text-decoration:none;font-size:14px;font-weight:700;">
      View Order Details →
    </a>"""
    send_email(to_email, f"{emoji} Order #{order_id} {action}!", base_template(content))


def email_order_cancelled(to_email: str, shopper_name: str, shop_name: str, order_id: int, total: float, auto: bool = False):
    reason = "was not confirmed by the producer in time" if auto else "has been cancelled"
    content = f"""
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#2D1A0E;margin:0 0 12px;">Order cancelled</h2>
    <p style="font-size:15px;color:#5C4033;line-height:1.7;margin:0 0 16px;">Hi {shopper_name},</p>
    <p style="font-size:15px;color:#5C4033;line-height:1.7;margin:0 0 16px;">
      Your order #{order_id} from <strong>{shop_name}</strong> {reason}.
      A full refund of <strong>${total:.2f}</strong> has been issued to your original payment method.
    </p>
    <div style="background:#FFEBEE;border:1px solid rgba(198,40,40,0.15);border-radius:12px;padding:14px 18px;margin-bottom:20px;font-size:13px;color:#C62828;">
      Refunds typically appear within 5–10 business days depending on your bank.
    </div>
    <a href="https://from-our-place-api.onrender.com/static/app.html"
       style="display:block;background:#4A6741;color:white;text-align:center;padding:13px;border-radius:11px;text-decoration:none;font-size:14px;font-weight:700;">
      Find Another Producer →
    </a>"""
    send_email(to_email, f"Order #{order_id} cancelled — full refund issued", base_template(content))
