import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3001/api/external';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { skuId, warehouseId, wastePrice, userId } = body;
    
    if (!skuId || !warehouseId || wastePrice === undefined || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: skuId, warehouseId, wastePrice, userId' },
        { status: 400 }
      );
    }
    
    // Validate waste price is a positive number
    if (typeof wastePrice !== 'number' || wastePrice <= 0) {
      return NextResponse.json(
        { error: 'Waste price must be a positive number' },
        { status: 400 }
      );
    }
    
    const externalUrl = `${EXTERNAL_API_BASE}/apply-waste-price`;
    
    const response = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any required authentication headers here
        // 'Authorization': `Bearer ${process.env.EXTERNAL_API_TOKEN}`,
      },
      body: JSON.stringify({
        sku_id: skuId,
        warehouse_id: warehouseId,
        waste_price: wastePrice,
        user_id: userId,
        applied_at: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      console.error(`External API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('External API error details:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to apply waste price to external system' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Waste price applied successfully',
      data,
    });
  } catch (error) {
    console.error('Error in apply-waste-price proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
