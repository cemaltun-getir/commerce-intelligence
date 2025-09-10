import { NextRequest, NextResponse } from 'next/server';

// GET /api/external-products - Proxy to external API for products
export async function GET(request: NextRequest) {
  try {
    const externalApiBase = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';
    const response = await fetch(`${externalApiBase}/skus`);
    
    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }
    
    const products = await response.json();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products from external API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
