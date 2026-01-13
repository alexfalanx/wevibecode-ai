// app/api/validate-edit/route.ts
// AI validation for user edits to prevent breaking generated code

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import OpenAI from 'openai';
import { validateHtml } from '@/lib/publish';
import type { ValidationResult } from '@/types/publish';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { previewId, editedHtml, editType, editData } = body;

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

    // Verify preview ownership
    const { data: preview, error: previewError } = await supabase
      .from('previews')
      .select('id, user_id')
      .eq('id', previewId)
      .single();

    if (previewError || !preview || preview.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Preview not found or access denied' },
        { status: 404 }
      );
    }

    // Validate HTML structure
    const htmlValidation = validateHtml(editedHtml);

    if (!htmlValidation.valid) {
      return NextResponse.json<ValidationResult>({
        isValid: false,
        errors: htmlValidation.errors,
        warnings: ['HTML structure validation failed'],
      });
    }

    // Use AI to check for potential issues (GPT-4o-mini for speed)
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a code validator. Check if the edited HTML will break the website.
Focus on:
1. Syntax errors
2. Broken tags
3. Missing critical elements
4. CSS/JS conflicts

Respond in JSON format:
{
  "isValid": boolean,
  "errors": string[] (critical issues that will break the site),
  "warnings": string[] (minor issues that might affect appearance),
  "suggestions": string[] (improvements)
}`,
          },
          {
            role: 'user',
            content: `Edit type: ${editType}
Edit data: ${JSON.stringify(editData)}

Edited HTML (first 2000 chars):
${editedHtml.substring(0, 2000)}

Is this edit safe?`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No AI response received');
      }

      // Parse AI response
      const validationResult: ValidationResult = JSON.parse(aiResponse);

      return NextResponse.json<ValidationResult>(validationResult);

    } catch (aiError: any) {
      console.error('AI validation error:', aiError);

      // Fallback to basic validation if AI fails
      return NextResponse.json<ValidationResult>({
        isValid: true,
        warnings: ['AI validation unavailable, basic checks passed'],
      });
    }

  } catch (error: any) {
    console.error('Edit validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
