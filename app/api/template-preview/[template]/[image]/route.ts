// app/api/template-preview/[template]/[image]/route.ts
// Serve template preview images

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ template: string; image: string }> }
) {
  try {
    const { template, image } = await params;

    // Security: Only allow certain image extensions
    if (!/\.(jpg|jpeg|png|gif)$/i.test(image)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Construct path to template image
    const imagePath = path.join(
      process.cwd(),
      'templates',
      'html5up',
      template,
      'images',
      image
    );

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);

    // Determine content type based on extension
    const ext = path.extname(image).toLowerCase();
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
    }[ext] || 'application/octet-stream';

    // Return image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving template preview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
