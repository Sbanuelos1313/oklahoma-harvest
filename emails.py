import resend
import os

resend.api_key = os.getenv("RESEND_API_KEY")
FROM_EMAIL = "From Our Place <onboarding@resend.dev>"

def send_email(to, subject, html):
    try:
        resend.Emails.send({"from": FROM_EMAIL, "to": [to], "subject": subject, "html": html})
    except Exception as e:
        print(f"Email failed to {to}: {e}")

def base_template(content):
    return f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F0E6D3;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
<div style="background:#2D1A0E;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
<div style="font-family:Georgia,serif;font-size:22px;color:#FAF5EC;font-weight:700;">From Our Place</div>
<div style="font-size:11px;color:rgba(250,245,236,0.5);letter-spacing:2px;text-transform:uppercase;">Farm to Table Marketplace</div>
</div>
<div style="background:#FFFFFF;padding:28px;border:1px solid rgba(45,26,14,0.08);">{content}</div>
<div style="background:#2D1A0E;border-radius:0 0 16px 16px;padding:18px;text-align:center;">
<p style="font-size:11px;color:rgba(250,245,236,0.4);margin:0;">From Our Place - from-our-place.chronos-ai.net</p>
</div></div></body></html>"""

def email_producer_approved(to_email, shop_name, producer_name):
    content = f"<h2 style='color:#2D1A0E;'>You're approved!</h2><p>Hi {producer_name}, <strong>{shop_name}</strong> is now live on From Our Place!</p><p>Next steps: Add your products, set up Stripe Connect to receive payments.</p><a href='https://from-our-place.chronos-ai.net/static/producer.html' style='display:block;background:#4A6741;color:white;text-align:center;padding:13px;border-radius:11px;text-decoration:none;font-weight:700;'>Go to Producer Dashboard</a>"
    send_email(to_email, f"{shop_name} is now live on From Our Place!", base_template(content))

def email_new_order(to_email, producer_name, shop_name, order_id, shopper_name, items_text, total, fulfillment, hours=12):
    content = f"<h2 style='color:#2D1A0E;'>New order received!</h2><p>Hi {producer_name}, you have a new order from <strong>{shopper_name}</strong>. Respond within {hours} hours.</p><div style='background:#FFF3E0;border-radius:12px;padding:16px;margin-bottom:16px;'><strong>Order #{order_id}</strong><br>{items_text}<br>Fulfillment: {fulfillment}<br><strong>Total: </strong></div><a href='https://from-our-place.chronos-ai.net/static/producer.html' style='display:block;background:#4A6741;color:white;text-align:center;padding:13px;border-radius:11px;text-decoration:none;font-weight:700;'>Accept or Decline Order</a>"
    send_email(to_email, f"New order #{order_id} - respond within {hours} hours", base_template(content))

def email_order_confirmed(to_email, shopper_name, shop_name, order_id, fulfillment, total):
    content = f"<h2 style='color:#2D1A0E;'>Order confirmed!</h2><p>Hi {shopper_name}, <strong>{shop_name}</strong> confirmed your order #{order_id}. Total: . Fulfillment: {fulfillment}.</p><a href='https://from-our-place.chronos-ai.net/static/app.html' style='display:block;background:#4A6741;color:white;text-align:center;padding:13px;border-radius:11px;text-decoration:none;font-weight:700;'>View Your Orders</a>"
    send_email(to_email, f"Order #{order_id} confirmed by {shop_name}", base_template(content))

def email_order_ready(to_email, shopper_name, shop_name, order_id, fulfillment):
    action = "is out for delivery" if fulfillment == "delivery" else "is ready for pickup"
    content = f"<h2 style='color:#2D1A0E;'>Your order {action}!</h2><p>Hi {shopper_name}, your order from <strong>{shop_name}</strong> (#{order_id}) {action}.</p><a href='https://from-our-place.chronos-ai.net/static/app.html' style='display:block;background:#4A6741;color:white;text-align:center;padding:13px;border-radius:11px;text-decoration:none;font-weight:700;'>View Order Details</a>"
    send_email(to_email, f"Order #{order_id} {action}!", base_template(content))

def email_order_cancelled(to_email, shopper_name, shop_name, order_id, total, auto=False):
    reason = "was not confirmed in time" if auto else "has been cancelled"
    content = f"<h2 style='color:#2D1A0E;'>Order cancelled</h2><p>Hi {shopper_name}, your order #{order_id} from <strong>{shop_name}</strong> {reason}. A full refund of <strong></strong> has been issued.</p><a href='https://from-our-place.chronos-ai.net/static/app.html' style='display:block;background:#4A6741;color:white;text-align:center;padding:13px;border-radius:11px;text-decoration:none;font-weight:700;'>Find Another Producer</a>"
    send_email(to_email, f"Order #{order_id} cancelled - full refund issued", base_template(content))
