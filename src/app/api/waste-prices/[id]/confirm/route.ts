import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { WastePrice } from '@/models/WastePrice';
import { wastePriceApi } from '@/utils/wastePriceApi';

// POST /api/waste-prices/[id]/confirm - Confirm waste price
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { confirmedPrice, userId, notes } = body;
    const { id } = await params;
    
    if (!confirmedPrice || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: confirmedPrice, userId' },
        { status: 400 }
      );
    }
    
    const wastePrice = await WastePrice.findById(id);
    
    if (!wastePrice) {
      return NextResponse.json(
        { error: 'Waste price not found' },
        { status: 404 }
      );
    }
    
    // Update waste price
    wastePrice.confirmedWastePrice = confirmedPrice;
    wastePrice.status = 'confirmed';
    wastePrice.confirmedAt = new Date();
    wastePrice.confirmedBy = userId;
    wastePrice.notes = notes;
    
    // Recalculate margin with confirmed price
    wastePrice.marginPercent = ((confirmedPrice - wastePrice.buyingPrice) / wastePrice.buyingPrice) * 100;
    
    await wastePrice.save();
    
    // Push to external pricing system
    try {
      // Build absolute URL for internal API call
      const host = request.headers.get('host');
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/external/waste-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku_id: wastePrice.skuId,
          warehouse_id: wastePrice.warehouseId,
          waste_price: confirmedPrice,
          user_id: userId,
          applied_at: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`External API responded with status: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      console.log('Waste price applied successfully to external system');
      
      // Update status to applied
      wastePrice.status = 'applied';
      await wastePrice.save();
      
    } catch (externalError) {
      console.error('Failed to apply waste price to external system:', externalError);
      // Keep status as 'confirmed' but don't fail the request
    }
    
    return NextResponse.json(wastePrice.toObject());
  } catch (error) {
    console.error('Error confirming waste price:', error);
    return NextResponse.json(
      { error: 'Failed to confirm waste price' },
      { status: 500 }
    );
  }
}
