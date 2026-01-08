// lib/services/ai-generator.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Vibe theme configurations
const VIBE_THEMES = {
  cyberpunk: {
    colors: {
      primary: '#00f0ff',
      secondary: '#ff00ff',
      background: '#0a0a0f',
      text: '#ffffff',
    },
    fonts: {
      heading: 'Orbitron',
      body: 'Rajdhani',
    },
    effects: ['neon-glow', 'glitch', 'scanlines'],
  },
  cozy: {
    colors: {
      primary: '#ffc9c9',
      secondary: '#c9e4ff',
      background: '#fef9f3',
      text: '#4a4a4a',
    },
    fonts: {
      heading: 'Quicksand',
      body: 'Nunito',
    },
    effects: ['soft-shadow', 'rounded-corners'],
  },
  brutalist: {
    colors: {
      primary: '#000000',
      secondary: '#ffffff',
      background: '#ffffff',
      text: '#000000',
    },
    fonts: {
      heading: 'Space Grotesk',
      body: 'Inter',
    },
    effects: ['hard-edges', 'bold-borders'],
  },
  retro: {
    colors: {
      primary: '#ff006e',
      secondary: '#ffbe0b',
      background: '#1a1a2e',
      text: '#ffffff',
    },
    fonts: {
      heading: 'Righteous',
      body: 'Poppins',
    },
    effects: ['gradient-bg', 'retro-shadows'],
  },
  corporate: {
    colors: {
      primary: '#0066cc',
      secondary: '#666666',
      background: '#f8f9fa',
      text: '#212529',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    effects: ['clean-shadow', 'subtle-gradient'],
  },
} as const;

type VibeTheme = keyof typeof VIBE_THEMES;

interface GenerateAppParams {
  prompt: string;
  vibeTheme: VibeTheme;
  userId: string;
}

interface GeneratedApp {
  files: Record<string, string>; // filepath -> content
  previewUrl?: string;
  assets: {
    images: string[];
    fonts: string[];
  };
}

// System prompt for Claude
const SYSTEM_PROMPT = `You are an expert full-stack developer and designer specializing in creating beautiful, production-ready web applications. You generate complete Next.js applications with TypeScript and Tailwind CSS.

When given a user prompt and a vibe theme, you:
1. Analyze the requirements and break them into components
2. Generate a complete file structure (pages, components, utils)
3. Apply the vibe theme consistently across all design elements
4. Include proper routing, state management, and error handling
5. Use modern React patterns (hooks, server components when appropriate)
6. Ensure responsive design and accessibility
7. Generate placeholder content that matches the theme

Output format: JSON with file paths as keys and code content as values.
Example structure:
{
  "app/page.tsx": "...",
  "app/layout.tsx": "...",
  "components/Hero.tsx": "...",
  "styles/globals.css": "...",
  "lib/utils.ts": "...",
  "public/assets/.gitkeep": ""
}

IMPORTANT:
- Use TypeScript with proper types
- Include all necessary imports
- Apply Tailwind classes that match the vibe theme
- Generate semantic, accessible HTML
- Include loading states and error boundaries
- Use 'use client' directive only when needed (interactivity)
- Keep components modular and reusable`;

export async function generateApp({
  prompt,
  vibeTheme,
  userId,
}: GenerateAppParams): Promise<GeneratedApp> {
  const theme = VIBE_THEMES[vibeTheme];
  
  // Construct the user prompt with theme details
  const enhancedPrompt = `
Create a Next.js application based on this request: "${prompt}"

Apply the following design theme:
- Colors: Primary ${theme.colors.primary}, Secondary ${theme.colors.secondary}, Background ${theme.colors.background}
- Fonts: Heading "${theme.fonts.heading}", Body "${theme.fonts.body}"
- Effects: ${theme.effects.join(', ')}

Requirements:
- Use Next.js 14 with App Router
- TypeScript for all files
- Tailwind CSS for styling (configure with theme colors)
- Responsive design (mobile-first)
- Include a basic layout with navigation
- Add at least 2-3 pages based on the prompt
- Include components for common elements (Header, Footer, Hero, etc.)
- Use Lucide React for icons
- Add basic animations with Framer Motion
- Include a tailwind.config.ts with the theme colors

Return ONLY valid JSON (no markdown code blocks) with file paths and content.`;

  try {
    // Call Claude API with streaming
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000, // Enough for a full app
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: enhancedPrompt,
        },
      ],
    });

    // Extract the generated code
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON response
    let files: Record<string, string>;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      files = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content.text);
      throw new Error('Failed to parse generated code');
    }

    // Add package.json and other config files
    files['package.json'] = JSON.stringify({
      name: 'generated-app',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
      dependencies: {
        next: '^14.1.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'lucide-react': '^0.309.0',
        'framer-motion': '^11.0.0',
      },
      devDependencies: {
        '@types/node': '^20',
        '@types/react': '^18',
        '@types/react-dom': '^18',
        autoprefixer: '^10.0.1',
        postcss: '^8',
        tailwindcss: '^3.3.0',
        typescript: '^5',
      },
    }, null, 2);

    files['next.config.js'] = `/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;`;

    files['tsconfig.json'] = JSON.stringify({
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: { '@/*': ['./*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    }, null, 2);

    files['.gitignore'] = `node_modules
.next
.env.local
dist
.DS_Store`;

    // Generate font links for Google Fonts
    const fontLinks = [theme.fonts.heading, theme.fonts.body]
      .map(font => `https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@400;600;700&display=swap`)
      .join('\n');

    return {
      files,
      assets: {
        images: [], // TODO: Generate with DALL-E/SD in Phase 2
        fonts: [fontLinks],
      },
    };
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error('Failed to generate app');
  }
}

// Estimate token usage for cost tracking
export function estimateTokens(prompt: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil((prompt.length + 8000) / 4); // +8000 for system prompt and response
}

// Calculate cost (Claude Sonnet pricing)
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_PRICE = 3 / 1_000_000; // $3 per 1M tokens
  const OUTPUT_PRICE = 15 / 1_000_000; // $15 per 1M tokens
  return inputTokens * INPUT_PRICE + outputTokens * OUTPUT_PRICE;
}

