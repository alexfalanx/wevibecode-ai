# Quick Start: Payment System Setup

## 🚀 Get Your Payment System Running in 30 Minutes

Follow these steps in order. Each step takes 5-10 minutes.

---

## Step 1: Install Dependencies ✅ (DONE)

The `stripe` package is already installed. Skip to Step 2.

---

## Step 2: Set Up Stripe (10 minutes)

### A. Create Stripe Account
1. Go to https://stripe.com
2. Click "Sign up"
3. Use your business email
4. Verify email
5. Toggle to **Test Mode** (top right corner)

### B. Get API Keys
1. Go to: https://dashboard.stripe.com/test/apikeys
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (click "Reveal" then copy - starts with `sk_test_`)

### C. Copy Environment File
```bash
cp .env.local.example .env.local
```

### D. Add Keys to .env.local
Open `.env.local` and fill in:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_paste_your_key_here
STRIPE_SECRET_KEY=sk_test_paste_your_key_here
```

---

## Step 3: Get Supabase Service Role Key (5 minutes)

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Settings** > **API**
4. Scroll to "Project API keys"
5. Copy the **service_role** key (it's a SECRET - don't share!)
6. Add to `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...paste_your_service_role_key_here
```

---

## Step 4: Run Database Migration (5 minutes)

### A. Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Click "+ New query"

### B. Run Migration
1. Open the file: `docs/DATABASE-MIGRATION-PAYMENTS.sql`
2. Copy ALL the contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click "Run" (or F5)
5. Should see: "Success. No rows returned"

### C. Verify Tables Created
1. Go to: **Table Editor** (left sidebar)
2. Check that you see:
   - `payments` table (new!)
   - `previews` table with `payment_status` column (new!)

---

## Step 5: Set Up Local Webhooks (10 minutes)

### A. Install Stripe CLI

#### Windows:
```bash
# Using Scoop (if you have it)
scoop install stripe

# OR download directly from:
# https://github.com/stripe/stripe-cli/releases/latest
# Download stripe_X.XX.X_windows_x86_64.zip
# Extract and add to PATH
```

#### Mac:
```bash
brew install stripe/stripe-cli/stripe
```

### B. Login to Stripe CLI
```bash
stripe login
```
- This will open your browser
- Confirm the pairing

### C. Start Webhook Listener
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### D. Copy Webhook Secret
The command above will output something like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

Copy that `whsec_xxxxx` value and add to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_paste_your_webhook_secret_here
```

### E. Keep This Terminal Open!
⚠️ The webhook listener must stay running while you test payments.

---

## Step 6: Test Payment Flow (10 minutes)

### A. Start Your App
In a NEW terminal window:
```bash
npm run dev
```

### B. Make Sure Webhooks Are Running
In another terminal (from Step 5C):
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

You should see: ` Ready! [...]`

### C. Test the Flow
1. Open: http://localhost:3000/pricing
2. Click "Get Started"
3. Generate a website
4. Look for "Pay to Publish" button (you'll need to add this UI - see TODO below)
5. Use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34` (any future date)
   - CVC: `123` (any 3 digits)
   - ZIP: `12345` (any 5 digits)

### D. Verify Success
Check 3 places:

1. **Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/test/payments
   - Should see £19.99 payment

2. **Supabase `payments` Table**
   - Go to: Table Editor > payments
   - Should see new row with `status = 'completed'`

3. **Supabase `previews` Table**
   - Go to: Table Editor > previews
   - Your preview should have `payment_status = 'paid'`

### E. Check Webhook Logs
In the terminal running `stripe listen`, you should see:
```
✔ Received event checkout.session.completed [evt_xxx]
✔ Forwarded to http://localhost:3000/api/webhooks/stripe → 200 OK
```

---

## ✅ You're Done with Backend Setup!

If all checks passed, your payment system is working! 🎉

---

## 🚧 What's Still TODO (UI Work)

The backend is complete, but these UI components need to be added:

### 1. Add "Pay to Publish" Button
**File:** `app/dashboard/preview/[id]/page.tsx`

**What to add:**
- Check if `preview.payment_status === 'unpaid'`
- Show "Pay £19.99 to Publish" button
- Button calls `/api/checkout` with `previewId`
- Redirect to Stripe Checkout URL

**Example code:**
```tsx
const handlePayment = async () => {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ previewId: preview.id }),
  });
  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe
};

// In JSX:
{preview.payment_status === 'unpaid' && (
  <button onClick={handlePayment}>
    Pay £19.99 to Publish
  </button>
)}
```

### 2. Update Dashboard
**File:** `app/dashboard/page.tsx`

**What to add:**
- Show payment status badges on website cards
- Distinguish paid vs unpaid sites visually

### 3. Update Generation Flow
**File:** `app/dashboard/generate/page.tsx`

**What to change:**
- After website is generated, set `payment_status = 'free_preview'`
- Show message: "Preview generated! Pay £19.99 to publish."

### 4. Update Editor
**File:** `components/SiteEditor.tsx`

**What to add:**
- Check `payment_status` before allowing edits
- Show "Pay to unlock full editing" for unpaid sites
- Or allow limited edits for free previews

---

## 🎯 Quick Reference

### Test Cards
- ✅ Success: `4242 4242 4242 4242`
- ❌ Decline: `4000 0000 0000 0002`
- 🔐 3D Secure: `4000 0025 0000 3155`

### Important URLs
- Stripe Dashboard: https://dashboard.stripe.com/test/payments
- Supabase Dashboard: https://supabase.com/dashboard
- API Keys (Stripe): https://dashboard.stripe.com/test/apikeys
- Webhooks (Stripe): https://dashboard.stripe.com/test/webhooks

### Environment Variables Checklist
- [ ] `ANTHROPIC_API_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ⚠️ New!
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ⚠️ New!
- [ ] `STRIPE_SECRET_KEY` ⚠️ New!
- [ ] `STRIPE_WEBHOOK_SECRET` ⚠️ New!
- [ ] `PEXELS_API_KEY`
- [ ] `NEXT_PUBLIC_BASE_URL`

---

## 🆘 Troubleshooting

### "Can't find module 'stripe'"
```bash
npm install stripe
```

### "Webhook signature verification failed"
- Make sure `stripe listen` is running
- Copy the EXACT `whsec_` secret to `.env.local`
- Restart your dev server: `npm run dev`

### "Missing SUPABASE_SERVICE_ROLE_KEY"
- Get from: Supabase Dashboard > Settings > API > service_role key
- Add to `.env.local`
- Restart dev server

### Payment succeeds but preview not updated
- Check `stripe listen` terminal for errors
- Check browser console for errors
- Check Supabase logs: Dashboard > Logs
- Verify RLS policies in database

### Test card gets declined
- Make sure Stripe is in TEST mode (toggle top right)
- Use exact card: `4242 4242 4242 4242`
- Any future expiry date works
- Any 3-digit CVC works

---

## 📞 Need More Help?

1. Check `docs/STRIPE-SETUP-GUIDE.md` for detailed Stripe setup
2. Check `docs/PAYMENT-IMPLEMENTATION-COMPLETE.md` for complete overview
3. Check Stripe docs: https://stripe.com/docs
4. Check Supabase docs: https://supabase.com/docs

---

**Ready to go? Start with Step 2!** ⬆️
