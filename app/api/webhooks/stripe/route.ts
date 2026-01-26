// app/api/webhooks/stripe/route.ts
// Handles Stripe webhooks for payment events

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Create admin Supabase client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Need service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('Stripe webhook received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id);

  const previewId = session.metadata?.preview_id;
  const userId = session.metadata?.user_id;

  if (!previewId || !userId) {
    console.error('Missing metadata in checkout session:', session.metadata);
    return;
  }

  try {
    // Update payment record
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        stripe_payment_intent_id: session.payment_intent as string,
        payment_method: session.payment_method_types?.[0] || 'card',
        completed_at: new Date().toISOString(),
      })
      .eq('stripe_checkout_session_id', session.id);

    if (paymentError) {
      console.error('Error updating payment:', paymentError);
    }

    // Update preview to mark as paid
    const { error: previewError } = await supabaseAdmin
      .from('previews')
      .update({
        payment_status: 'paid',
        is_published: true, // Auto-publish on payment
      })
      .eq('id', previewId)
      .eq('user_id', userId);

    if (previewError) {
      console.error('Error updating preview:', previewError);
    } else {
      console.log(`✅ Website ${previewId} marked as paid and published`);
    }

  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
  }
}

/**
 * Handle successful payment intent (backup/redundancy)
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment_intent.succeeded:', paymentIntent.id);

  const previewId = paymentIntent.metadata?.preview_id;
  const userId = paymentIntent.metadata?.user_id;

  if (!previewId || !userId) {
    console.log('No metadata in payment intent, skipping');
    return;
  }

  try {
    // Update payment if exists
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (paymentError) {
      console.error('Error updating payment via PI:', paymentError);
    }

    // Ensure preview is marked as paid
    const { error: previewError } = await supabaseAdmin
      .from('previews')
      .update({
        payment_status: 'paid',
        is_published: true,
      })
      .eq('id', previewId)
      .eq('user_id', userId);

    if (previewError) {
      console.error('Error updating preview via PI:', previewError);
    }

  } catch (error) {
    console.error('Error in handlePaymentSucceeded:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment_intent.payment_failed:', paymentIntent.id);

  const previewId = paymentIntent.metadata?.preview_id;

  if (!previewId) {
    return;
  }

  try {
    // Update payment status to failed
    const { error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating failed payment:', error);
    }

  } catch (error) {
    console.error('Error in handlePaymentFailed:', error);
  }
}
