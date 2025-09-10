import { NextRequest, NextResponse } from 'next/server';

// GET /api/external-competitors - Proxy to external API for competitors
export async function GET(request: NextRequest) {
  try {
    const externalApiBase = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';
    const response = await fetch(`${externalApiBase}/vendors`);
    
    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }
    
    const competitors = await response.json();
    return NextResponse.json(competitors);
  } catch (error) {
    console.error('Error fetching competitors from external API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitors' },
      { status: 500 }
    );
  }
}
