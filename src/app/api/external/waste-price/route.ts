import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { sku_id, warehouse_id, waste_price, user_id, applied_at } = body;
    
    if (!sku_id || !warehouse_id || waste_price === undefined || !user_id || !applied_at) {
      return NextResponse.json(
        { error: 'Missing required fields: sku_id, warehouse_id, waste_price, user_id, applied_at' },
        { status: 400 }
      );
    }
    
    // Validate waste_price is a non-negative number
    if (typeof waste_price !== 'number' || waste_price < 0) {
      return NextResponse.json(
        { error: 'waste_price must be a non-negative number' },
        { status: 400 }
      );
    }
    
    // Validate applied_at is a valid ISO 8601 timestamp
    const appliedAtDate = new Date(applied_at);
    if (isNaN(appliedAtDate.getTime())) {
      return NextResponse.json(
        { error: 'applied_at must be a valid ISO 8601 timestamp' },
        { status: 400 }
      );
    }
    
    const externalUrl = `${EXTERNAL_API_BASE}/waste-price`;
    
    const response = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any required authentication headers here
        // 'Authorization': `Bearer ${process.env.EXTERNAL_API_TOKEN}`,
      },
      body: JSON.stringify({
        sku_id,
        warehouse_id,
        waste_price,
        user_id,
        applied_at,
      }),
    });
    
    if (!response.ok) {
      console.error(`External API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('External API error details:', errorText);
      
      // Handle specific error cases
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'SKU or warehouse not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update waste price in external system' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      message: 'Waste price updated successfully',
      sku_id,
      warehouse_id,
      waste_price,
      applied_at,
      updated_at: new Date().toISOString(),
      external_response: data,
    });
  } catch (error) {
    console.error('Error in external waste-price update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
