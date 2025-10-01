import { NextRequest, NextResponse } from 'next/server';

// GET /api/external-products - Proxy to external API for products
export async function GET(request: NextRequest) {
  try {
    const externalApiBase = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';
    
    // Get query parameters from the request
    const { searchParams } = new URL(request.url);
    const categoryLevel1Id = searchParams.get('category_level1_id');
    const categoryLevel2Id = searchParams.get('category_level2_id');
    const categoryLevel3Id = searchParams.get('category_level3_id');
    const categoryLevel4Id = searchParams.get('category_level4_id');
    
    // Build the external API URL with query parameters
    let externalUrl = `${externalApiBase}/skus`;
    const params = new URLSearchParams();
    
    if (categoryLevel1Id) params.append('category_level1_id', categoryLevel1Id);
    if (categoryLevel2Id) params.append('category_level2_id', categoryLevel2Id);
    if (categoryLevel3Id) params.append('category_level3_id', categoryLevel3Id);
    if (categoryLevel4Id) params.append('category_level4_id', categoryLevel4Id);
    
    if (params.toString()) {
      externalUrl += `?${params.toString()}`;
    }
    
    const response = await fetch(externalUrl);
    
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
