import { NextRequest, NextResponse } from 'next/server';

// GET /api/products - Get all products from external API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const subCategoryId = searchParams.get('subCategoryId');
    const brand = searchParams.get('brand');
    const kviLabel = searchParams.get('kviLabel');

    // Fetch data from external API
    const externalApiBase = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';
    const response = await fetch(`${externalApiBase}/skus`);
    
    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }
    
    let products = await response.json();

    // Apply filters
    if (categoryId) {
      products = products.filter((p: any) => p.category_id === categoryId);
    }
    if (subCategoryId) {
      products = products.filter((p: any) => p.sub_category_id === subCategoryId);
    }
    if (brand) {
      products = products.filter((p: any) => 
        p.brand.toLowerCase().includes(brand.toLowerCase())
      );
    }
    if (kviLabel) {
      products = products.filter((p: any) => p.kvi_label === kviLabel);
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
