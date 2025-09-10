import { NextRequest, NextResponse } from 'next/server';

// GET /api/external-price-mappings - Proxy to external API for price mappings
export async function GET(request: NextRequest) {
  try {
    const externalApiBase = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';
    const response = await fetch(`${externalApiBase}/price-mappings`);
    
    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }
    
    const priceMappings = await response.json();
    return NextResponse.json(priceMappings);
  } catch (error) {
    console.error('Error fetching price mappings from external API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price mappings' },
      { status: 500 }
    );
  }
}
