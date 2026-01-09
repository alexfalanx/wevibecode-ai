// app/api/generate-website/route.ts
// SUPER ENHANCED VERSION - Names, Icons, Vibrant Colors!
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, websiteType, colorScheme } = body;

    if (!prompt || !websiteType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {},
          remove(name: string, options: any) {},
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (profile.credits_remaining < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // STEP 1: ENHANCE THE PROMPT WITH NAME, COLORS, ICONS
    console.log('Step 1: Enhancing prompt with business name, icons, and colors...');
    const enhancedPrompt = await enhancePrompt(prompt, websiteType, colorScheme);
    console.log('Enhanced prompt created');

    // STEP 2: GENERATE WEBSITE
    console.log('Step 2: Generating stunning website...');
    const systemPrompt = buildSystemPrompt(websiteType, colorScheme);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: enhancedPrompt },
      ],
      temperature: 0.85, // More creativity!
      max_tokens: 4000,
    });

    const generatedCode = completion.choices[0].message.content;

    if (!generatedCode) {
      return NextResponse.json(
        { error: 'Failed to generate website' },
        { status: 500 }
      );
    }

    // Parse the generated code
    const { html, css, js } = parseGeneratedCode(generatedCode);

    // Create preview in database
    const { data: preview, error: previewError } = await supabase
      .from('previews')
      .insert({
        user_id: user.id,
        title: prompt.substring(0, 100),
        html_content: html,
        css_content: css,
        js_content: js,
        preview_type: 'website',
        generation_prompt: enhancedPrompt,
        generation_type: websiteType,
        credits_used: 1,
      })
      .select()
      .single();

    if (previewError || !preview) {
      console.error('Error creating preview:', previewError);
      return NextResponse.json(
        { error: 'Failed to save generated website' },
        { status: 500 }
      );
    }

    // Deduct credit
    await supabase
      .from('profiles')
      .update({ credits_remaining: profile.credits_remaining - 1 })
      .eq('id', user.id);

    // Log credit usage
    await supabase.from('credits_log').insert({
      user_id: user.id,
      credits_used: 1,
      action: 'generate_website',
      details: { 
        preview_id: preview.id, 
        original_prompt: prompt.substring(0, 100)
      },
    });

    console.log('Website generated successfully!');

    return NextResponse.json({
      success: true,
      previewId: preview.id,
      creditsRemaining: profile.credits_remaining - 1,
    });

  } catch (error: any) {
    console.error('Website generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * STEP 1: Enhance prompt with business name, icons, and vibrant colors
 */
async function enhancePrompt(
  userPrompt: string, 
  websiteType: string, 
  colorScheme?: string
): Promise<string> {
  
  const enhancementPrompt = `You are a creative director and branding expert. Take the user's basic idea and create a DETAILED, EXCITING specification with:

1. **BUSINESS NAME** - Create a catchy, memorable name (unless already provided)
2. **VISUAL ICONS** - Specify emoji icons for each section/feature (🚀 💡 ⚡ 🎯 💎 etc)
3. **VIBRANT COLORS** - Choose bold, exciting color combinations with specific hex codes
4. **RICH CONTENT** - Expand with specific sections, headlines, and copy
5. **PERSONALITY** - Give it character and energy!

COLOR PALETTE GUIDELINES:
- Use VIBRANT, BOLD colors (no dull grays!)
- Specify 2-3 main brand colors with hex codes
- Include gradient combinations
- Examples:
  * Electric: #6366F1 (indigo) → #EC4899 (pink) → #8B5CF6 (purple)
  * Energy: #F59E0B (amber) → #EF4444 (red) → #F97316 (orange)  
  * Fresh: #10B981 (green) → #3B82F6 (blue) → #06B6D4 (cyan)
  * Bold: #8B5CF6 (purple) → #EC4899 (pink) → #F43F5E (rose)
  * Modern: #0EA5E9 (sky) → #6366F1 (indigo) → #A855F7 (purple)

ICON USAGE:
Use emojis liberally for visual interest:
- Features: 🚀 ⚡ 💎 🎯 ✨ 🔥 💡 🎨 📱 🌟 ⭐ 🏆
- Benefits: ✅ 💰 ⏱️ 📈 🎉 💪 🌈 🎁 🔔 🎊
- Social: 👥 💬 🤝 ❤️ 👍 🌍 📣 🎤 📸 🎬
- Business: 📊 💼 🏢 📞 ✉️ 🌐 📍 🕐 📅 💳

STRUCTURE:
For each section, specify:
- Section name with icon
- Headline (bold, exciting)
- Specific content details
- Visual styling (colors, gradients, effects)
- Call-to-action text

Make it 5x more detailed than the user's input!
Make it EXCITING and VISUAL!

${colorScheme ? `Preferred color theme: ${colorScheme} - use this as inspiration but make it VIBRANT!` : ''}

USER'S IDEA:
"${userPrompt}"

Create the enhanced specification now:`;

  const typeContext = {
    landing: 'Landing page - focus on conversion, social proof, and clear CTAs',
    portfolio: 'Portfolio - showcase projects with style and personality',
    business: 'Business site - professional but modern and exciting',
    restaurant: 'Restaurant - make it mouthwatering and inviting',
    blog: 'Blog - clean, readable, engaging content focus',
    ecommerce: 'E-commerce - product-focused with trust and conversion',
  };

  const enhancement = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: `You are a creative branding expert. ${typeContext[websiteType as keyof typeof typeContext]}` },
      { role: 'user', content: enhancementPrompt },
    ],
    temperature: 0.8,
    max_tokens: 1500,
  });

  return enhancement.choices[0].message.content || userPrompt;
}

