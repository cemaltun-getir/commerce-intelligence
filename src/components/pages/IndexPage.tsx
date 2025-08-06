'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Typography, 
  Tabs, 
  Table, 
  Button, 
  Input, 
  Select, 
  Row,
  Col,
  Card,
  Tag,
  Dropdown,
  Tooltip,
  App,
  Checkbox,
  Space
} from 'antd';
import { EditOutlined, ExportOutlined, DownOutlined, CopyOutlined, CheckOutlined, ClearOutlined, SettingOutlined } from '@ant-design/icons';
import { exportProductMatches } from '@/utils/exportUtils';
import { useAppStore } from '@/store/useAppStore';
import ClientOnlyTable from '../common/ClientOnlyTable';

const { Title, Text } = Typography;
const { Option } = Select;
const { useApp } = App;

// Define all available columns with their metadata
const ALL_COLUMNS = [
  {
    key: 'getirProductName',
    title: 'Getir Product Name',
    width: 200,
    fixed: 'left' as const,
    defaultVisible: true,
    alwaysVisible: true, // This column cannot be hidden
  },
  {
    key: 'segmentName',
    title: 'Segment',
    width: 120,
    defaultVisible: true,
  },
  {
    key: 'competitor',
    title: 'Competitor',
    width: 120,
    defaultVisible: true,
  },
  {
    key: 'kviType',
    title: 'KVI Label',
    width: 120,
    defaultVisible: true,
  },
  {
    key: 'ix',
    title: 'IX',
    width: 60,
    defaultVisible: true,
  },
  {
    key: 'buyingPrice',
    title: 'Buying Price',
    width: 140,
    defaultVisible: true,
  },
  {
    key: 'buyingPriceWithoutVat',
    title: 'Buying Price (w/o VAT)',
    width: 160,
    defaultVisible: true,
  },
  {
    key: 'getirUnitPrice',
    title: 'Getir Unit Price',
    width: 140,
    defaultVisible: true,
  },
  {
    key: 'profit',
    title: 'Profit',
    width: 140,
    defaultVisible: true,
  },
  {
    key: 'competitorPrice',
    title: 'Competitor Price',
    width: 140,
    defaultVisible: true,
  },
  {
    key: 'isDiscounted',
    title: 'Disc.',
    width: 80,
    defaultVisible: true,
  },
  {
    key: 'struckPrice',
    title: 'Struck Price (Original)',
    width: 140,
    defaultVisible: false,
  },
  {
    key: 'discountRate',
    title: 'Discount Rate (%)',
    width: 150,
    defaultVisible: true,
  },
  {
    key: 'struckPriceCalculated',
    title: 'Struck Price (Calculated)',
    width: 140,
    defaultVisible: false,
  },
];

