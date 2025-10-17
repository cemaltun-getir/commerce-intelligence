import { AggressionTier, WasteConfiguration } from '@/types';

// Apply special rounding logic for Getir prices (from existing ProductsPage)
export const applyGetirRounding = (price: number): number => {
  // Get integer and decimal parts
  const integerPart = Math.floor(price);
  const decimalPart = price - integerPart;
  
  // Apply special rounding logic for Getir prices
  if (decimalPart === 0) {
    // Keep whole numbers as is
    return Number(price.toFixed(2));
  } else if (decimalPart < 0.5) {
    // Round to x.5 for decimal values under x.5
    return integerPart + 0.5;
  } else {
    // Round to x.99 for decimal values over x.5 (including 0.5)
    return integerPart + 0.99;
  }
};

// Calculate discount percentage based on days until expiry and configuration
export const calculateDiscountPercent = (
  daysUntilExpiry: number,
  configuration: WasteConfiguration
): number => {
  const { aggressionTiers, maxDiscountPercent } = configuration;
  
  // Find the appropriate tier for the days until expiry
  const tier = aggressionTiers.find(t => 
    daysUntilExpiry >= t.minDays && daysUntilExpiry <= t.maxDays
  );
  
  if (!tier) {
    // Default to minimal discount for items outside all tiers
    return Math.min(5, maxDiscountPercent);
  }
  
  // Calculate discount: baseDiscount + ((maxDays - daysUntilExpiry) × dailyIncrement)
  const daysFromMax = tier.maxDays - daysUntilExpiry;
  const calculatedDiscount = tier.baseDiscount + (daysFromMax * tier.dailyIncrement);
  
  // Ensure we don't exceed the maximum discount
  return Math.min(calculatedDiscount, maxDiscountPercent);
};

// Calculate suggested waste price
export const calculateSuggestedWastePrice = (
  sellingPrice: number,
  daysUntilExpiry: number,
  configuration: WasteConfiguration
): number => {
  const discountPercent = calculateDiscountPercent(daysUntilExpiry, configuration);
  const rawWastePrice = sellingPrice * (1 - discountPercent / 100);
  
  return applyGetirRounding(rawWastePrice);
};

// Ensure waste price respects minimum margin constraint
export const applyMarginConstraint = (
  wastePrice: number,
  buyingPrice: number,
  minMarginPercent: number
): number => {
  const minAllowedPrice = buyingPrice * (1 + minMarginPercent / 100);
  
  if (wastePrice < minAllowedPrice) {
    return applyGetirRounding(minAllowedPrice);
  }
  
  return wastePrice;
};

// Calculate final suggested waste price with all constraints
export const calculateFinalSuggestedWastePrice = (
  sellingPrice: number,
  buyingPrice: number,
  daysUntilExpiry: number,
  configuration: WasteConfiguration
): { wastePrice: number; discountPercent: number; marginPercent: number } => {
  // Calculate initial suggested price
  let wastePrice = calculateSuggestedWastePrice(sellingPrice, daysUntilExpiry, configuration);
  
  // Apply margin constraint
  wastePrice = applyMarginConstraint(wastePrice, buyingPrice, configuration.minMarginPercent);
  
  // Recalculate actual discount and margin
  const actualDiscountPercent = ((sellingPrice - wastePrice) / sellingPrice) * 100;
  const marginPercent = ((wastePrice - buyingPrice) / buyingPrice) * 100;
  
  return {
    wastePrice,
    discountPercent: Math.round(actualDiscountPercent * 10) / 10, // Round to 1 decimal
    marginPercent: Math.round(marginPercent * 10) / 10
  };
};

// Calculate projected waste value
export const calculateProjectedWasteValue = (
  quantityOnHand: number,
  sellingPrice: number
): number => {
  return quantityOnHand * sellingPrice;
};

// Get urgency level based on days until expiry
export const getUrgencyLevel = (daysUntilExpiry: number): 'critical' | 'urgent' | 'warning' | 'safe' => {
  if (daysUntilExpiry <= 3) return 'critical';
  if (daysUntilExpiry <= 7) return 'urgent';
  if (daysUntilExpiry <= 14) return 'warning';
  return 'safe';
};

// Get urgency color for UI
export const getUrgencyColor = (daysUntilExpiry: number): string => {
  const urgency = getUrgencyLevel(daysUntilExpiry);
  const colorMap = {
    critical: '#ff4d4f', // Red
    urgent: '#fa8c16',   // Orange
    warning: '#faad14',  // Yellow
    safe: '#52c41a'      // Green
  };
  return colorMap[urgency];
};

// Default configuration
export const getDefaultWasteConfiguration = (): Omit<WasteConfiguration, '_id'> => ({
  aggressionTiers: [
    {
      name: 'Critical (0-3 days)',
      minDays: 0,
      maxDays: 3,
      baseDiscount: 40,
      dailyIncrement: 5
    },
    {
      name: 'Urgent (4-7 days)',
      minDays: 4,
      maxDays: 7,
      baseDiscount: 20,
      dailyIncrement: 5
    },
    {
      name: 'Warning (8-14 days)',
      minDays: 8,
      maxDays: 14,
      baseDiscount: 10,
      dailyIncrement: 1.5
    },
    {
      name: 'Safe (15+ days)',
      minDays: 15,
      maxDays: 999,
      baseDiscount: 5,
      dailyIncrement: 0.5
    }
  ],
  minMarginPercent: 5,
  maxDiscountPercent: 70,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system'
});
