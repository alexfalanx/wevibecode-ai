// app/api/checkout/route.ts
// Creates Stripe Checkout session for website purchase

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { previewId } = await request.json();

    if (!previewId) {
      return NextResponse.json(
        { error: 'Preview ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify preview belongs to user
    const { data: preview, error: previewError } = await supabase
      .from('previews')
      .select('*')
      .eq('id', previewId)
      .eq('user_id', user.id)
      .single();

    if (previewError || !preview) {
      return NextResponse.json(
        { error: 'Preview not found or access denied' },
        { status: 404 }
      );
    }

    // Check if already paid
    if (preview.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'This website has already been purchased' },
        { status: 400 }
      );
    }

    // Check if payment already exists and is pending
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('preview_id', previewId)
      .eq('status', 'pending')
      .single();

    if (existingPayment && existingPayment.stripe_checkout_session_id) {
      // Return existing checkout session
      const session = await stripe.checkout.sessions.retrieve(
        existingPayment.stripe_checkout_session_id
      );

      if (session.status === 'open') {
        return NextResponse.json({ sessionId: session.id, url: session.url });
      }
    }

    // Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      payment_method_types: ['card', 'paypal'], // Enable card and PayPal payments
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'AI Website',
              description: `Website: ${preview.title}`,
              images: ['https://wevibecode.ai/og-default.jpg'], // TODO: Replace with actual preview image
            },
            unit_amount: 1999, // £19.99 in pence
          },
          quantity: 1,
        },
      ],
      metadata: {
        preview_id: previewId,
        user_id: user.id,
        preview_title: preview.title,
      },
      success_url: `${baseUrl}/dashboard/preview/${previewId}?payment=success`,
      cancel_url: `${baseUrl}/dashboard/preview/${previewId}?payment=cancelled`,
      allow_promotion_codes: true, // Enable discount codes
      billing_address_collection: 'auto',
      payment_intent_data: {
        metadata: {
          preview_id: previewId,
          user_id: user.id,
        },
      },
    });

    // Create payment record in database
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        preview_id: previewId,
        amount_gbp: 19.99,
        currency: 'GBP',
        status: 'pending',
        stripe_checkout_session_id: session.id,
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Don't fail - payment can still complete via webhook
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
