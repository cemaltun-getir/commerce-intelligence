/**
 * Centralized badge color schema for consistent UI across the application
 * 
 * Color Schema Logic:
 * - Purple family: All business domains (Getir variants) - Primary business identity
 * - Green family: Success states, regions, operational success
 * - Blue family: Geographic administrative levels (provinces)  
 * - Cyan: Intermediate geographic levels (districts)
 * - Orange: Operational attributes (sizes)
 * - Magenta/Pink: Demographic/targeting info
 * - Red: Error/warning states
 */

export const BadgeColors = {
  // Business/Domain Related (Primary importance)
  // All Getir domains use purple family for consistent business branding
  domain: {
    'Getir': '#722ed1',        // purple - Core business
    'Getir Büyük': '#722ed1',  // purple - Bulk delivery
    'Getir Express': '#722ed1', // purple - Express delivery
    'Getir Market': '#722ed1',  // purple - Market/grocery
    'Getir10': '#722ed1',      // purple - Legacy naming (10-min delivery)
    'Getir30': '#722ed1',      // purple - Legacy naming (30-min delivery)
    default: '#722ed1',        // purple - Default for unknown domains
    none: '#d9d9d9'            // gray - No domain assigned
  },

  // Geographic/Location (Secondary importance)
  geographic: {
    province: '#1890ff',   // blue - Administrative level 1
    district: '#13c2c2',   // cyan - Administrative level 2
    region: '#52c41a'      // green - Business regions
  },

  // Operational/Warehouse Attributes (Tertiary importance)
  operational: {
    size: '#fa8c16',       // orange - Operational capacity
    demography: '#eb2f96'  // magenta - Target demographics
  },

  // System/Status (Utility)
  status: {
    success: '#52c41a',    // green - Success state (price location set)
    error: '#f5222d',      // red - Error state (price location not set)
    warning: '#faad14',    // gold - Warning state
    info: '#1890ff'        // blue - Info state
  }
} as const;

/**
 * Get domain color based on domain name
 */
export const getDomainColor = (domain: string | undefined): string => {
  if (!domain) return BadgeColors.domain.none;
  return BadgeColors.domain[domain as keyof typeof BadgeColors.domain] || BadgeColors.domain.default;
};

/**
 * Get price location status color
 */
export const getPriceLocationColor = (priceLocation: string | undefined): string => {
  return priceLocation ? BadgeColors.status.success : BadgeColors.status.error;
};

/**
 * Get geographic location colors
 */
export const getGeographicColor = (type: 'province' | 'district' | 'region'): string => {
  return BadgeColors.geographic[type];
};

/**
 * Get operational attribute colors
 */
export const getOperationalColor = (type: 'size' | 'demography'): string => {
  return BadgeColors.operational[type];
};
