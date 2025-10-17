import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { WastePrice } from '@/models/WastePrice';
import { WasteConfiguration } from '@/models/WasteConfiguration';
import { externalApi } from '@/utils/externalApi';
import { calculateFinalSuggestedWastePrice, calculateProjectedWasteValue, getDefaultWasteConfiguration } from '@/utils/wastePriceCalculations';
import { Product, WasteConfiguration as WasteConfigurationType } from '@/types';

// POST /api/waste-prices/generate - Generate waste prices for all expiring products
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Get the base URL for internal API calls
    // Use the request origin if available, otherwise fall back to APP_URL or localhost
    const host = request.headers.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = host 
      ? `${protocol}://${host}`
      : (process.env.APP_URL || 'http://localhost:3000');
    
    console.log('Base URL for internal API calls:', baseUrl);
    
    // Get warehouse product expiry data via internal proxy
    const warehouseExpiryUrl = `${baseUrl}/api/external/warehouse-product-expiry`;
    console.log('Fetching from:', warehouseExpiryUrl);
    const externalResponse = await fetch(warehouseExpiryUrl);
    console.log('Warehouse expiry response status:', externalResponse.status);
    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      console.error('Failed to fetch warehouse expiry data:', errorText);
      throw new Error(`Failed to fetch warehouse product expiry data: ${externalResponse.status}`);
    }
    const expiryData = await externalResponse.json();
    console.log('Fetched expiry data items:', expiryData.length);
    console.log('Sample expiry item:', JSON.stringify(expiryData[0], null, 2));
    
    // Get all products for pricing data via internal proxy
    const productsResponse = await fetch(`${baseUrl}/api/external-products`);
    if (!productsResponse.ok) {
      throw new Error(`Failed to fetch products: ${productsResponse.status}`);
    }
    const products = await productsResponse.json();
    
    // Get configuration from database (get the latest one)
    const configuration = await WasteConfiguration.findOne().sort({ lastUpdated: -1 }).lean() as WasteConfigurationType | null;
    
    if (!configuration) {
      throw new Error('No waste configuration found in database');
    }
    
    // Clear existing waste prices to ensure fresh data
    await WastePrice.deleteMany({ status: 'pending' });
    
    const wastePrices = [];
    
    for (const expiryItem of expiryData) {
      const product = products.find((p: Product) => p.id === expiryItem.sku_id);
      
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
      
      console.log('Creating waste price for:', {
        warehouseId: expiryItem.warehouse_id || expiryItem.location_id,
        warehouseName: expiryItem.warehouse_name || expiryItem.location_name,
        skuId: expiryItem.sku_id,
        productName: expiryItem.sku_name
      });
      
      const newWastePrice = new WastePrice({
        warehouseId: expiryItem.warehouse_id || expiryItem.location_id,
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
        warehouseName: expiryItem.warehouse_name || expiryItem.location_name,
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