function buildSystemPrompt(websiteType: string, colorScheme?: string): string {
  return `You are an ELITE web developer creating STUNNING, VIBRANT, MODERN websites.

CRITICAL: Output ONLY code in these markdown blocks:

\`\`\`html
<!-- HTML here -->
\`\`\`

\`\`\`css  
/* CSS here */
\`\`\`

\`\`\`javascript
// JS here (if needed)
\`\`\`

🎨 DESIGN REQUIREMENTS:

1. **VIBRANT COLORS** - Use the EXACT color palette specified in the prompt
   - Multiple gradient backgrounds (2-3 colors each)
   - Bold, eye-catching color combinations
   - Different gradients for different sections
   - NO boring grays or whites only!

2. **EMOJI ICONS** - Use the emoji icons specified in the prompt
   - Large emojis (2-3rem) for visual impact
   - Icons in feature cards, section headers
   - Emojis add personality and visual interest

3. **BOLD TYPOGRAPHY**
   - Headlines: 48-72px, bold (700-800)
   - Subheadlines: 24-32px
   - Body: 18px, line-height 1.7
   - Use system fonts: -apple-system, BlinkMacSystemFont, 'Segoe UI'

4. **RICH GRADIENTS**
   - Hero: Dynamic gradient background
   - Buttons: Gradient fills with hover effects
   - Section backgrounds: Alternating gradients
   - Cards: Gradient borders or accents
   - Example: background: linear-gradient(135deg, #6366F1 0%, #EC4899 100%);

5. **VISUAL EFFECTS**
   - Box shadows for depth: box-shadow: 0 20px 60px rgba(0,0,0,0.3);
   - Border radius for modern feel: 16-24px
   - Hover transforms: transform: translateY(-10px);
   - Smooth transitions: transition: all 0.3s ease;
   - Glassmorphism: backdrop-filter: blur(10px); background: rgba(255,255,255,0.1);

6. **LAYOUT**
   - Hero: Full viewport height with gradient
   - Sections: Generous padding (80-120px vertical)
   - Max width: 1200px, centered
   - Grid layouts: gap of 2-3rem
   - Cards: Elevated with shadows

7. **ANIMATIONS**
   - Fade-in on scroll (use @keyframes)
   - Button hover: scale + shadow increase
   - Card hover: lift effect
   - Smooth scroll: scroll-behavior: smooth;

8. **INTERACTIVE ELEMENTS**
   - Buttons: Large (16-20px padding), gradient fill, white text, rounded
   - Hover: Brighten gradient, scale(1.05), increase shadow
   - Links: Color transition on hover
   - Forms: Modern inputs with focus effects

🎯 CONTENT STRUCTURE:

Include ALL sections from the prompt with:
- Business name prominently displayed
- Specified emoji icons in each section
- Exact color palette used throughout
- Multiple CTAs with exciting copy
- Rich, detailed content
- Visual variety (not repetitive)

💎 MAKE IT PREMIUM:

- Like a $15,000 professionally designed website
- Bold, confident, modern aesthetics
- Every element polished and refined
- Impressive on first glance
- Makes people say "WOW!"

NO EXTERNAL DEPENDENCIES - Use only HTML/CSS/JS (emojis are fine!)`;
}

function parseGeneratedCode(generatedCode: string): { html: string; css: string; js: string } {
  let html = '';
  let css = '';
  let js = '';

  const htmlMatch = generatedCode.match(/```html\n([\s\S]*?)```/);
  if (htmlMatch) html = htmlMatch[1].trim();

  const cssMatch = generatedCode.match(/```css\n([\s\S]*?)```/);
  if (cssMatch) css = cssMatch[1].trim();

  const jsMatch = generatedCode.match(/```javascript\n([\s\S]*?)```/);
  if (jsMatch) js = jsMatch[1].trim();

  if (!html && generatedCode.includes('<html')) {
    html = generatedCode;
  }

  return { html, css, js };
}
