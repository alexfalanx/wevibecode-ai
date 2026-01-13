// app/api/templates/route.ts
// API endpoint to list available templates

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const templateIndexPath = path.join(process.cwd(), 'templates', 'template-index.json');

    // Read file and strip BOM if present
    let fileContent = fs.readFileSync(templateIndexPath, 'utf-8');

    // Remove BOM character if present (UTF-8 BOM is EF BB BF)
    if (fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.slice(1);
    }

    const templateIndex = JSON.parse(fileContent);

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
