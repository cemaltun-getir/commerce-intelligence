import { NextRequest, NextResponse } from 'next/server';

// GET /api/categories - Get all categories from external API
export async function GET(request: NextRequest) {
  try {
    // Fetch data from external API
    const externalApiBase = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';
    const response = await fetch(`${externalApiBase}/categories`);
    
    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }
    
    const categories = await response.json();

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
