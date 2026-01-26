# Stripe Setup Guide for WeVibeCode.ai

## 1. Create Stripe Account

1. Go to https://stripe.com and sign up
2. Verify your email
3. Complete business verification (can skip for testing)

---

## 2. Get API Keys

### Test Mode (for development)
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)

### Live Mode (for production)
1. Go to https://dashboard.stripe.com/apikeys
2. Copy **Publishable key** (starts with `pk_live_`)
3. Copy **Secret key** (starts with `sk_live_`)

---

## 3. Add Keys to Environment Variables

Add to `.env.local`:

```env
# Stripe Keys (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

For production (Vercel):
- Add these as environment variables in Vercel dashboard
- Use `pk_live_` and `sk_live_` keys
- Set `NEXT_PUBLIC_BASE_URL` to your domain

---

## 4. Create Product in Stripe

### Option A: Via Dashboard (Recommended)
1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Fill in:
   - **Name**: Website Purchase
   - **Description**: One-time payment for AI-generated website with unlimited editing
   - **Pricing**: £10.00 GBP one-time payment
   - **Tax code**: (select appropriate for digital services)
4. Click "Save product"
5. Copy the **Price ID** (starts with `price_`)

### Option B: Via API (if you want to automate)
```bash
curl https://api.stripe.com/v1/products \
  -u sk_test_YOUR_KEY: \
  -d name="Website Purchase" \
  -d description="One-time payment for AI-generated website"

curl https://api.stripe.com/v1/prices \
  -u sk_test_YOUR_KEY: \
  -d product=prod_YOUR_PRODUCT_ID \
  -d unit_amount=1000 \
  -d currency=gbp \
  -d "recurring[interval]"=null
```

Add the Price ID to `.env.local`:
```env
STRIPE_WEBSITE_PRICE_ID=price_your_price_id_here
```

---

## 5. Set Up Webhooks

Webhooks notify your app when payments complete.

### For Local Development (using Stripe CLI)

1. Install Stripe CLI:
   ```bash
   # Windows (via Scoop)
   scoop install stripe

   # Mac
   brew install stripe/stripe-cli/stripe

   # Or download from: https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to localhost:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env.local`

### For Production (Vercel)

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** and add to Vercel environment variables

---

## 6. Test Payment Flow

### Test Cards (always use in test mode)

**Successful payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Payment declined:**
- Card: `4000 0000 0000 0002`

**Requires authentication (3D Secure):**
- Card: `4000 0025 0000 3155`

More test cards: https://stripe.com/docs/testing

---

## 7. Verify Setup

1. Start your app: `npm run dev`
2. Try to buy a website
3. Use test card: `4242 4242 4242 4242`
4. Check Stripe dashboard for payment
5. Check your database for payment record

---

## 8. Enable Payment Methods (Optional)

By default, Stripe only enables card payments. To add more:

1. Go to https://dashboard.stripe.com/settings/payment_methods
2. Enable desired payment methods:
   - ✅ Cards (enabled by default)
   - ✅ Apple Pay / Google Pay (recommended)
   - ✅ Link (Stripe's one-click checkout)
   - ✅ Bank transfers (SEPA for EU)
   - ✅ iDEAL (popular in Netherlands)
   - ⚠️ Klarna / Afterpay (buy now, pay later)

---

## 9. Set Up Taxes (Important for EU/UK)

Stripe Tax can automatically calculate and collect VAT:

1. Go to https://dashboard.stripe.com/settings/tax
2. Click "Enable Stripe Tax"
3. Enter your business details
4. Select tax registrations (UK, EU countries where you're registered)
5. Stripe will automatically:
   - Calculate VAT based on customer location
   - Collect appropriate tax
   - Generate tax reports

**Pricing with VAT:**
- Your price: £10.00 (inclusive of VAT if required)
- Stripe will calculate VAT portion automatically
- Show "Price includes VAT" to EU/UK customers

---

## 10. Go Live Checklist

Before switching to live mode:

- [ ] Business verification complete in Stripe
- [ ] Bank account connected for payouts
- [ ] Live API keys in production environment
- [ ] Webhook endpoint configured for production URL
- [ ] Stripe Tax enabled and configured
- [ ] Test multiple successful payments in test mode
- [ ] Test failed payment handling
- [ ] Test webhook delivery
- [ ] Terms of Service and Refund Policy published
- [ ] GDPR compliance checked

---

## 11. Monitoring & Support

### Stripe Dashboard
- View payments: https://dashboard.stripe.com/payments
- View customers: https://dashboard.stripe.com/customers
- View events/webhooks: https://dashboard.stripe.com/events
- Logs: https://dashboard.stripe.com/logs

### Useful Links
- Stripe Docs: https://stripe.com/docs
- API Reference: https://stripe.com/docs/api
- Support: https://support.stripe.com
- Status: https://status.stripe.com

---

## Cost Structure

**Stripe Fees (UK/EU):**
- Online card payments: 1.4% + £0.20 per transaction
- European cards: 2.5% + £0.20 per transaction
- No monthly fees
- No setup fees

**Example on £10 sale:**
- Customer pays: £10.00
- Stripe fee: £0.34 (1.4% + £0.20)
- You receive: £9.66

**Your actual profit:**
- Revenue: £9.66 (after Stripe)
- AI cost: ~£0.91-£4.55 (depending on generations)
- Profit: ~£5.11-£8.75 per sale

---

## Security Best Practices

1. ✅ Never log or store raw card details
2. ✅ Always use Stripe Checkout (PCI compliant)
3. ✅ Verify webhook signatures
4. ✅ Use HTTPS in production
5. ✅ Keep secret keys secret (never in frontend code)
6. ✅ Use environment variables
7. ✅ Monitor failed payments for fraud
8. ✅ Implement rate limiting on payment endpoints

---

## Next Steps

1. Run the database migration: `docs/DATABASE-MIGRATION-PAYMENTS.sql`
2. Add Stripe keys to `.env.local`
3. Create product and price in Stripe dashboard
4. Test payment flow with test cards
5. Set up webhooks
6. Deploy to production with live keys
