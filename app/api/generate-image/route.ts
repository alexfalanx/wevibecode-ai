// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, size = '1024x1024', style = 'natural' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('Generating image with DALL-E 3:', { prompt, size, style });

    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: size as '1024x1024' | '1024x1792' | '1792x1024',
      quality: 'standard',
      style: style as 'natural' | 'vivid',
    });

    const imageUrl = response.data[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('Image generated successfully:', imageUrl);

    // Optional: Upload to Supabase Storage for persistence
    // (DALL-E URLs expire after 1 hour)
    try {
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileName = `${session.user.id}/${Date.now()}.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-images')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Error uploading to Supabase Storage:', uploadError);
        // Continue with DALL-E URL even if upload fails
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('generated-images')
          .getPublicUrl(fileName);
        
        console.log('Image uploaded to Supabase Storage:', publicUrl);
        
        return NextResponse.json({
          success: true,
          imageUrl: publicUrl,
          temporaryUrl: imageUrl,
          prompt: prompt
        });
      }
    } catch (uploadError) {
      console.error('Error uploading image:', uploadError);
      // Fall back to temporary DALL-E URL
    }

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      expiresIn: '1 hour'
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}