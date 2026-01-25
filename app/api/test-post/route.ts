import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'POST works!' });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ success: true, message: 'GET works!' });
}
