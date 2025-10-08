'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Typography, 
  Tabs, 
  Input, 
  Row,
  Col,
  Card,
  Button,
  Tag,
} from 'antd';
import { SearchOutlined, EditOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import ClientOnlyTable from '../common/ClientOnlyTable';

const { Title, Text } = Typography;

const IndexesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('');
  const [activeChannel, setActiveChannel] = useState('getir');
  
  // Search and filter state
  const [searchText, setSearchText] = useState('');
  
  // Edit mode state for index table
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, number>>({});
  
  // Connect to store
  const { 
    segments, 
    indexValues,
    competitors,
    loading,
    fetchSegments,
    fetchIndexValues,
    fetchVendors,
    updateIndexValue,
    activeSalesChannel,
    setActiveSalesChannel 
  } = useAppStore();

  // Fetch segments, index values, and vendors on component mount
  useEffect(() => {
    fetchSegments();
    fetchIndexValues();
    fetchVendors();
  }, [fetchSegments, fetchIndexValues, fetchVendors]);

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

  // Handle entering edit mode
  const handleEditMode = () => {
    // Store original values before editing
    const original: Record<string, number> = {};
    indexData.forEach(segment => {
      const kviTypes = ['SKVI', 'KVI', 'Background', 'Foreground'] as const;
      kviTypes.forEach(kviType => {
        const changeKey = `${segment.segmentId}-${kviType}-${activeTab}-${activeChannel}`;
        const existingValue = indexValues.find(iv => 
          iv.segmentId === segment.segmentId &&
          iv.kviType === kviType &&
          iv.competitorId === activeTab &&
          iv.salesChannel === activeChannel
        );
        original[changeKey] = existingValue?.value ?? 0;
      });
    });
    setOriginalValues(original);
    setPendingChanges({});
    setIsEditMode(true);
  };

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setPendingChanges({});
    setOriginalValues({});
  };

  // Handle saving changes
  const handleSaveChanges = () => {
    // Apply all pending changes
    Object.entries(pendingChanges).forEach(([changeKey, value]) => {
      const [segmentId, kviType, competitorId, salesChannel] = changeKey.split('-');
      updateIndexValue(segmentId, kviType as 'SKVI' | 'KVI' | 'Background' | 'Foreground', competitorId, value);
    });
    
    setIsEditMode(false);
    setPendingChanges({});
    setOriginalValues({});
  };

  // Create dynamic index data from segments and indexValues
  const createIndexData = () => {
    const kviTypes = ['SKVI', 'KVI', 'Background', 'Foreground'] as const;

    return segments.map((segment, index) => {
      const row: Record<string, string | number> = {
        key: segment.id,
        segmentName: segment.name || `Segment #${index + 1}`,
        segmentId: segment.id,
      };

      // Add a column for each KVI type
      kviTypes.forEach(kviType => {
        // Find existing index value for this combination
        const existingValue = indexValues.find(iv => 
          iv.segmentId === segment.id &&
          iv.kviType === kviType &&
          iv.competitorId === activeTab &&
          iv.salesChannel === activeChannel
        );

        row[kviType.toLowerCase()] = existingValue?.value ?? ''; // Default to empty string for new segments (empty state)
      });

      return row;
    });
  };

  const indexData = createIndexData();

  // Filter index data based on search text
  const filteredIndexData = useMemo(() => {
    if (!searchText) {
      return indexData;
    }
    
    return indexData.filter(item => 
      (item.segmentName as string).toLowerCase().includes(searchText.toLowerCase())
    );
  }, [indexData, searchText]);

  // Handle index value change
  const handleIndexValueChange = (
    value: string, 
    segmentId: string, 
    kviType: 'SKVI' | 'KVI' | 'Background' | 'Foreground'
  ) => {
    const numericValue = parseFloat(value) || 0;
    const changeKey = `${segmentId}-${kviType}-${activeTab}-${activeChannel}`;
    
    if (isEditMode) {
      // In edit mode, track pending changes
      setPendingChanges(prev => ({
        ...prev,
        [changeKey]: numericValue
      }));
    } else {
      // Not in edit mode, save immediately (fallback)
      updateIndexValue(segmentId, kviType, activeTab, numericValue);
    }
  };

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
    const kviTypes = ['SKVI', 'KVI', 'Background', 'Foreground'] as const;
    const kviLabels = {
      'SKVI': 'SKVI',
      'KVI': 'KVI', 
      'Background': 'Background (BG)',
      'Foreground': 'Foreground (FG)'
    };

    const baseColumns = [
      {
        title: 'Segment',
        dataIndex: 'segmentName',
        key: 'segmentName',
        width: 200,
        fixed: 'left' as const,
        render: (text: string) => <Text strong>{text}</Text>,
      }
    ];

    // Add a column for each KVI type
    const kviColumns = kviTypes.map(kviType => {
      const kviKey = kviType.toLowerCase();
      return {
        title: kviLabels[kviType],
        dataIndex: kviKey,
        key: kviKey,
        width: 150,
        align: 'center' as const,
        render: (value: number | string, record: Record<string, string | number>) => {
          const segmentId = record.segmentId as string;
          const changeKey = `${segmentId}-${kviType}-${activeTab}-${activeChannel}`;
          
          // Use pending change value if in edit mode, otherwise use original value
          const displayValue = isEditMode && pendingChanges[changeKey] !== undefined 
            ? pendingChanges[changeKey] 
            : value;
          
          return (
            <Input 
              value={displayValue === '' ? '' : displayValue} 
              placeholder="100"
              style={{ textAlign: 'center', width: '100px' }}
              size="small"
              onChange={(e) => handleIndexValueChange(e.target.value, segmentId, kviType)}
              type="number"
              min={0}
              step={1}
              readOnly={!isEditMode}
              disabled={!isEditMode}
            />
          );
        },
      };
    });

    return [...baseColumns, ...kviColumns];
  };

  const indexColumns = createIndexColumns();

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Indexes</Title>
          <Text type="secondary">
            Manage index values for different segments and competitors. Index values are used to calculate Getir prices relative to competitor prices.
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

      {/* Index Chart Card */}
      <Card>
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, paddingRight: '16px' }}>
              <Title level={4} style={{ margin: 0 }}>
                Index Values by Segment
                {isEditMode && (
                  <Tag color="green" style={{ marginLeft: '8px', fontSize: '12px' }}>
                    Edit Mode
                  </Tag>
                )}
              </Title>
              <Text type="secondary">
                {isEditMode 
                  ? 'Click on matrix cells to edit index values. Changes are saved automatically.'
                  : 'Set index values for each segment across different KVI types. Each row represents a segment, and each column represents a KVI type. Values represent percentage relative to competitor prices.'
                }
              </Text>
            </div>
            <div style={{ flexShrink: 0 }}>
              {!isEditMode ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={handleEditMode}
                  style={{ 
                    backgroundColor: '#7C3AED',
                    borderColor: '#7C3AED'
                  }}
                >
                  Edit
                </Button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    onClick={handleCancelEdit}
                    style={{ 
                      backgroundColor: '#7C3AED',
                      borderColor: '#7C3AED',
                      color: 'white'
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleSaveChanges}
                    style={{ 
                      backgroundColor: '#7C3AED',
                      borderColor: '#7C3AED'
                    }}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Competitor Tabs */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={competitorItems}
        />

        {/* Search Filter */}
        <Row gutter={16} style={{ marginTop: '16px', marginBottom: '16px' }}>
          <Col span={6}>
            <Input 
              placeholder="Search segments..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={18}>
            <Text type="secondary" style={{ lineHeight: '32px' }}>
              {filteredIndexData.length} of {indexData.length} segments
            </Text>
          </Col>
        </Row>

        {/* Index Matrix */}
        {filteredIndexData.length === 0 && searchText ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '6px',
            border: '1px dashed #d9d9d9'
          }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              No segments found matching &quot;{searchText}&quot;
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Try adjusting your search terms
            </Text>
          </div>
        ) : (
          <ClientOnlyTable
            dataSource={filteredIndexData}
            columns={indexColumns}
            loading={loading}
            pagination={{
              total: filteredIndexData.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} segments`,
              pageSizeOptions: ['5', '10', '20', '50'],
            }}
            size="small"
            bordered
            rowKey="key"
          />
        )}
      </Card>
    </div>
  );
};

export default IndexesPage;
