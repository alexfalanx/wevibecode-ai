import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateApp, estimateTokens } from '@/lib/services/ai-generator';
import { z } from 'zod';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Request validation schema
const GenerateRequestSchema = z.object({
  prompt: z.string().min(10).max(1000),
  vibeTheme: z.enum(['cyberpunk', 'cozy', 'brutalist', 'retro', 'corporate']),
  projectId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = GenerateRequestSchema.parse(body);

    // Check user's credit balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits_remaining, subscription_tier')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Deduct credits (1 credit per generation for free tier)
    const creditsRequired = profile.subscription_tier === 'pro' ? 0 : 1;
    
    if (profile.subscription_tier !== 'pro' && profile.credits_remaining < creditsRequired) {
      return NextResponse.json(
        { error: 'Insufficient credits', creditsRequired, creditsRemaining: profile.credits_remaining },
        { status: 402 }
      );
    }

    // Create or update project record
    let projectId = validatedData.projectId;
    
    if (!projectId) {
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: validatedData.prompt.slice(0, 100),
          description: validatedData.prompt,
          prompt: validatedData.prompt,
          vibe_theme: validatedData.vibeTheme,
          status: 'generating',
        })
        .select('id')
        .single();

      if (createError || !newProject) {
        return NextResponse.json(
          { error: 'Failed to create project' },
          { status: 500 }
        );
      }
      
      projectId = newProject.id;
    } else {
      // Update existing project status
      await supabase
        .from('projects')
        .update({ status: 'generating' })
        .eq('id', projectId)
        .eq('user_id', user.id);
    }

    // Generate the app with AI
    const generatedApp = await generateApp({
      prompt: validatedData.prompt,
      vibeTheme: validatedData.vibeTheme,
      userId: user.id,
    });

    // Update project with generated code
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        code_bundle: generatedApp.files,
        status: 'ready',
        preview_url: `${process.env.NEXT_PUBLIC_APP_URL}/preview/${projectId}`,
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Failed to update project:', updateError);
      return NextResponse.json(
        { error: 'Failed to save generated code' },
        { status: 500 }
      );
    }

    // Deduct credits if not pro
    if (profile.subscription_tier !== 'pro') {
      const { data: deductResult } = await supabase.rpc('deduct_credits', {
        p_user_id: user.id,
        p_project_id: projectId,
        p_amount: creditsRequired,
      });

      if (!deductResult) {
        console.error('Failed to deduct credits');
      }
    }

    // Return success with project details
    return NextResponse.json({
      success: true,
      projectId,
      previewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/preview/${projectId}`,
      creditsRemaining: profile.subscription_tier === 'pro' 
        ? 'unlimited' 
        : profile.credits_remaining - creditsRequired,
      estimatedTokens: estimateTokens(validatedData.prompt),
    });

  } catch (error) {
    console.error('Generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
}