import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    
    // Forward any query parameters to external API
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    
    const externalUrl = `${EXTERNAL_API_BASE}/warehouse-inventory${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log(`Fetching warehouse product expiry data from: ${externalUrl}`);
    
    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any required authentication headers here
        // 'Authorization': `Bearer ${process.env.EXTERNAL_API_TOKEN}`,
      },
    });
    
    console.log(`Response status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`External API error: ${response.status} ${response.statusText}`, responseText.substring(0, 200));
      return NextResponse.json(
        { error: 'Failed to fetch warehouse product expiry data' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in warehouse-product-expiry proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
