import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { WastePrice } from '@/models/WastePrice';
import { wastePriceApi } from '@/utils/wastePriceApi';

// POST /api/waste-prices/bulk-confirm - Bulk confirm waste prices
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { ids, userId } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid ids array' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }
    
    const wastePrices = await WastePrice.find({
      _id: { $in: ids },
      status: 'pending'
    });
    
    if (wastePrices.length === 0) {
      return NextResponse.json(
        { error: 'No pending waste prices found' },
        { status: 404 }
      );
    }
    
    const confirmedPrices = [];
    
    for (const wastePrice of wastePrices) {
      // Use suggested price as confirmed price
      wastePrice.confirmedWastePrice = wastePrice.suggestedWastePrice;
      wastePrice.status = 'confirmed';
      wastePrice.confirmedAt = new Date();
      wastePrice.confirmedBy = userId;
      
      await wastePrice.save();
      
      // Push to external pricing system
      try {
        await wastePriceApi.applyWastePrice({
          skuId: wastePrice.skuId,
          warehouseId: wastePrice.warehouseId,
          wastePrice: wastePrice.suggestedWastePrice,
          userId,
        });
        
        // Update status to applied
        wastePrice.status = 'applied';
        await wastePrice.save();
        
      } catch (externalError) {
        console.error(`Failed to apply waste price for ${wastePrice._id}:`, externalError);
        // Keep status as 'confirmed' but don't fail the request
      }
      
      confirmedPrices.push(wastePrice.toObject());
    }
    
    return NextResponse.json(confirmedPrices);
  } catch (error) {
    console.error('Error bulk confirming waste prices:', error);
    return NextResponse.json(
      { error: 'Failed to bulk confirm waste prices' },
      { status: 500 }
    );
  }
}
