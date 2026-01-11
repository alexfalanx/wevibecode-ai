// lib/analytics.ts
// Simple analytics tracking and error logging

import { createBrowserClient } from '@supabase/ssr';

/**
 * Track user events for analytics
 * @param eventName - Name of the event (e.g., 'website_generated', 'preview_viewed')
 * @param eventData - Additional data about the event
 */
export async function trackEvent(
  eventName: string,
  eventData?: Record<string, any>
) {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Only track for authenticated users
    if (!user) return;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${eventName}`, eventData);
    }

    // Insert into analytics table (create this table if needed)
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_name: eventName,
      event_data: eventData || {},
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Fail silently for analytics
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Log errors to database for monitoring
 * @param error - The error object or message
 * @param context - Additional context about where the error occurred
 */
export async function logError(
  error: Error | string,
  context?: Record<string, any>
) {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser();

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Log]', errorMessage, context);
    }

    // Insert into error logs table (create this table if needed)
    await supabase.from('error_logs').insert({
      user_id: user?.id || null,
      error_message: errorMessage,
      error_stack: errorStack,
      context: context || {},
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Fail silently for error logging
    console.error('Error logging failed:', err);
  }
}

/**
 * Track page views
 * @param pageName - Name of the page viewed
 */
export function trackPageView(pageName: string) {
  trackEvent('page_view', { page: pageName });
}

/**
 * Track generation events
 * @param websiteType - Type of website generated
 * @param creditsUsed - Number of credits used
 */
export function trackGeneration(websiteType: string, creditsUsed: number) {
  trackEvent('website_generated', {
    website_type: websiteType,
    credits_used: creditsUsed,
  });
}

/**
 * Track preview views
 * @param previewId - ID of the preview viewed
 */
export function trackPreviewView(previewId: string) {
  trackEvent('preview_viewed', { preview_id: previewId });
}

/**
 * Track user actions
 * @param action - The action performed
 * @param details - Additional details about the action
 */
export function trackAction(action: string, details?: Record<string, any>) {
  trackEvent('user_action', { action, ...details });
}
