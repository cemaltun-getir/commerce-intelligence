import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { WastePrice } from '@/models/WastePrice';
import { Product } from '@/types';
import { externalApi } from '@/utils/externalApi';
import { calculateFinalSuggestedWastePrice, calculateProjectedWasteValue, getDefaultWasteConfiguration } from '@/utils/wastePriceCalculations';

// GET /api/waste-prices - Get waste prices with optional filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const warehouse = searchParams.get('warehouse');
    const category = searchParams.get('category');
    const minDays = searchParams.get('minDays');
    const maxDays = searchParams.get('maxDays');
    const status = searchParams.get('status');
    
    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { warehouseName: { $regex: search, $options: 'i' } },
        { categoryName: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (warehouse) {
      const warehouseIds = warehouse.split(',');
      query.warehouseId = { $in: warehouseIds };
    }
    
    if (category) {
      query.categoryName = { $regex: category, $options: 'i' };
    }
    
    if (minDays) {
      query.daysUntilExpiry = { ...query.daysUntilExpiry, $gte: parseInt(minDays) };
    }
    
    if (maxDays) {
      query.daysUntilExpiry = { ...query.daysUntilExpiry, $lte: parseInt(maxDays) };
    }
    
    if (status && status !== 'all') {
      query.status = status;
    } else {
      // Exclude 'applied' prices by default (only show pending, confirmed, rejected)
      query.status = { $ne: 'applied' };
    }
    
    const wastePrices = await WastePrice.find(query)
      .sort({ daysUntilExpiry: 1, projectedWasteValue: -1 })
      .lean();
    
    return NextResponse.json(wastePrices);
  } catch (error) {
    console.error('Error fetching waste prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waste prices' },
      { status: 500 }
    );
  }
}

// POST /api/waste-prices - Create new waste price
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'warehouseId', 'skuId', 'suggestedWastePrice', 'originalSellingPrice',
      'buyingPrice', 'discountPercent', 'marginPercent', 'quantityOnHand',
      'daysUntilExpiry', 'projectedWasteValue', 'productName', 'categoryName', 'warehouseName'
    ];
    
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    const wastePrice = new WastePrice({
      ...body,
      status: 'pending',
      createdAt: new Date(),
    });
    
    await wastePrice.save();
    
    return NextResponse.json(wastePrice.toObject());
  } catch (error) {
    console.error('Error creating waste price:', error);
    return NextResponse.json(
      { error: 'Failed to create waste price' },
      { status: 500 }
    );
  }
}

