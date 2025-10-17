import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { WastePrice } from '@/models/WastePrice';
import { WasteConfiguration } from '@/models/WasteConfiguration';
import { externalApi } from '@/utils/externalApi';
import { calculateFinalSuggestedWastePrice, calculateProjectedWasteValue, getDefaultWasteConfiguration } from '@/utils/wastePriceCalculations';

// POST /api/waste-prices/generate - Generate waste prices for all expiring products
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Get warehouse product expiry data directly from external API
    const externalResponse = await fetch('http://localhost:3001/api/warehouse-inventory');
    if (!externalResponse.ok) {
      throw new Error(`Failed to fetch warehouse product expiry data: ${externalResponse.status}`);
    }
    const expiryData = await externalResponse.json();
    
    // Get all products for pricing data directly from external API
    const productsResponse = await fetch('http://localhost:3001/api/skus');
    if (!productsResponse.ok) {
      throw new Error(`Failed to fetch products: ${productsResponse.status}`);
    }
    const products = await productsResponse.json();
    
    // Get configuration from database
    const configuration = await WasteConfiguration.findById('68e8e5aa3190fb9db79aa9f4').lean();
    
    if (!configuration) {
      throw new Error('No waste configuration found in database');
    }
    
    // Clear existing waste prices to ensure fresh data
    await WastePrice.deleteMany({ status: 'pending' });
    
    const wastePrices = [];
    
    for (const expiryItem of expiryData) {
      const product = products.find(p => p.id === expiryItem.sku_id);
      
      if (!product || !product.selling_price || !product.buying_price) {
        continue; // Skip products without pricing data
      }
      
      // Calculate suggested waste price
      const { wastePrice, discountPercent, marginPercent } = calculateFinalSuggestedWastePrice(
        product.selling_price,
        product.buying_price,
        expiryItem.days_until_expiry,
        configuration
      );
      
      const projectedWasteValue = calculateProjectedWasteValue(
        expiryItem.quantity_on_hand,
        product.selling_price
      );
      
      // No need to check for duplicates since we cleared all pending waste prices
      
      const newWastePrice = new WastePrice({
        warehouseId: expiryItem.location_id,
        skuId: expiryItem.sku_id,
        suggestedWastePrice: wastePrice,
        originalSellingPrice: product.selling_price,
        buyingPrice: product.buying_price,
        discountPercent,
        marginPercent,
        quantityOnHand: expiryItem.quantity_on_hand,
        daysUntilExpiry: expiryItem.days_until_expiry,
        projectedWasteValue,
        status: 'pending',
        createdAt: new Date(),
        productName: expiryItem.sku_name,
        categoryName: product.category_level4_name || 'Unknown',
        warehouseName: expiryItem.location_name,
        // Add category level IDs for filtering
        categoryLevel1Id: product.category_level1_id,
        categoryLevel2Id: product.category_level2_id,
        categoryLevel3Id: product.category_level3_id,
        categoryLevel4Id: product.category_level4_id,
      });
      
      await newWastePrice.save();
      wastePrices.push(newWastePrice.toObject());
    }
    
    return NextResponse.json(wastePrices);
  } catch (error) {
    console.error('Error generating waste prices:', error);
    return NextResponse.json(
      { error: 'Failed to generate waste prices', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
