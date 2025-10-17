import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { WasteConfiguration } from '@/models/WasteConfiguration';
import { getDefaultWasteConfiguration } from '@/utils/wastePriceCalculations';

// GET /api/waste-configuration - Get waste configuration
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    let configuration = await WasteConfiguration.findOne();
    
    if (!configuration) {
      // Create default configuration if none exists
      const defaultConfig = getDefaultWasteConfiguration();
      configuration = new WasteConfiguration(defaultConfig);
      await configuration.save();
    }
    
    return NextResponse.json(configuration.toObject());
  } catch (error) {
    console.error('Error fetching waste configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waste configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/waste-configuration - Update waste configuration
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { aggressionTiers, minMarginPercent, maxDiscountPercent, updatedBy } = body;
    
    // Validate required fields
    if (!aggressionTiers || !Array.isArray(aggressionTiers)) {
      return NextResponse.json(
        { error: 'Missing or invalid aggressionTiers' },
        { status: 400 }
      );
    }
    
    if (typeof minMarginPercent !== 'number' || minMarginPercent < 0) {
      return NextResponse.json(
        { error: 'minMarginPercent must be a non-negative number' },
        { status: 400 }
      );
    }
    
    if (typeof maxDiscountPercent !== 'number' || maxDiscountPercent < 0 || maxDiscountPercent > 100) {
      return NextResponse.json(
        { error: 'maxDiscountPercent must be a number between 0 and 100' },
        { status: 400 }
      );
    }
    
    // Validate aggression tiers
    for (const tier of aggressionTiers) {
      if (!tier.name || typeof tier.minDays !== 'number' || typeof tier.maxDays !== 'number' ||
          typeof tier.baseDiscount !== 'number' || typeof tier.dailyIncrement !== 'number') {
        return NextResponse.json(
          { error: 'Invalid aggression tier structure' },
          { status: 400 }
        );
      }
      
      if (tier.minDays < 0 || tier.maxDays < tier.minDays) {
        return NextResponse.json(
          { error: 'Invalid days range in aggression tier' },
          { status: 400 }
        );
      }
      
      if (tier.baseDiscount < 0 || tier.baseDiscount > 100) {
        return NextResponse.json(
          { error: 'baseDiscount must be between 0 and 100' },
          { status: 400 }
        );
      }
      
      if (tier.dailyIncrement < 0) {
        return NextResponse.json(
          { error: 'dailyIncrement must be non-negative' },
          { status: 400 }
        );
      }
    }
    
    let configuration = await WasteConfiguration.findOne();
    
    if (!configuration) {
      // Create new configuration
      configuration = new WasteConfiguration({
        aggressionTiers,
        minMarginPercent,
        maxDiscountPercent,
        lastUpdated: new Date(),
        updatedBy,
      });
    } else {
      // Update existing configuration
      configuration.aggressionTiers = aggressionTiers;
      configuration.minMarginPercent = minMarginPercent;
      configuration.maxDiscountPercent = maxDiscountPercent;
      configuration.lastUpdated = new Date();
      configuration.updatedBy = updatedBy;
    }
    
    await configuration.save();
    
    return NextResponse.json(configuration.toObject());
  } catch (error) {
    console.error('Error updating waste configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update waste configuration' },
      { status: 500 }
    );
  }
}
