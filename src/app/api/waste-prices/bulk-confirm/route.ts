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
    
    // Build absolute URL for internal API calls
    const host = request.headers.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
    
    for (const wastePrice of wastePrices) {
      // Use suggested price as confirmed price
      wastePrice.confirmedWastePrice = wastePrice.suggestedWastePrice;
      wastePrice.status = 'confirmed';
      wastePrice.confirmedAt = new Date();
      wastePrice.confirmedBy = userId;
      
      await wastePrice.save();
      
      // Push to external pricing system
      try {
        const response = await fetch(`${baseUrl}/api/external/waste-price`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sku_id: wastePrice.skuId,
            warehouse_id: wastePrice.warehouseId,
            waste_price: wastePrice.suggestedWastePrice,
            user_id: userId,
            applied_at: new Date().toISOString(),
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`External API responded with status: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }
        
        console.log(`Waste price applied successfully for ${wastePrice._id}`);
        
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
