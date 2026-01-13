// app/api/templates/route.ts
// API endpoint to list available templates

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const templateIndexPath = path.join(process.cwd(), 'templates', 'template-index.json');
    const templateIndex = JSON.parse(fs.readFileSync(templateIndexPath, 'utf-8'));

    return NextResponse.json({
      success: true,
      templates: templateIndex.templates,
    });
  } catch (error) {
    console.error('Error loading templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load templates' },
      { status: 500 }
    );
  }
}
