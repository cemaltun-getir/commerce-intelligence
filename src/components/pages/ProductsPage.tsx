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
  Space,
  Switch
} from 'antd';
import { EditOutlined, ExportOutlined, DownOutlined, CopyOutlined, CheckOutlined, ClearOutlined, SettingOutlined, MenuOutlined } from '@ant-design/icons';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
    key: 'sellingPrice',
    title: 'Selling Price',
    width: 140,
    defaultVisible: true,
  },
  {
    key: 'sellingPriceWithoutVat',
    title: 'Selling Price (w/o VAT)',
    width: 160,
    defaultVisible: true,
  },
  {
    key: 'getirUnitPrice',
    title: 'IX Price',
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
    title: 'Competitor Discounted Price',
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
    title: 'Discounted Price (Calculated)',
    width: 140,
    defaultVisible: false,
  },
];

const ProductsPage: React.FC = () => {
  const { message } = useApp();
  const [activeChannel, setActiveChannel] = useState('getir');
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedLevel1, setSelectedLevel1] = useState('all');
  const [selectedLevel2, setSelectedLevel2] = useState('all');
  const [selectedLevel3, setSelectedLevel3] = useState('all');
  const [selectedLevel4, setSelectedLevel4] = useState('all');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('all');
  const [selectedCompetitorFilter, setSelectedCompetitorFilter] = useState('all');
  const [selectedDiscountedFilter, setSelectedDiscountedFilter] = useState(false);
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState('all');
  const [selectedKviLabelFilter, setSelectedKviLabelFilter] = useState('all');
  
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
  
  // Column order state
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    // Always start with default order to avoid hydration mismatch
    const alwaysVisible = ALL_COLUMNS.filter(col => col.alwaysVisible).map(col => col.key);
    const defaultVisible = ALL_COLUMNS.filter(col => col.defaultVisible && !col.alwaysVisible).map(col => col.key);
    const others = ALL_COLUMNS.filter(col => !col.defaultVisible && !col.alwaysVisible).map(col => col.key);
    
    return [...alwaysVisible, ...defaultVisible, ...others];
  });

  // Load saved preferences after component mounts (client-side only)
  useEffect(() => {
    try {
      // Load column visibility preferences
      const savedColumns = localStorage.getItem('product-list-visible-columns');
      if (savedColumns) {
        const parsedColumns = JSON.parse(savedColumns);
        if (Array.isArray(parsedColumns)) {
          setVisibleColumns(new Set(parsedColumns));
        }
      }

      // Load column order preferences
      const savedOrder = localStorage.getItem('product-list-column-order');
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        if (Array.isArray(parsedOrder)) {
          setColumnOrder(parsedOrder);
        }
      }
    } catch (error) {
      console.warn('Failed to load preferences from localStorage:', error);
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
    flattenedCategories,
    loading,
    fetchSegments,
    fetchIndexValues,
    fetchProducts,
    fetchVendors,
    fetchCompetitorPrices,
    fetchCategories,
    fetchSubCategories,
    activeSalesChannel,
    setActiveSalesChannel 
  } = useAppStore();

  // Fetch data on component mount
  useEffect(() => {
    fetchSegments();
    fetchIndexValues();
    fetchProducts();
    fetchVendors();
    fetchCompetitorPrices();
    fetchCategories();
    fetchSubCategories();
  }, [fetchSegments, fetchIndexValues, fetchProducts, fetchVendors, fetchCompetitorPrices, fetchCategories, fetchSubCategories]);

  // Fetch products when category filters change
  useEffect(() => {
    const categoryFilters: {
      category_level1_id?: string;
      category_level2_id?: string;
      category_level3_id?: string;
      category_level4_id?: string;
    } = {};

    if (selectedLevel1 !== 'all') categoryFilters.category_level1_id = selectedLevel1;
    if (selectedLevel2 !== 'all') categoryFilters.category_level2_id = selectedLevel2;
    if (selectedLevel3 !== 'all') categoryFilters.category_level3_id = selectedLevel3;
    if (selectedLevel4 !== 'all') categoryFilters.category_level4_id = selectedLevel4;

    fetchProducts(categoryFilters);
  }, [selectedLevel1, selectedLevel2, selectedLevel3, selectedLevel4, fetchProducts]);

  // Update local state when store changes
  useEffect(() => {
    setActiveChannel(activeSalesChannel);
  }, [activeSalesChannel]);

  const handleChannelChange = (channel: string) => {
    setActiveChannel(channel);
    setActiveSalesChannel(channel as 'getir' | 'getirbuyuk');
  };

  const handleLevel1Change = (value: string) => {
    setSelectedLevel1(value);
    setSelectedLevel2('all');
    setSelectedLevel3('all');
    setSelectedLevel4('all');
  };

  const handleLevel2Change = (value: string) => {
    setSelectedLevel2(value);
    setSelectedLevel3('all');
    setSelectedLevel4('all');
  };

  const handleLevel3Change = (value: string) => {
    setSelectedLevel3(value);
    setSelectedLevel4('all');
  };

  const handleLevel4Change = (value: string) => {
    setSelectedLevel4(value);
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
  // Competitor price is already location-specific from API
  const calculateGetirPrice = (competitorPrice: number, indexValue: number): number => {
    // Index value represents percentage relative to competitor
    // 100 = same price, 105 = 5% higher, 95 = 5% lower
    
    // If index is exactly 100, return competitor price without rounding
    if (indexValue === 100) {
      return competitorPrice;
    }
    
    const basePrice = competitorPrice * (indexValue / 100);
    
    // Apply special rounding logic
    return applyGetirRounding(basePrice);
  };

  // Get competitor display name by ID
  const getCompetitorDisplayName = useCallback((competitorId: string): string => {
    const competitor = competitors.find(c => c.id === competitorId);
    return competitor?.name || competitorId;
  }, [competitors]);

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

  // Create dynamic product data with calculated IX values
  const createProductData = useCallback(() => {
    // Generate products for each segment-competitor combination
    const expandedProductData: any[] = [];
    let keyCounter = 1;

    // Get the IDs of filtered products to ensure we only process price mappings for products that exist
    const filteredProductIds = new Set(products.map(p => p.id));

    segments.forEach((segment, segmentIndex) => {
      // Filter price mappings to only include those that match this segment's price location
      // AND have corresponding products in the filtered products array
      const segmentPriceMappings = competitorPrices.filter(priceMapping => 
        priceMapping.location_id === segment.priceLocation &&
        filteredProductIds.has(priceMapping.sku_id)
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
          // New selling price fields from SKU API
          sellingPrice: product?.selling_price,
          sellingVat: product?.selling_vat,
          sellingPriceWithoutVat: product?.selling_price_without_vat,
        };

        const kviType = getKviTypeFromLabel(baseProduct.kviLabel);
        const ix = getIndexValue(segment.id, kviType, baseProduct.competitorId, activeChannel);
        
        // Calculate Getir Unit Price using location-specific competitor price from API
        // Only calculate if IX value exists (not null for new segments)
        const calculatedGetirPrice = ix !== null 
          ? calculateGetirPrice(baseProduct.competitorPrice, ix) 
          : null;
        
        // Only include products that have index values (restore previous behavior)
        if (ix !== null) {
          expandedProductData.push({
            key: keyCounter.toString(),
            ...baseProduct,
            competitorPrice: baseProduct.competitorPrice, // Use location-specific price from API
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
            // New selling price fields from SKU API
            sellingPrice: baseProduct.sellingPrice,
            sellingVat: baseProduct.sellingVat,
            sellingPriceWithoutVat: baseProduct.sellingPriceWithoutVat,
          });
          keyCounter++;
        }
      });
    });

    return expandedProductData;
  }, [segments, getKviTypeFromLabel, getIndexValue, activeChannel, getCompetitorDisplayName, calculateGetirPrice, competitorPrices, products, competitors]);

  // Make product data reactive to index values, segments, and active channel
  const productData = useMemo(() => {
    return createProductData();
  }, [createProductData]);

  // Filter product data
  const filteredProductData = useMemo(() => {
    let filtered = productData;
    
    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(product => 
        product.getirProductName.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Category filtering is now handled by the API call
    
    // Apply brand filter
    if (selectedBrandFilter && selectedBrandFilter !== 'all') {
      filtered = filtered.filter(product => product.brand === selectedBrandFilter);
    }
    
    // Apply competitor filter
    if (selectedCompetitorFilter && selectedCompetitorFilter !== 'all') {
      filtered = filtered.filter(product => product.competitorId === selectedCompetitorFilter);
    }
    
    // Apply segment filter
    if (selectedSegmentFilter && selectedSegmentFilter !== 'all') {
      filtered = filtered.filter(product => product.segmentId === selectedSegmentFilter);
    }
    
    // Apply KVI label filter
    if (selectedKviLabelFilter && selectedKviLabelFilter !== 'all') {
      filtered = filtered.filter(product => product.kviType === selectedKviLabelFilter);
    }
    
    // Apply discounted filter (switch - when true, show only discounted)
    if (selectedDiscountedFilter) {
      filtered = filtered.filter(product => product.isDiscounted === true);
    }
    
    return filtered;
  }, [productData, searchText, selectedBrandFilter, selectedCompetitorFilter, selectedSegmentFilter, selectedKviLabelFilter, selectedDiscountedFilter]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedRowKeys([]);
  }, [searchText, selectedLevel1, selectedLevel2, selectedLevel3, selectedLevel4, selectedBrandFilter, selectedCompetitorFilter, selectedSegmentFilter, selectedKviLabelFilter, selectedDiscountedFilter]);

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

  // Get level 1 categories (top level)
  const level1Categories = useMemo(() => {
    return categories.map(category => ({
      value: category.id,
      label: category.name
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [categories]);

  // Get level 2 categories based on selected level 1
  const level2Categories = useMemo(() => {
    if (selectedLevel1 === 'all') return [];
    
    const selectedCategory = categories.find(cat => cat.id === selectedLevel1);
    if (!selectedCategory?.children) return [];
    
    return selectedCategory.children.map(category => ({
      value: category.id,
      label: category.name
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [categories, selectedLevel1]);

  // Get level 3 categories based on selected level 1 and 2
  const level3Categories = useMemo(() => {
    if (selectedLevel1 === 'all' || selectedLevel2 === 'all') return [];
    
    const selectedCategory = categories.find(cat => cat.id === selectedLevel1);
    if (!selectedCategory?.children) return [];
    
    const selectedLevel2Category = selectedCategory.children.find(cat => cat.id === selectedLevel2);
    if (!selectedLevel2Category?.children) return [];
    
    return selectedLevel2Category.children.map(category => ({
      value: category.id,
      label: category.name
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [categories, selectedLevel1, selectedLevel2]);

  // Get level 4 categories based on selected level 1, 2, and 3
  const level4Categories = useMemo(() => {
    if (selectedLevel1 === 'all' || selectedLevel2 === 'all' || selectedLevel3 === 'all') return [];
    
    const selectedCategory = categories.find(cat => cat.id === selectedLevel1);
    if (!selectedCategory?.children) return [];
    
    const selectedLevel2Category = selectedCategory.children.find(cat => cat.id === selectedLevel2);
    if (!selectedLevel2Category?.children) return [];
    
    const selectedLevel3Category = selectedLevel2Category.children.find(cat => cat.id === selectedLevel3);
    if (!selectedLevel3Category?.children) return [];
    
    return selectedLevel3Category.children.map(category => ({
      value: category.id,
      label: category.name
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [categories, selectedLevel1, selectedLevel2, selectedLevel3]);

  // Get unique brands from product data
  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    productData.forEach(product => {
      if (product.brand) {
        brands.add(product.brand);
      }
    });
    return Array.from(brands).sort();
  }, [productData]);

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

  // Drag and drop handlers
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    // Prevent moving always-visible columns
    const activeColumn = ALL_COLUMNS.find(col => col.key === active.id);
    const overColumn = ALL_COLUMNS.find(col => col.key === over.id);
    
    if (activeColumn?.alwaysVisible || overColumn?.alwaysVisible) {
      return; // Don't allow moving always-visible columns
    }

    if (active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Save to localStorage
        try {
          localStorage.setItem('product-list-column-order', JSON.stringify(newOrder));
        } catch (error) {
          console.warn('Failed to save column order to localStorage:', error);
        }
        
        return newOrder;
      });
    }
  };

  const resetColumnOrder = () => {
    const alwaysVisible = ALL_COLUMNS.filter(col => col.alwaysVisible).map(col => col.key);
    const defaultVisible = ALL_COLUMNS.filter(col => col.defaultVisible && !col.alwaysVisible).map(col => col.key);
    const others = ALL_COLUMNS.filter(col => !col.defaultVisible && !col.alwaysVisible).map(col => col.key);
    
    const defaultOrder = [...alwaysVisible, ...defaultVisible, ...others];
    setColumnOrder(defaultOrder);
    
    // Save to localStorage
    try {
      localStorage.setItem('product-list-column-order', JSON.stringify(defaultOrder));
    } catch (error) {
      console.warn('Failed to save column order to localStorage:', error);
    }
  };

  // Sortable column component
  const SortableColumn = ({ columnKey, children }: { columnKey: string; children: React.ReactNode }) => {
    const column = ALL_COLUMNS.find(col => col.key === columnKey);
    const isAlwaysVisible = column?.alwaysVisible;
    
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ 
      id: columnKey,
      disabled: isAlwaysVisible // Disable dragging for always-visible columns
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} {...(isAlwaysVisible ? {} : attributes)} {...(isAlwaysVisible ? {} : listeners)}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px', 
          cursor: isAlwaysVisible ? 'default' : 'grab' 
        }}>
          {!isAlwaysVisible && <MenuOutlined style={{ fontSize: '12px', color: '#999' }} />}
          {children}
        </div>
      </div>
    );
  };

  // Column selector dropdown items
  const columnSelectorItems = [
    {
      key: 'header',
      label: (
        <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', marginBottom: '8px' }}>
          <Text strong>Column Settings</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {preferencesLoaded ? visibleColumns.size : ALL_COLUMNS.filter(col => col.defaultVisible).length} of {ALL_COLUMNS.length} columns visible
          </Text>
        </div>
      ),
      disabled: true,
    },
    {
      key: 'column-order-header',
      label: (
        <div style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0', marginBottom: '8px' }}>
          <Text strong style={{ fontSize: '12px' }}>Column Order</Text>
        </div>
      ),
      disabled: true,
    },
    {
      key: 'reset-order',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Reset Column Order</span>
          <Tag color="blue" style={{ fontSize: '11px', padding: '0 4px' }}>Default</Tag>
        </div>
      ),
      onClick: resetColumnOrder,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'visibility-header',
      label: (
        <div style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0', marginBottom: '8px' }}>
          <Text strong style={{ fontSize: '12px' }}>Column Visibility</Text>
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

  // Product list columns
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
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: 140,
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
          <div>Selling Price</div>
          <div style={{ fontSize: '12px', color: '#666' }}>w/o VAT</div>
        </div>
      ),
      dataIndex: 'sellingPriceWithoutVat',
      key: 'sellingPriceWithoutVat',
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
      title: 'IX Price',
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
      title: 'Competitor Discounted Price',
      dataIndex: 'struckPrice',
      key: 'struckPrice',
      width: 140,
      align: 'center' as const,
      render: (struckPrice: number | null, record: any) => {
        if (struckPrice === null || struckPrice === undefined) {
          return (
            <div style={{ color: '#999', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>
              No discounted price
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
      title: 'Discounted Price (Calculated)',
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
        
        // Only calculate and show discounted price if there's an actual discount
        if (discountRate === 0) {
          return (
            <div style={{ color: '#999', fontStyle: 'italic', fontSize: '11px', textAlign: 'center' }}>
              No discount
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

  // Filter and sort columns based on visibility and order
  const visibleProductColumns = useMemo(() => {
    // First filter visible columns
    const filteredColumns = productColumns.filter(column => 
      visibleColumns.has(column.key) || ALL_COLUMNS.find(col => col.key === column.key)?.alwaysVisible
    );
    
    // Then sort by column order
    return filteredColumns.sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.key);
      const bIndex = columnOrder.indexOf(b.key);
      return aIndex - bIndex;
    });
  }, [productColumns, visibleColumns, columnOrder]);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Products</Title>
          <Text type="secondary">
            Product list with calculated Getir prices. Prices are automatically calculated using index values from the Indexes page.
          </Text>
        </Col>
      </Row>

      {/* Sales Channel Tabs */}
      <Tabs 
        activeKey={activeChannel} 
        onChange={handleChannelChange}
        items={salesChannelItems}
        style={{ marginBottom: '16px' }}
      />

      {/* Product List */}
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>Product List</Title>
            <Text type="secondary">
              Getir prices are automatically calculated using Index values. KVI Label is internal Getir classification.
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
        <Row gutter={[8, 8]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Input 
              placeholder="Search products..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={12} sm={6} md={4} lg={2}>
            <Select 
              placeholder="Level 1" 
              style={{ width: '100%' }}
              value={selectedLevel1}
              onChange={handleLevel1Change}
              size="large"
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">Level 1</Option>
              {level1Categories.map(category => (
                <Option key={category.value} value={category.value}>
                  {category.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4} lg={2}>
            <Select 
              placeholder="Level 2" 
              style={{ width: '100%' }}
              value={selectedLevel2}
              onChange={handleLevel2Change}
              disabled={selectedLevel1 === 'all'}
              size="large"
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">Level 2</Option>
              {level2Categories.map(category => (
                <Option key={category.value} value={category.value}>
                  {category.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4} lg={2}>
            <Select 
              placeholder="Level 3" 
              style={{ width: '100%' }}
              value={selectedLevel3}
              onChange={handleLevel3Change}
              disabled={selectedLevel2 === 'all'}
              size="large"
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">Level 3</Option>
              {level3Categories.map(category => (
                <Option key={category.value} value={category.value}>
                  {category.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4} lg={2}>
            <Select 
              placeholder="Level 4" 
              style={{ width: '100%' }}
              value={selectedLevel4}
              onChange={handleLevel4Change}
              disabled={selectedLevel3 === 'all'}
              size="large"
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">Level 4</Option>
              {level4Categories.map(category => (
                <Option key={category.value} value={category.value}>
                  {category.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4} lg={2}>
            <Select 
              placeholder="Brand" 
              style={{ width: '100%' }}
              value={selectedBrandFilter}
              onChange={setSelectedBrandFilter}
              size="large"
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">Brand</Option>
              {uniqueBrands.map(brand => (
                <Option key={brand} value={brand}>
                  {brand}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4} lg={2}>
            <Select 
              placeholder="Competitor" 
              style={{ width: '100%' }}
              value={selectedCompetitorFilter}
              onChange={setSelectedCompetitorFilter}
              size="large"
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">Competitor</Option>
              {competitors.map(competitor => (
                <Option key={competitor.id} value={competitor.id}>
                  {competitor.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4} lg={2}>
            <Select 
              placeholder="Segment" 
              style={{ width: '100%' }}
              value={selectedSegmentFilter}
              onChange={setSelectedSegmentFilter}
              size="large"
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">Segment</Option>
              {segments.map(segment => (
                <Option key={segment.id} value={segment.id}>
                  {segment.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4} lg={2}>
            <Select 
              placeholder="KVI Label" 
              style={{ width: '100%' }}
              value={selectedKviLabelFilter}
              onChange={setSelectedKviLabelFilter}
              size="large"
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">KVI Label</Option>
              <Option value="SKVI">SKVI</Option>
              <Option value="KVI">KVI</Option>
              <Option value="Foreground">Foreground</Option>
              <Option value="Background">Background</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4} lg={2}>
            <div style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
              <Switch 
                checked={selectedDiscountedFilter}
                onChange={setSelectedDiscountedFilter}
              />
              <span style={{ marginLeft: '8px', whiteSpace: 'nowrap' }}>Discounted</span>
            </div>
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleProductColumns.map(col => col.key)}
              strategy={verticalListSortingStrategy}
            >
              <ClientOnlyTable
                dataSource={filteredProductData}
                columns={visibleProductColumns.map(column => ({
                  ...column,
                  title: (
                    <SortableColumn columnKey={column.key}>
                      {column.title}
                    </SortableColumn>
                  ),
                }))}
                loading={loading}
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
            </SortableContext>
          </DndContext>
        )}
      </Card>
    </div>
  );
};

export default ProductsPage;
