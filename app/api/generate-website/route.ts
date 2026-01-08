import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, industry, sections, style, primaryColor, secondaryColor, description } = body;

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('[API] Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log('[API] ========================================');
    console.log('[API] User authenticated:', userId);
    console.log('[API] User email:', user.email);

    // First, try to find user by ID
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('[API] User lookup by ID result:', { 
      found: !!userData, 
      error: userError?.message,
      credits: userData?.credits 
    });

    // If not found by ID, try by email
    let finalUserData = userData;
    if (userError || !userData) {
      console.log('[API] User not found by ID, trying email...');
      const { data: userByEmail, error: emailError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single();

      console.log('[API] User lookup by email result:', {
        found: !!userByEmail,
        error: emailError?.message,
        credits: userByEmail?.credits
      });

      if (userByEmail) {
        finalUserData = userByEmail;
      }
    }

    if (!finalUserData) {
      console.error('[API] User not found in database by ID or email');
      return NextResponse.json(
        { success: false, error: 'User not found in database. Please contact support.' },
        { status: 400 }
      );
    }

    console.log('[API] Final user data:', {
      id: finalUserData.id,
      email: finalUserData.email,
      credits: finalUserData.credits
    });

    if (finalUserData.credits < 1) {
      return NextResponse.json(
        { success: false, error: `Insufficient credits. You have ${finalUserData.credits} credits.` },
        { status: 400 }
      );
    }

    console.log('[API] Credit check passed. Proceeding with generation...');
    console.log('[API] ========================================');

    // Create the prompt for Claude
    const prompt = `You are an expert web developer. Create a complete, production-ready Next.js website for a business.

Business Details:
- Name: ${businessName}
- Industry: ${industry}
- Description: ${description || 'Not provided'}
- Style: ${style}
- Primary Color: ${primaryColor}
- Secondary Color: ${secondaryColor}
- Sections to include: ${sections.join(', ')}

Requirements:
1. Create a COMPLETE Next.js page component (page.tsx)
2. Use Tailwind CSS for styling (use the provided colors)
3. Make it mobile-responsive
4. Include the requested sections with realistic placeholder content
5. Make it professional and modern
6. Use ${style} design style throughout
7. Include proper SEO meta tags
8. Add smooth animations and transitions
9. Use lucide-react icons where appropriate
10. Make it production-ready

IMPORTANT: Return ONLY the complete React component code. Do NOT include any explanations, markdown, or code fences. Start directly with 'use client'; or the import statements.`;

    console.log('[API] Generating website for:', businessName);

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the generated code
    const generatedCode = message.content[0].type === 'text' ? message.content[0].text : '';

    console.log('[API] Website generated, length:', generatedCode.length);

    // Clean up the code (remove any markdown code fences if present)
    let cleanCode = generatedCode;
    if (cleanCode.includes('```')) {
      cleanCode = cleanCode.replace(/```tsx\n|```typescript\n|```jsx\n|```javascript\n|```\n/g, '');
      cleanCode = cleanCode.replace(/```$/g, '');
    }

    // Save to Supabase
    const { data: websiteData, error: websiteError } = await supabase
      .from('websites')
      .insert({
        user_id: finalUserData.id,
        name: businessName,
        industry,
        style,
        sections,
        colors: { primary: primaryColor, secondary: secondaryColor },
        code: cleanCode,
        status: 'draft',
      })
      .select()
      .single();

    if (websiteError) {
      console.error('[API] Error saving website:', websiteError);
      return NextResponse.json(
        { success: false, error: 'Failed to save website' },
        { status: 500 }
      );
    }

    // Deduct credit
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: finalUserData.credits - 1 })
      .eq('id', finalUserData.id);

    if (creditError) {
      console.error('[API] Error deducting credit:', creditError);
    } else {
      console.log('[API] Credit deducted successfully. New balance:', finalUserData.credits - 1);
    }

    console.log('[API] Website saved successfully, ID:', websiteData.id);

    return NextResponse.json({
      success: true,
      websiteId: websiteData.id,
      code: cleanCode,
    });
  } catch (error) {
    console.error('[API] Error generating website:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}