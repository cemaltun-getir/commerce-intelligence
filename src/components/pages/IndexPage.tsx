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
  Space,
  App
} from 'antd';
import { EditOutlined, ExportOutlined, DownOutlined, CopyOutlined } from '@ant-design/icons';
import { exportProductMatches } from '@/utils/exportUtils';
import { useAppStore } from '@/store/useAppStore';
import { productPriceApi } from '@/utils/productPriceApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { useApp } = App;

const IndexPage: React.FC = () => {
  const { message } = useApp();
  const [activeTab, setActiveTab] = useState('migros');
  const [activeChannel, setActiveChannel] = useState('getir');
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [selectedCompetitorFilter, setSelectedCompetitorFilter] = useState('all');
  
  // Connect to store
  const { 
    segments, 
    indexValues,
    competitors,
    fetchSegments,
    fetchIndexValues, 
    updateIndexValue,
    activeSalesChannel,
    setActiveSalesChannel 
  } = useAppStore();

  // Fetch segments and index values on component mount
  useEffect(() => {
    fetchSegments();
    fetchIndexValues();
  }, [fetchSegments, fetchIndexValues]);

  // Update local state when store changes
  useEffect(() => {
    setActiveChannel(activeSalesChannel);
  }, [activeSalesChannel]);

  const handleChannelChange = (channel: string) => {
    setActiveChannel(channel);
    setActiveSalesChannel(channel as 'getir' | 'getirbuyuk');
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

  // Calculate Getir Unit Price based on competitor price and index value
  // Now location-aware - prices vary by segment's API location
  const calculateGetirPrice = (competitorPrice: number, indexValue: number, segmentApiLocation?: string): number => {
    // If no API location, cannot calculate price
    if (!segmentApiLocation) {
      return 0; // Will be handled as null in the calling code
    }

    // Apply location-based pricing adjustment first
    const locationAdjustedPrice = getLocationBasedPrice(competitorPrice, segmentApiLocation);
    
    // Then apply index value calculation
    // Index value represents percentage relative to competitor
    // 100 = same price, 105 = 5% higher, 95 = 5% lower
    const basePrice = locationAdjustedPrice * (indexValue / 100);
    
    // Get integer and decimal parts
    const integerPart = Math.floor(basePrice);
    const decimalPart = basePrice - integerPart;
    
    // Apply special rounding logic for Getir prices
    if (decimalPart === 0) {
      // Keep whole numbers as is
      return Number(basePrice.toFixed(2));
    } else if (decimalPart < 0.5) {
      // Round to x.5 for decimal values under x.5
      return integerPart + 0.5;
    } else {
      // Round to x.99 for decimal values over x.5 (including 0.5)
      return integerPart + 0.99;
    }
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

  // Save calculated prices to database
  const saveCalculatedPrices = async () => {
    try {
      const pricesToSave = filteredProductData
        .filter(product => {
          const segment = segments.find(s => s.id === product.segmentId);
          return segment?.apiLocation && product.competitorPrice && product.calculatedPrice;
        })
        .map(product => {
          const segment = segments.find(s => s.id === product.segmentId)!; // Safe because we filtered above
          return {
            productId: product.id.split('_')[0], // Remove segment suffix from ID
            segmentId: product.segmentId,
            competitorId: product.competitorId,
            competitorPrice: product.competitorPrice,
            calculatedPrice: product.getirUnitPrice,
            indexValue: product.ix,
            salesChannel: activeChannel as 'getir' | 'getirbuyuk',
            apiLocation: segment.apiLocation!, // Safe because we filtered above
            lastUpdated: new Date().toISOString()
          };
        });

      // Save to database via API
      await productPriceApi.saveBatch(pricesToSave);
      
      message.success(`Successfully saved ${pricesToSave.length} calculated prices to database`);
    } catch (error) {
      message.error('Failed to save calculated prices to database');
      console.error('Error saving prices:', error);
    }
  };

  // Get competitor display name by ID
  const getCompetitorDisplayName = useCallback((competitorId: string): string => {
    const competitor = competitors.find(c => c.id === competitorId);
    return competitor?.displayName || competitorId;
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
    const baseProductData = [
      {
        id: 'prd_64e23a1c5d9ef1204abcde1',
        getirProductName: 'Soke Un 1kg',
        competitorId: 'sok',
        kviLabel: 96, // SKVI level - same for all competitors
        competitorPrice: 21, // From API
        category: 'Bakery',
        subCategory: 'Flour',
      },
      {
        id: 'prd_64e23a1c5d9ef1204abcde2',
        getirProductName: 'Soke Un 1kg',
        competitorId: 'carrefour',
        kviLabel: 96, // SKVI level - same as above (internal Getir classification)
        competitorPrice: 22.5, // Different competitor price
        category: 'Bakery',
        subCategory: 'Flour',
      },
      {
        id: 'prd_60b7c4f3af125812i9d3aa4',
        getirProductName: 'Coca Cola 330ml x2',
        competitorId: 'sok',
        kviLabel: 92, // KVI level
        competitorPrice: 110, // From API
        category: 'Beverages',
        subCategory: 'Soft Drinks',
      },
      {
        id: 'prd_71c8d5e4bf236923j0e4bb5',
        getirProductName: 'Basic Bread 500g',
        competitorId: 'migros',
        kviLabel: 30, // Background level
        competitorPrice: 4.5, // From API
        category: 'Bakery',
        subCategory: 'Bread',
      },
      {
        id: 'prd_82d9e6f5cg347034k1f5cc6',
        getirProductName: 'Milk 1L',
        competitorId: 'carrefour',
        kviLabel: 88, // Foreground level
        competitorPrice: 11.9, // From API
        category: 'Dairy',
        subCategory: 'Milk',
      },
      {
        id: 'prd_93e0f7g6dh458145l2g6dd7',
        getirProductName: 'Pasta 500g',
        competitorId: 'migros',
        kviLabel: 45, // Background level
        competitorPrice: 8.0, // From API
        category: 'Pantry',
        subCategory: 'Pasta',
      },
    ];

    // Generate products for each segment-competitor combination
    const expandedProductData: any[] = [];
    let keyCounter = 1;

    baseProductData.forEach(baseProduct => {
      segments.forEach((segment, segmentIndex) => {
        const kviType = getKviTypeFromLabel(baseProduct.kviLabel);
        const ix = getIndexValue(segment.id, kviType, baseProduct.competitorId, activeChannel);
        
        // Apply location-based adjustment to competitor price for this segment
        // If no apiLocation is set, don't show any price
        const locationAdjustedCompetitorPrice = segment.apiLocation 
          ? getLocationBasedPrice(baseProduct.competitorPrice, segment.apiLocation)
          : null;
        
        // Calculate Getir Unit Price based on location-adjusted competitor price and index value
        // Only calculate if IX value exists (not null for new segments) AND segment has apiLocation
        const calculatedGetirPrice = (ix !== null && segment.apiLocation) 
          ? calculateGetirPrice(baseProduct.competitorPrice, ix, segment.apiLocation) 
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
          hasApiLocation: !!segment.apiLocation,
          hasIndexValue: ix !== null,
        });
        keyCounter++;
      });
    });

    return expandedProductData;
  }, [segments, getKviTypeFromLabel, getIndexValue, activeChannel, getCompetitorDisplayName, calculateGetirPrice]);

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
    
    return filtered;
  }, [productData, searchText, selectedCategory, selectedSubCategory, selectedCompetitorFilter]);

  const handleExport = (format: 'csv' | 'xlsx') => {
    // Ask user if they want to export all products or just filtered results
    if (filteredProductData.length !== productData.length) {
      // If there are filters applied, ask what to export
      const exportAll = window.confirm(
        `Do you want to export all ${productData.length} products or just the ${filteredProductData.length} filtered results?\n\n` +
        `Click "OK" to export all products, or "Cancel" to export only filtered results.`
      );
      
      if (exportAll) {
    exportProductMatches(productData, format);
      } else {
        exportProductMatches(filteredProductData, format);
      }
    } else {
      // No filters applied, export all
      exportProductMatches(filteredProductData, format);
    }
  };

  const exportMenuItems = [
    {
      key: 'csv',
      label: 'Export as CSV',
      onClick: () => handleExport('csv'),
    },
    {
      key: 'xlsx', 
      label: 'Export as Excel',
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

  // Competitor tabs items  
  const competitorItems = [
    {
      key: 'migros',
      label: 'Migros',
    },
    {
      key: 'carrefour',
      label: 'Carrefour', 
    },
    {
      key: 'sok',
      label: 'ŞOK',
    },
  ];

  // Dynamic index matrix columns
  const createIndexColumns = () => {
    const baseColumns = [
    {
      title: '',
      dataIndex: 'label',
      key: 'label',
      width: 150,
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
              max={100}
            />
          );
        },
      };
    });

    return [...baseColumns, ...segmentColumns];
  };

  const indexColumns = createIndexColumns();

  // Product list columns
  const productColumns = [
    {
      title: 'Getir Product Name',
      dataIndex: 'getirProductName',
      key: 'getirProductName',
      width: 200,
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
        return (
          <div style={{ color: '#666' }}>
            ₺{price.toFixed(2)}
            <div style={{ fontSize: '10px', color: '#999' }}>
              (From API)
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Index</Title>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            style={{ background: '#7C3AED' }}
          >
            Edit
          </Button>
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
        <Table
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
              <Button 
                type="default"
                onClick={saveCalculatedPrices}
                style={{ marginRight: '8px' }}
              >
                Save Calculated Prices
              </Button>
            <Dropdown 
              menu={{ items: exportMenuItems }} 
              trigger={['click']}
            >
              <Button 
                type="primary" 
                icon={<ExportOutlined />}
                style={{ background: '#7C3AED' }}
              >
                Export <DownOutlined />
              </Button>
            </Dropdown>
            </Space>
          </Col>
        </Row>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={6}>
            <Input 
              placeholder="Search products..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select 
              placeholder="Category" 
              style={{ width: '100%' }}
              value={selectedCategory}
              onChange={setSelectedCategory}
            >
              <Option value="all">All Categories</Option>
              <Option value="Beverages">Beverages</Option>
              <Option value="Bakery">Bakery</Option>
              <Option value="Dairy">Dairy</Option>
              <Option value="Pantry">Pantry</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select 
              placeholder="Sub Category" 
              style={{ width: '100%' }}
              value={selectedSubCategory}
              onChange={setSelectedSubCategory}
            >
              <Option value="all">All Sub Categories</Option>
              <Option value="Soft Drinks">Soft Drinks</Option>
              <Option value="Juices">Juices</Option>
              <Option value="Flour">Flour</Option>
              <Option value="Bread">Bread</Option>
              <Option value="Milk">Milk</Option>
              <Option value="Cheese">Cheese</Option>
              <Option value="Pasta">Pasta</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select 
              placeholder="Competitor" 
              style={{ width: '100%' }}
              value={selectedCompetitorFilter}
              onChange={setSelectedCompetitorFilter}
            >
              <Option value="all">All Competitors</Option>
              <Option value="migros">Migros</Option>
              <Option value="carrefour">Carrefour</Option>
              <Option value="sok">ŞOK</Option>
            </Select>
          </Col>
        </Row>

        {/* Product Table */}
        <Table
          dataSource={filteredProductData}
          columns={productColumns}
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
      </Card>
    </div>
  );
};

export default IndexPage; 