import { NextRequest, NextResponse } from 'next/server';
import { transformExternalWarehouse } from '@/utils/externalApi';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${EXTERNAL_API_BASE}/locations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const warehouses = await response.json();
    
    // Transform the external API response to match our internal format
    const transformedWarehouses = warehouses.map(transformExternalWarehouse);

    return NextResponse.json(transformedWarehouses);
  } catch (error) {
    console.error('Error fetching external warehouses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses from external API' },
      { status: 500 }
    );
  }
}
