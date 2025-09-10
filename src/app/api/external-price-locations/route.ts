import { NextRequest, NextResponse } from 'next/server';

// GET /api/external-price-locations - Get unique price locations from external API price mappings
export async function GET(request: NextRequest) {
  try {
    const externalApiBase = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';
    const response = await fetch(`${externalApiBase}/price-mappings`);
    
    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }
    
    const priceMappings = await response.json();
    
    // Extract unique locations from price mappings
    const uniqueLocations = priceMappings.reduce((acc: any[], mapping: any) => {
      const existingLocation = acc.find(loc => loc.id === mapping.location_id);
      if (!existingLocation) {
        acc.push({
          id: mapping.location_id,
          name: mapping.location_name
        });
      }
      return acc;
    }, []);
    
    return NextResponse.json(uniqueLocations);
  } catch (error) {
    console.error('Error fetching price locations from external API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price locations' },
      { status: 500 }
    );
  }
}
