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
      await wastePriceApi.applyWastePrice({
        skuId: wastePrice.skuId,
        warehouseId: wastePrice.warehouseId,
        wastePrice: confirmedPrice,
        userId,
      });
      
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