const IndexPage: React.FC = () => {
  const { message } = useApp();
  const [activeTab, setActiveTab] = useState('');
  const [activeChannel, setActiveChannel] = useState('getir');
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [selectedCompetitorFilter, setSelectedCompetitorFilter] = useState('all');
  const [selectedDiscountedFilter, setSelectedDiscountedFilter] = useState('all');
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    // Always start with default visible columns and always-visible columns to avoid hydration mismatch
    const defaultVisible = new Set(
      ALL_COLUMNS.filter(col => col.defaultVisible || col.alwaysVisible).map(col => col.key)
    );
    return defaultVisible;
  });

  // Track if preferences have been loaded from localStorage
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Load saved preferences after component mounts (client-side only)
  useEffect(() => {
    try {
      const savedColumns = localStorage.getItem('product-list-visible-columns');
      if (savedColumns) {
        const parsedColumns = JSON.parse(savedColumns);
        if (Array.isArray(parsedColumns)) {
          setVisibleColumns(new Set(parsedColumns));
        }
      }
    } catch (error) {
      console.warn('Failed to load column preferences from localStorage:', error);
    } finally {
      setPreferencesLoaded(true);
    }
  }, []);
  
  // Discount rates state - store discount rates for each product
  const [discountRates, setDiscountRates] = useState<Record<string, number>>({});
  const [applyAllDiscountRate, setApplyAllDiscountRate] = useState<string>('');
  
  // Selection state for product table
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // Connect to store
  const { 
    segments, 
    indexValues,
    competitors,
    products,
    competitorPrices,
    categories,
    subCategories,
    fetchSegments,
    fetchIndexValues,
    fetchProducts,
    fetchVendors,
    fetchCompetitorPrices,
    fetchCategories,
    fetchSubCategories,
    updateIndexValue,
    activeSalesChannel,
    setActiveSalesChannel 
  } = useAppStore();

  // Fetch segments and index values on component mount
  useEffect(() => {
    fetchSegments();
    fetchIndexValues();
    fetchProducts();
    fetchVendors();
    fetchCompetitorPrices();
    fetchCategories();
    fetchSubCategories();
  }, [fetchSegments, fetchIndexValues, fetchProducts, fetchVendors, fetchCompetitorPrices, fetchCategories, fetchSubCategories]);

  // Update local state when store changes
  useEffect(() => {
    setActiveChannel(activeSalesChannel);
  }, [activeSalesChannel]);

  // Set initial activeTab when competitors are loaded
  useEffect(() => {
    if (competitors.length > 0 && !activeTab) {
      setActiveTab(competitors[0].id);
    }
  }, [competitors, activeTab]);

  const handleChannelChange = (channel: string) => {
    setActiveChannel(channel);
    setActiveSalesChannel(channel as 'getir' | 'getirbuyuk');
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Reset sub-category selection when category changes
    setSelectedSubCategory('all');
  };

  // Handle discount rate change
  const handleDiscountRateChange = (productKey: string, value: string) => {
    if (value === '' || value === null || value === undefined) {
      // Remove the discount rate when input is cleared
      setDiscountRates(prev => {
        const newRates = { ...prev };
        delete newRates[productKey];
        return newRates;
      });
    } else {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        setDiscountRates(prev => ({
          ...prev,
          [productKey]: numericValue
        }));
      }
    }
  };

  // Apply discount rate to all currently visible products
  const handleApplyDiscountToAll = (discountRate: number) => {
    const newDiscountRates = { ...discountRates };
    
    // Apply discount rate to all currently filtered/visible products
    filteredProductData.forEach(product => {
      newDiscountRates[product.key] = discountRate;
    });
    
    setDiscountRates(newDiscountRates);
  };

  // Clear discount rates for all currently visible products
  const handleClearDiscountToAll = () => {
    const newDiscountRates = { ...discountRates };
    
    // Clear discount rates for all currently filtered/visible products
    filteredProductData.forEach(product => {
      delete newDiscountRates[product.key];
    });
    
    setDiscountRates(newDiscountRates);
  };

  // Copy product ID to clipboard
  const copyProductId = async (productId: string, productName: string) => {
    try {
      await navigator.clipboard.writeText(productId);
      message.success(`Copied ID for "${productName}"`);
    } catch (_error) {
      message.error('Failed to copy product ID');
    }
  };

  // Apply special rounding logic for Getir prices
  const applyGetirRounding = (price: number): number => {
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

  // Calculate Getir Unit Price based on competitor price and index value
  // Now location-aware - prices vary by segment's price location
  const calculateGetirPrice = (competitorPrice: number, indexValue: number, segmentPriceLocation?: string): number => {
    // If no price location, cannot calculate price
    if (!segmentPriceLocation) {
      return 0; // Will be handled as null in the calling code
    }

    // Apply location-based pricing adjustment first
    const locationAdjustedPrice = getLocationBasedPrice(competitorPrice, segmentPriceLocation);
    
    // Then apply index value calculation
    // Index value represents percentage relative to competitor
    // 100 = same price, 105 = 5% higher, 95 = 5% lower
    const basePrice = locationAdjustedPrice * (indexValue / 100);
    
    // Apply special rounding logic
    return applyGetirRounding(basePrice);
  };

  // Location-based pricing adjustment (same logic as backend)
  const getLocationBasedPrice = (basePrice: number, location: string): number => {
    const locationMultipliers: Record<string, number> = {
      istanbul: 1.0,      // Base price
      ankara: 0.95,       // 5% lower
      izmir: 0.98,        // 2% lower  
      antalya: 1.02,      // 2% higher
      bursa: 0.97,        // 3% lower
      adana: 0.93,        // 7% lower
      gaziantep: 0.90,    // 10% lower
      konya: 0.92         // 8% lower
    };
    
    const multiplier = locationMultipliers[location] || 1.0;
    return Math.round(basePrice * multiplier * 100) / 100; // Round to 2 decimals
  };



  // Get competitor display name by ID
  const getCompetitorDisplayName = useCallback((competitorId: string): string => {
    const competitor = competitors.find(c => c.id === competitorId);
    return competitor?.name || competitorId;
  }, [competitors]);

  // Create dynamic index data from segments and indexValues
  const createIndexData = () => {
    const kviTypes = ['SKVI', 'KVI', 'Background', 'Foreground'] as const;
    const kviLabels = {
      'SKVI': 'SKVI',
      'KVI': 'KVI', 
      'Background': 'Background (BG)',
      'Foreground': 'Foreground (FG)'
    };

    return kviTypes.map(kviType => {
      const row: Record<string, string | number> = {
        key: kviType.toLowerCase(),
        label: kviLabels[kviType],
      };

      // Add a column for each segment
      segments.forEach((segment, index) => {
        const segmentKey = `segment${index + 1}`;
        
        // Find existing index value for this combination
        const existingValue = indexValues.find(iv => 
          iv.segmentId === segment.id &&
          iv.kviType === kviType &&
          iv.competitorId === activeTab &&
          iv.salesChannel === activeChannel
        );

        row[segmentKey] = existingValue?.value ?? ''; // Default to empty string for new segments (empty state)
        row[`${segmentKey}SegmentId`] = segment.id; // Store segment ID for updates
      });

      return row;
    });
  };

  const indexData = createIndexData();

  // Handle index value change
  const handleIndexValueChange = (
    value: string, 
    segmentId: string, 
    kviType: 'SKVI' | 'KVI' | 'Background' | 'Foreground'
  ) => {
    const numericValue = parseFloat(value) || 0;
    updateIndexValue(segmentId, kviType, activeTab, numericValue);
  };

  // Function to get index value for a specific combination
  const getIndexValue = useCallback((
    segmentId: string,
    kviType: 'SKVI' | 'KVI' | 'Background' | 'Foreground',
    competitorId: string,
    salesChannel: string
  ): number | null => {
    const indexValue = indexValues.find(iv => 
      iv.segmentId === segmentId &&
      iv.kviType === kviType &&
      iv.competitorId === competitorId &&
      iv.salesChannel === salesChannel
    );
    return indexValue?.value ?? null; // Return null for new segments (empty state)
  }, [indexValues]);

  // Function to determine KVI type from KVI label
  const getKviTypeFromLabel = useCallback((kviLabel: number): 'SKVI' | 'KVI' | 'Background' | 'Foreground' => {
    if (kviLabel >= 95) return 'SKVI';
    if (kviLabel >= 90) return 'KVI';
    if (kviLabel >= 50) return 'Foreground';
    return 'Background';
  }, []);

  // Function to determine which segment a product belongs to (simplified - using first segment for now)
  const getProductSegment = useCallback((): string => {
    return segments.length > 0 ? segments[0].id : '';
  }, [segments]);

  // Create dynamic product data with calculated IX values
  const createProductData = useCallback(() => {
    // Generate products for each segment-competitor combination
    const expandedProductData: any[] = [];
    let keyCounter = 1;

    segments.forEach((segment, segmentIndex) => {
      // Filter price mappings to only include those that match this segment's price location
      const segmentPriceMappings = competitorPrices.filter(priceMapping => 
        priceMapping.location_id === segment.priceLocation
      );

      segmentPriceMappings.forEach(priceMapping => {
        const product = products.find(p => p.id === priceMapping.sku_id);
        const competitor = competitors.find(c => c.id === priceMapping.vendor_id);
        
        const baseProduct = {
          id: priceMapping.sku_id,
          getirProductName: priceMapping.sku_name,
          competitorId: priceMapping.vendor_id,
          kviLabel: product?.kvi_label === 'SKVI' ? 95 : 
                    product?.kvi_label === 'KVI' ? 90 : 
                    product?.kvi_label === 'Foreground' ? 70 : 30, // Convert string to number
          competitorPrice: priceMapping.price, // Use price from price mapping
          category: product?.category_name || 'Unknown',
          subCategory: product?.sub_category_name || 'Unknown',
          brand: priceMapping.brand,
          unit: priceMapping.unit,
          unit_value: priceMapping.unit_value,
          location_id: priceMapping.location_id,
          location_name: priceMapping.location_name,
          // New fields from API
          isDiscounted: priceMapping.is_discounted,
          struckPrice: priceMapping.struck_price,
          // New buying price fields from SKU API
          buyingPrice: product?.buying_price,
          buyingVat: product?.buying_vat,
          buyingPriceWithoutVat: product?.buying_price_without_vat,
        };

        const kviType = getKviTypeFromLabel(baseProduct.kviLabel);
        const ix = getIndexValue(segment.id, kviType, baseProduct.competitorId, activeChannel);
        
        // Apply location-based adjustment to competitor price for this segment
        // If no priceLocation is set, don't show any price
        const locationAdjustedCompetitorPrice = segment.priceLocation 
          ? getLocationBasedPrice(baseProduct.competitorPrice, segment.priceLocation)
          : null;
        
        // Calculate Getir Unit Price based on location-adjusted competitor price and index value
        // Only calculate if IX value exists (not null for new segments) AND segment has priceLocation
        const calculatedGetirPrice = (ix !== null && segment.priceLocation) 
          ? calculateGetirPrice(baseProduct.competitorPrice, ix, segment.priceLocation) 
          : null;
        
        expandedProductData.push({
          key: keyCounter.toString(),
          ...baseProduct,
          competitorPrice: locationAdjustedCompetitorPrice, // Use location-adjusted price for display
          id: `${baseProduct.id}_${segment.id}`, // Unique ID per segment
          competitor: getCompetitorDisplayName(baseProduct.competitorId),
          kviType,
          ix,
          getirUnitPrice: calculatedGetirPrice,
          segmentId: segment.id,
          segmentName: segment.name || `Segment #${segmentIndex + 1}`,
          // Add metadata for better error messaging
          hasApiLocation: !!segment.priceLocation,
          hasIndexValue: ix !== null,
          // New fields from API
          isDiscounted: baseProduct.isDiscounted,
          struckPrice: baseProduct.struckPrice,
          // New buying price fields from SKU API
          buyingPrice: baseProduct.buyingPrice,
          buyingVat: baseProduct.buyingVat,
          buyingPriceWithoutVat: baseProduct.buyingPriceWithoutVat,
        });
        keyCounter++;
      });
    });

    return expandedProductData;
  }, [segments, getKviTypeFromLabel, getIndexValue, activeChannel, getCompetitorDisplayName, calculateGetirPrice, competitorPrices, products, competitors]);

  // Make product data reactive to index values, segments, and active competitor/channel
  const productData = useMemo(() => {
    return createProductData();
  }, [createProductData]);

  // Filter product data independently (not based on Index Chart competitor selection)
  const filteredProductData = useMemo(() => {
    let filtered = productData;
    
    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(product => 
        product.getirProductName.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Apply sub-category filter
    if (selectedSubCategory && selectedSubCategory !== 'all') {
      filtered = filtered.filter(product => product.subCategory === selectedSubCategory);
    }
    
    // Apply competitor filter
    if (selectedCompetitorFilter && selectedCompetitorFilter !== 'all') {
      filtered = filtered.filter(product => product.competitorId === selectedCompetitorFilter);
    }
    
    // Apply discounted filter
    if (selectedDiscountedFilter && selectedDiscountedFilter !== 'all') {
      if (selectedDiscountedFilter === 'discounted') {
        filtered = filtered.filter(product => product.isDiscounted === true);
      } else if (selectedDiscountedFilter === 'not-discounted') {
        filtered = filtered.filter(product => product.isDiscounted === false);
      }
    }
    
    return filtered;
  }, [productData, searchText, selectedCategory, selectedSubCategory, selectedCompetitorFilter, selectedDiscountedFilter]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedRowKeys([]);
  }, [searchText, selectedCategory, selectedSubCategory, selectedCompetitorFilter, selectedDiscountedFilter]);

  const handleExport = (format: 'csv' | 'xlsx') => {
    // If there are selected items, export only those
    if (selectedRowKeys.length > 0) {
      const selectedData = filteredProductData.filter(product => 
        selectedRowKeys.includes(product.key)
      );
      exportProductMatches(selectedData, format, discountRates);
      return;
    }
    
    // If no selections, ask user if they want to export all products or just filtered results
    if (filteredProductData.length !== productData.length) {
      // If there are filters applied, ask what to export
      const exportAll = window.confirm(
        `Do you want to export all ${productData.length} products or just the ${filteredProductData.length} filtered results?\n\n` +
        `Click "OK" to export all products, or "Cancel" to export only filtered results.`
      );
      
      if (exportAll) {
        exportProductMatches(productData, format, discountRates);
      } else {
        exportProductMatches(filteredProductData, format, discountRates);
      }
    } else {
      // No filters applied, export all
      exportProductMatches(filteredProductData, format, discountRates);
    }
  };

  const exportMenuItems = [
    {
      key: 'csv',
      label: selectedRowKeys.length > 0 
        ? `Export ${selectedRowKeys.length} selected as CSV`
        : 'Export as CSV',
      onClick: () => handleExport('csv'),
    },
    {
      key: 'xlsx', 
      label: selectedRowKeys.length > 0 
        ? `Export ${selectedRowKeys.length} selected as Excel`
        : 'Export as Excel',
      onClick: () => handleExport('xlsx'),
    },
  ];

  // Sales channel tabs items
  const salesChannelItems = [
    {
      key: 'getir',
      label: 'Getir',
    },
    {
      key: 'getirbuyuk', 
      label: 'GetirBüyük',
    },
  ];

  // Competitor tabs items - use real data from external API
  const competitorItems = competitors.map(competitor => ({
    key: competitor.id,
    label: competitor.name,
  }));

  // Dynamic index matrix columns
  const createIndexColumns = () => {
    const baseColumns = [
    {
      title: '',
      dataIndex: 'label',
      key: 'label',
      width: 150,
      fixed: 'left' as const,
      render: (text: string) => <Text strong>{text}</Text>,
      }
    ];

    // Add a column for each segment
    const segmentColumns = segments.map((segment, index) => {
      const segmentKey = `segment${index + 1}`;
      return {
        title: segment.name || `Segment #${index + 1}`,
        dataIndex: segmentKey,
        key: segmentKey,
        width: 120,
        align: 'center' as const,
        render: (value: number | string, record: Record<string, string | number>) => {
          const segmentId = record[`${segmentKey}SegmentId`] as string;
          const kviType = record.key === 'skvi' ? 'SKVI' : 
                          record.key === 'kvi' ? 'KVI' :
                          record.key === 'background' ? 'Background' : 'Foreground';
          
          return (
        <Input 
          value={value === '' ? '' : value} 
          placeholder=""
          style={{ textAlign: 'center', width: '80px' }}
          size="small"
              onChange={(e) => handleIndexValueChange(e.target.value, segmentId, kviType)}
              type="number"
              min={0}
            />
          );
        },
      };
    });

    return [...baseColumns, ...segmentColumns];
  };

  const indexColumns = createIndexColumns();

  // Get unique categories from external API
  const uniqueCategories = useMemo(() => {
    return categories.map(category => category.name).sort();
  }, [categories]);

  // Get sub-categories based on selected category
  const availableSubCategories = useMemo(() => {
    if (selectedCategory === 'all' || !selectedCategory) {
      // If no category is selected, show all sub-categories
      return subCategories.map(subCategory => subCategory.name).sort();
    }
    
    // Find the selected category and get its sub-categories
    const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);
    if (selectedCategoryData) {
      return selectedCategoryData.sub_categories.map(subCat => subCat.name).sort();
    }
    
    return [];
  }, [categories, subCategories, selectedCategory]);

  // Column customization functions
  const handleColumnVisibilityChange = (columnKey: string, visible: boolean) => {
    // Prevent hiding always-visible columns
    const column = ALL_COLUMNS.find(col => col.key === columnKey);
    if (column?.alwaysVisible && !visible) {
      return; // Don't allow hiding always-visible columns
    }

    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (visible) {
        newSet.add(columnKey);
      } else {
        newSet.delete(columnKey);
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('product-list-visible-columns', JSON.stringify(Array.from(newSet)));
      } catch (error) {
        console.warn('Failed to save column preferences to localStorage:', error);
      }
      
      return newSet;
    });
  };

  const resetToDefaultColumns = () => {
    const defaultVisible = new Set(
      ALL_COLUMNS.filter(col => col.defaultVisible || col.alwaysVisible).map(col => col.key)
    );
    setVisibleColumns(defaultVisible);
    
    // Save to localStorage
    try {
      localStorage.setItem('product-list-visible-columns', JSON.stringify(Array.from(defaultVisible)));
    } catch (error) {
      console.warn('Failed to save column preferences to localStorage:', error);
    }
  };

  const selectAllColumns = () => {
    const allColumnKeys = new Set(ALL_COLUMNS.map(col => col.key));
    setVisibleColumns(allColumnKeys);
    
    // Save to localStorage
    try {
      localStorage.setItem('product-list-visible-columns', JSON.stringify(Array.from(allColumnKeys)));
    } catch (error) {
      console.warn('Failed to save column preferences to localStorage:', error);
    }
  };

  const deselectAllColumns = () => {
    // Always include always-visible columns even when deselecting all
    const alwaysVisibleColumns = new Set(
      ALL_COLUMNS.filter(col => col.alwaysVisible).map(col => col.key)
    );
    setVisibleColumns(alwaysVisibleColumns);
    
    // Save to localStorage
    try {
      localStorage.setItem('product-list-visible-columns', JSON.stringify(Array.from(alwaysVisibleColumns)));
    } catch (error) {
      console.warn('Failed to save column preferences to localStorage:', error);
    }
  };

  // Column selector dropdown items
  const columnSelectorItems = [
    {
      key: 'header',
      label: (
        <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', marginBottom: '8px' }}>
          <Text strong>Column Visibility</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {preferencesLoaded ? visibleColumns.size : ALL_COLUMNS.filter(col => col.defaultVisible).length} of {ALL_COLUMNS.length} columns visible
          </Text>
        </div>
      ),
      disabled: true,
    },
    {
      key: 'select-all',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Select All</span>
          <Tag color="blue" style={{ fontSize: '11px', padding: '0 4px' }}>{ALL_COLUMNS.length}</Tag>
        </div>
      ),
      onClick: selectAllColumns,
    },
    {
      key: 'deselect-all',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Deselect All</span>
          <Tag color="red" style={{ fontSize: '11px', padding: '0 4px' }}>0</Tag>
        </div>
      ),
      onClick: deselectAllColumns,
    },
    {
      key: 'reset-default',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Reset to Default</span>
          <Tag color="green" style={{ fontSize: '11px', padding: '0 4px' }}>
            {ALL_COLUMNS.filter(col => col.defaultVisible).length}
          </Tag>
        </div>
      ),
      onClick: resetToDefaultColumns,
    },
    {
      type: 'divider' as const,
    },
    ...ALL_COLUMNS.map(column => ({
      key: column.key,
      label: (
        <Checkbox
          checked={visibleColumns.has(column.key)}
          onChange={(e) => handleColumnVisibilityChange(column.key, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          disabled={column.alwaysVisible}
        >
          {column.title}
        </Checkbox>
      ),
      onClick: () => {
        // Toggle column visibility
        const isCurrentlyVisible = visibleColumns.has(column.key);
        handleColumnVisibilityChange(column.key, !isCurrentlyVisible);
      },
    })),
  ];

  // Product list columns - now filtered based on visible columns
  const productColumns = [
    {
      title: 'Getir Product Name',
      dataIndex: 'getirProductName',
      key: 'getirProductName',
      width: 200,
      fixed: 'left' as const,
      render: (name: string, record: Record<string, string | number>) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{name}</span>
          <Tooltip title={`Copy Product ID: ${record.id}`}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyProductId(record.id as string, name)}
              style={{ padding: '2px 4px', height: 'auto' }}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Segment',
      dataIndex: 'segmentName',
      key: 'segmentName',
      width: 120,
      render: (segmentName: string) => (
        <Tag color="purple">
          {segmentName}
        </Tag>
      ),
    },
    {
      title: 'Competitor',
      dataIndex: 'competitor',
      key: 'competitor',
      width: 120,
      render: (competitor: string) => (
        <Tag color={competitor === 'ŞOK' ? 'orange' : 'blue'}>
          {competitor}
        </Tag>
      ),
    },
    {
      title: 'KVI Label',
      dataIndex: 'kviType',
      key: 'kviType',
      width: 120,
      align: 'center' as const,
      render: (kviType: string) => {
        const colorMap = {
          'SKVI': 'red',
          'KVI': 'orange', 
          'Foreground': 'blue',
          'Background': 'default'
        };
        return (
          <Tag color={colorMap[kviType as keyof typeof colorMap] || 'default'}>
            {kviType}
          </Tag>
        );
      },
    },
    {
      title: 'IX',
      dataIndex: 'ix',
      key: 'ix',
      width: 60,
      align: 'center' as const,
    },
    {
      title: 'Buying Price',
      dataIndex: 'buyingPrice',
      key: 'buyingPrice',
      width: 140,
      align: 'center' as const,
      render: (price: number | null | undefined, record: any) => {
        if (price === null || price === undefined) {
          return (
            <div style={{ color: '#999', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>
              No data
            </div>
          );
        }
        return (
          <div style={{ color: '#722ed1', fontWeight: 'bold' }}>
            ₺{price.toFixed(2)}
            <div style={{ fontSize: '10px', color: '#999' }}>
              (With VAT)
            </div>
          </div>
        );
      },
    },

    {
      title: (
        <div>
          <div>Buying Price</div>
          <div style={{ fontSize: '12px', color: '#666' }}>w/o VAT</div>
        </div>
      ),
      dataIndex: 'buyingPriceWithoutVat',
      key: 'buyingPriceWithoutVat',
      width: 160,
      align: 'center' as const,
      render: (price: number | null | undefined) => {
        if (price === null || price === undefined) {
          return (
            <div style={{ color: '#999', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>
              No data
            </div>
          );
        }
        return (
          <div style={{ color: '#13c2c2', fontWeight: 'bold' }}>
            ₺{price.toFixed(2)}
            <div style={{ fontSize: '10px', color: '#999' }}>
              (Without VAT)
            </div>
          </div>
        );
      },
    },
    {
      title: 'Getir Unit Price',
      dataIndex: 'getirUnitPrice',
      key: 'getirUnitPrice',
      width: 140,
      align: 'center' as const,
      render: (price: number, record: any) => {
        if (price === null || price === undefined) {
          if (!record.hasApiLocation && !record.hasIndexValue) {
            return (
              <div style={{ color: '#999', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>
                No location & index set
              </div>
            );
          } else if (!record.hasApiLocation) {
            return (
              <div style={{ color: '#999', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>
                No API location set
              </div>
            );
          } else if (!record.hasIndexValue) {
            return (
              <div style={{ color: '#999', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>
                No index value set
              </div>
            );
          }
        }
        return (
          <div style={{ color: '#1890ff', fontWeight: 'bold' }}>
            ₺{price.toFixed(2)}
            <div style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>
              (Calculated)
            </div>
          </div>
        );
      },
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      width: 140,
      align: 'center' as const,
      render: (value: any, record: any) => {
        const getirPrice = record.getirUnitPrice;
        const buyingPrice = record.buyingPrice;
        
        if (getirPrice === null || getirPrice === undefined) {
          return (
            <div style={{ color: '#999', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>
              No Getir price
            </div>
          );
        }
        
        if (buyingPrice === null || buyingPrice === undefined) {
          return (
            <div style={{ color: '#999', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>
              No buying price
            </div>
          );
        }
        
        const profit = getirPrice - buyingPrice;
        const profitMargin = (profit / buyingPrice * 100).toFixed(1);
        const isPositive = profit >= 0;
        
        return (
          <div>
            <div style={{ color: isPositive ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
              ₺{profit.toFixed(2)}
            </div>
            <div style={{ fontSize: '10px', color: isPositive ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
              {profitMargin}%
            </div>
            <div style={{ fontSize: '10px', color: '#999' }}>
              (Margin)
            </div>
          </div>
        );
      },
    },
    {
      title: 'Competitor Price',
      dataIndex: 'competitorPrice',
      key: 'competitorPrice',
      width: 140,
      align: 'center' as const,
      render: (price: number, record: any) => {
        if (price === null || price === undefined) {
          return (
            <div style={{ color: '#999', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>
              No API location set
            </div>
          );
        }
        
        const struckPrice = record.struckPrice;
        const hasStruckPrice = struckPrice !== null && struckPrice !== undefined;
        
        return (
          <div style={{ color: hasStruckPrice ? '#ff4d4f' : '#666', textDecoration: hasStruckPrice ? 'line-through' : 'none' }}>
            ₺{price.toFixed(2)}
            <div style={{ fontSize: '10px', color: '#999' }}>
              (From API)
            </div>
          </div>
        );
      },
    },
    {
      title: 'Disc.',
      dataIndex: 'isDiscounted',
      key: 'isDiscounted',
      width: 80,
      align: 'center' as const,
      render: (isDiscounted: boolean) => {
        return (
          <Tag color={isDiscounted ? 'green' : 'default'}>
            {isDiscounted ? 'Yes' : 'No'}
          </Tag>
        );
      },
    },
    {
      title: 'Struck Price (Original)',
      dataIndex: 'struckPrice',
      key: 'struckPrice',
      width: 140,
      align: 'center' as const,
      render: (struckPrice: number | null, record: any) => {
        if (struckPrice === null || struckPrice === undefined) {
          return (
            <div style={{ color: '#999', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>
              No struck price
            </div>
          );
        }
        
        const currentPrice = record.competitorPrice;
        const percentageDiff = currentPrice ? ((currentPrice - struckPrice) / currentPrice * 100).toFixed(1) : '0.0';
        
        return (
          <div>
            <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
              ₺{struckPrice.toFixed(2)}
            </div>
            <div style={{ fontSize: '10px', color: '#52c41a', fontWeight: 'bold' }}>
              {percentageDiff}%
            </div>
            <div style={{ fontSize: '10px', color: '#999' }}>
              (Original)
            </div>
          </div>
        );
      },
    },
    {
      title: 'Discount Rate (%)',
      dataIndex: 'discountRate',
      key: 'discountRate',
      width: 150,
      align: 'center' as const,
      render: (value: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'center' }}>
          <Input
            value={discountRates[record.key] || ''}
            placeholder="0"
            style={{ 
              textAlign: 'center', 
              width: '70px',
              padding: '4px 8px',
              boxSizing: 'border-box'
            }}
            size="small"
            onChange={(e) => handleDiscountRateChange(record.key, e.target.value)}
            type="number"
            min={0}
            step={0.1}
          />
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            style={{ padding: '0 4px', height: '24px', minWidth: '24px' }}
            onClick={() => {
              const currentValue = discountRates[record.key] || 0;
              handleApplyDiscountToAll(currentValue);
            }}
            title="Apply to all visible products"
          />
          <Button
            size="small"
            type="default"
            icon={<ClearOutlined />}
            style={{ padding: '0 4px', height: '24px', minWidth: '24px' }}
            onClick={handleClearDiscountToAll}
            title="Clear all visible products"
          />
        </div>
      ),
    },
    {
      title: 'Struck Price (Calculated)',
      dataIndex: 'struckPriceCalculated',
      key: 'struckPriceCalculated',
      width: 140,
      align: 'center' as const,
      render: (value: any, record: any) => {
        const getirPrice = record.getirUnitPrice;
        const discountRate = discountRates[record.key] || 0;
        
        if (getirPrice === null || getirPrice === undefined) {
          return (
            <div style={{ color: '#999', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>
              No Getir price
            </div>
          );
        }
        
        const rawStruckPrice = getirPrice * (1 - discountRate / 100);
        const struckPrice = applyGetirRounding(rawStruckPrice);
        
        return (
          <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
            ₺{struckPrice.toFixed(2)}
            {discountRate > 0 && (
              <div style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>
                (-{discountRate}%)
              </div>
            )}
          </div>
        );
      },
    },
  ];

  // Filter columns based on visibility, ensuring always-visible columns are included
  const visibleProductColumns = productColumns.filter(column => 
    visibleColumns.has(column.key) || ALL_COLUMNS.find(col => col.key === column.key)?.alwaysVisible
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Index</Title>
        </Col>
      </Row>

      {/* Sales Channel Tabs */}
      <Tabs 
        activeKey={activeChannel} 
        onChange={handleChannelChange}
        items={salesChannelItems}
        style={{ marginBottom: '16px' }}
      />

      {/* Index Chart Card */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Title level={4} style={{ margin: 0 }}>Index Chart</Title>
          <Text type="secondary">Select a matrix cell to view product list with chosen index</Text>
        </div>

        {/* Competitor Tabs */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={competitorItems}
        />

        {/* Index Matrix */}
        <ClientOnlyTable
          dataSource={indexData}
          columns={indexColumns}
          pagination={false}
          size="small"
          bordered
          style={{ marginTop: '16px' }}
          rowKey="key"
        />
      </Card>

      {/* Product List */}
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>Product List</Title>
            <Text type="secondary">
              Getir prices are automatically calculated using Index Chart values. KVI Label is internal Getir classification.
            </Text>
          </Col>
          <Col>
            <Space>
              <Dropdown 
                menu={{ items: columnSelectorItems }} 
                trigger={['click']}
                placement="bottomRight"
              >
                <Button 
                  icon={<SettingOutlined />}
                  title="Customize columns"
                  type={visibleColumns.size === 0 ? 'primary' : 'default'}
                  danger={visibleColumns.size === 0}
                >
                  Columns ({preferencesLoaded ? visibleColumns.size : ALL_COLUMNS.filter(col => col.defaultVisible).length}/{ALL_COLUMNS.length})
                </Button>
              </Dropdown>
              <Dropdown 
                menu={{ items: exportMenuItems }} 
                trigger={['click']}
              >
                <Button 
                  type="primary" 
                  icon={<ExportOutlined />}
                  style={{ background: '#7C3AED' }}
                >
                  {selectedRowKeys.length > 0 
                    ? `Export ${selectedRowKeys.length} selected` 
                    : 'Export'
                  } <DownOutlined />
                </Button>
              </Dropdown>
            </Space>
          </Col>
        </Row>

        {/* Selection Summary */}
        {selectedRowKeys.length > 0 && (
          <Row
            justify="space-between"
            align="middle"
            style={{
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: '#f0f2f5',
              borderRadius: '6px'
            }}
          >
            <Col>
              <span style={{ fontWeight: 500 }}>
                {selectedRowKeys.length} item{selectedRowKeys.length > 1 ? 's' : ''} selected
              </span>
            </Col>
            <Col>
              <Button
                onClick={() => setSelectedRowKeys([])}
              >
                Clear Selection
              </Button>
            </Col>
          </Row>
        )}

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={4}>
            <Input 
              placeholder="Search products..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select 
              placeholder="Category" 
              style={{ width: '100%' }}
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <Option value="all">All Categories</Option>
              {uniqueCategories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select 
              placeholder="Sub Category" 
              style={{ width: '100%' }}
              value={selectedSubCategory}
              onChange={setSelectedSubCategory}
            >
              <Option value="all">All Sub Categories</Option>
              {availableSubCategories.map((subCategory: string) => (
                <Option key={subCategory} value={subCategory}>
                  {subCategory}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select 
              placeholder="Competitor" 
              style={{ width: '100%' }}
              value={selectedCompetitorFilter}
              onChange={setSelectedCompetitorFilter}
            >
              <Option value="all">All Competitors</Option>
              {competitors.map(competitor => (
                <Option key={competitor.id} value={competitor.id}>
                  {competitor.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select 
              placeholder="Discounted" 
              style={{ width: '100%' }}
              value={selectedDiscountedFilter}
              onChange={setSelectedDiscountedFilter}
            >
              <Option value="all">All Products</Option>
              <Option value="discounted">Discounted Only</Option>
              <Option value="not-discounted">Not Discounted</Option>
            </Select>
          </Col>
        </Row>

        {/* Product Table */}
        {(preferencesLoaded ? visibleColumns.size : ALL_COLUMNS.filter(col => col.defaultVisible).length) === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '6px',
            border: '1px dashed #d9d9d9'
          }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              No columns selected. Please select at least one column to view the product list.
            </Text>
            <br />
            <Button 
              type="primary" 
              onClick={resetToDefaultColumns}
              style={{ marginTop: '16px' }}
            >
              Reset to Default Columns
            </Button>
          </div>
        ) : (
          <ClientOnlyTable
            dataSource={filteredProductData}
            columns={visibleProductColumns}
            rowSelection={{
              selectedRowKeys,
              onChange: (newSelectedRowKeys) => {
                setSelectedRowKeys(newSelectedRowKeys);
              },
              preserveSelectedRowKeys: true,
            }}
            pagination={{
              total: filteredProductData.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ x: 1000 }}
            rowKey="key"
          />
        )}
      </Card>
    </div>
  );
};

export default IndexPage; 