// app/api/verify-domain/route.ts
// Verify custom domain DNS configuration

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { validateDomain, generateCnameValue } from '@/lib/publish';
import type { DomainVerificationResult } from '@/types/publish';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { domain } = body;

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => {
            return request.cookies.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll: () => {},
        },
      }
    );

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate domain format
    const domainValidation = validateDomain(domain);
    if (!domainValidation.valid) {
      return NextResponse.json<DomainVerificationResult>({
        verified: false,
        error: domainValidation.error,
      });
    }

    // Expected CNAME value
    const expectedCname = generateCnameValue();

    try {
      // Perform DNS lookup using DNS over HTTPS (DoH)
      // This is a simplified version - in production, use a DNS API like Cloudflare's
      const dohUrl = `https://cloudflare-dns.com/dns-query?name=${domain}&type=CNAME`;

      const dnsResponse = await fetch(dohUrl, {
        headers: {
          'Accept': 'application/dns-json',
        },
      });

      if (!dnsResponse.ok) {
        throw new Error('DNS lookup failed');
      }

      const dnsData = await dnsResponse.json();

      // Check for CNAME record
      const cnameRecords = dnsData.Answer?.filter((record: any) => record.type === 5); // Type 5 = CNAME

      if (!cnameRecords || cnameRecords.length === 0) {
        return NextResponse.json<DomainVerificationResult>({
          verified: false,
          expectedValue: expectedCname,
          error: 'No CNAME record found. Please add a CNAME record pointing to ' + expectedCname,
        });
      }

      // Get the CNAME value (remove trailing dot if present)
      const actualCname = cnameRecords[0].data.replace(/\.$/, '');

      // Verify CNAME matches expected value
      if (actualCname !== expectedCname) {
        return NextResponse.json<DomainVerificationResult>({
          verified: false,
          cnameRecord: actualCname,
          expectedValue: expectedCname,
          actualValue: actualCname,
          error: `CNAME record found but points to ${actualCname}. It should point to ${expectedCname}`,
        });
      }

      // CNAME verified successfully
      return NextResponse.json<DomainVerificationResult>({
        verified: true,
        cnameRecord: actualCname,
        expectedValue: expectedCname,
        actualValue: actualCname,
      });

    } catch (dnsError: any) {
      console.error('DNS verification error:', dnsError);

      // Fallback: Manual verification instructions
      return NextResponse.json<DomainVerificationResult>({
        verified: false,
        expectedValue: expectedCname,
        error: 'Unable to automatically verify DNS. Please ensure your CNAME record points to ' + expectedCname + ' and try again in a few minutes.',
      });
    }

  } catch (error: any) {
    console.error('Domain verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Alternative: Check domain availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => {
            return request.cookies.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll: () => {},
        },
      }
    );

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if domain is already in use
    const { data: existingDomain } = await supabase
      .from('previews')
      .select('id, title')
      .eq('custom_domain', domain)
      .maybeSingle();

    return NextResponse.json({
      available: !existingDomain,
      domain,
      message: existingDomain
        ? 'This domain is already in use'
        : 'This domain is available',
    });

  } catch (error: any) {
    console.error('Domain availability check error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
