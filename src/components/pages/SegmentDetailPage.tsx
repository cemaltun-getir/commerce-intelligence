'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Typography, 
  Button, 
  Card, 
  Row, 
  Col, 
  Tag, 
  Descriptions, 
  Space,
  Modal,
  App,
  Skeleton,
  Pagination,
  Input,
  Select
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { segmentApi } from '@/utils/segmentApi';
import { useAppStore } from '@/store/useAppStore';
import { getDomainColor, getGeographicColor, getOperationalColor } from '@/utils/badgeColors';
import { Segment, Warehouse, PriceLocation } from '@/types';


const { Title, Text } = Typography;
const { Option } = Select;

interface SegmentDetailPageProps {
  segmentId: string;
}

const SegmentDetailPage: React.FC<SegmentDetailPageProps> = ({ segmentId }) => {
  const { message } = App.useApp();
  const router = useRouter();
  const { 
    updateSegment, 
    deleteSegment, 
    warehouses, 
    priceLocations,
    segments,
    fetchWarehouses,
    fetchPriceLocations,
    fetchSegments
  } = useAppStore();
  
  const [segment, setSegment] = useState<Segment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('');
  const [demographyFilter, setDemographyFilter] = useState<string>('');
  const [sizeFilter, setSizeFilter] = useState<string>('');

  // Get unique filter values from warehouses in this segment
  const filterOptions = useMemo(() => {
    if (!segment?.warehouseIds) return { domains: [], demographies: [], sizes: [] };
    
    const segmentWarehouses = segment.warehouseIds
      .map(id => warehouses.find(w => w.id === id))
      .filter(Boolean) as Warehouse[];
    
    return {
      domains: [...new Set(segmentWarehouses.map(w => w.domain))].sort(),
      demographies: [...new Set(segmentWarehouses.map(w => w.demography))].sort(),
      sizes: [...new Set(segmentWarehouses.map(w => w.size))].sort()
    };
  }, [segment?.warehouseIds, warehouses]);

  // Filter warehouses by search and filters
  const filteredWarehouses = useMemo(() => {
    if (!segment?.warehouseIds) return [];
    
    return segment.warehouseIds.filter(warehouseId => {
      const warehouse = warehouses.find(w => w.id === warehouseId);
      if (!warehouse) return false;
      
      // Search filter
      if (warehouseSearch.trim()) {
        const searchLower = warehouseSearch.toLowerCase();
        const matchesSearch = (
          warehouse.name.toLowerCase().includes(searchLower) ||
          warehouse.id.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }
      
      // Domain filter
      if (domainFilter && warehouse.domain !== domainFilter) {
        return false;
      }
      
      // Demography filter
      if (demographyFilter && warehouse.demography !== demographyFilter) {
        return false;
      }
      
      // Size filter
      if (sizeFilter && warehouse.size !== sizeFilter) {
        return false;
      }
      
      return true;
    });
  }, [segment?.warehouseIds, warehouses, warehouseSearch, domainFilter, demographyFilter, sizeFilter]);

  // Calculate paginated warehouses from filtered results
  const paginatedWarehouses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredWarehouses.slice(startIndex, endIndex);
  }, [filteredWarehouses, currentPage, pageSize]);

  // Fetch segment details and warehouses
  useEffect(() => {
    const fetchSegment = async () => {
      try {
        setLoading(true);
        const data = await segmentApi.getById(segmentId);
        setSegment(data);
        // Reset pagination, search, and filters when segment changes
        setCurrentPage(1);
        setWarehouseSearch('');
        setDomainFilter('');
        setDemographyFilter('');
        setSizeFilter('');
      } catch (error) {
        message.error('Failed to load segment details');
        console.error('Error fetching segment:', error);
      } finally {
        setLoading(false);
      }
    };

    if (segmentId) {
      fetchSegment();
      fetchWarehouses();
      fetchPriceLocations();
      fetchSegments();
    }
  }, [segmentId, message, fetchWarehouses, fetchPriceLocations, fetchSegments]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [warehouseSearch, domainFilter, demographyFilter, sizeFilter]);

  const handleBack = () => {
    router.push('/pricing/segmentation');
  };

  const handleEdit = () => {
    router.push(`/pricing/segmentation/${segmentId}/edit`);
  };

  const clearAllFilters = () => {
    setWarehouseSearch('');
    setDomainFilter('');
    setDemographyFilter('');
    setSizeFilter('');
  };

  const hasActiveFilters = warehouseSearch || domainFilter || demographyFilter || sizeFilter;



  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Segment',
      content: `Are you sure you want to delete "${segment?.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteSegment(segmentId);
          message.success('Segment deleted successfully');
          router.push('/pricing/segmentation');
        } catch (error) {
          message.error('Failed to delete segment');
        }
      }
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Skeleton active />
      </div>
    );
  }

  if (!segment) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={3}>Segment Not Found</Title>
        <Button type="primary" onClick={handleBack}>
          Back to Segments
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              type="text"
            >
              Back
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              {segment.name}
            </Title>
            <Space wrap>
              {segment.domains && segment.domains.length > 0 ? (
                segment.domains.map((domain, index) => (
                  <Tag key={index} color={getDomainColor(domain)} style={{ fontSize: '14px' }}>
                    {domain}
                  </Tag>
                ))
              ) : (
                <Tag color={getDomainColor(undefined)} style={{ fontSize: '14px' }}>No Domain</Tag>
              )}
            </Space>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              Edit
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Segment Details Card */}
      <Card title="Segment Information" style={{ marginBottom: '24px' }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Segment Name" span={2}>
            <Text strong>{segment.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Domains">
            <Space wrap>
              {segment.domains && segment.domains.length > 0 ? (
                segment.domains.map((domain, index) => (
                  <Tag key={index} color={getDomainColor(domain)}>
                    {domain}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">No domains</Text>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Warehouse Count">
            <Text strong>{segment.warehouseIds?.length || 0}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Cities">
            <Space wrap>
              {segment.provinces && segment.provinces.length > 0 ? (
                segment.provinces.map((city, index) => (
                  <Tag key={index} color={getGeographicColor('province')}>{city}</Tag>
                ))
              ) : (
                <Text type="secondary">No cities</Text>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Regions">
            <Space wrap>
              {segment.regions && segment.regions.length > 0 ? (
                segment.regions.map((region, index) => (
                  <Tag key={index} color={getGeographicColor('region')}>{region}</Tag>
                ))
              ) : (
                <Text type="secondary">No regions</Text>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Demographies" span={2}>
            <Space wrap>
              {segment.demographies && segment.demographies.length > 0 ? (
                segment.demographies.map((demography, index) => (
                  <Tag key={index} color={getOperationalColor('demography')}>{demography}</Tag>
                ))
              ) : (
                <Text type="secondary">No demographies</Text>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Sizes" span={2}>
            <Space wrap>
              {segment.sizes && segment.sizes.length > 0 ? (
                segment.sizes.map((size, index) => (
                  <Tag key={index} color={getOperationalColor('size')}>{size}</Tag>
                ))
              ) : (
                <Text type="secondary">No sizes</Text>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="API Location" span={2}>
            <Text strong>
              {(() => {
                const location = priceLocations.find(loc => loc.id === segment.priceLocation);
                return location ? location.name : segment.priceLocation;
              })()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated" span={2}>
            {format(new Date(segment.lastUpdated), 'dd/MM/yyyy HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>



      {/* Warehouses List */}
      <Card 
        title={
          <div>
            <span>
              Warehouses ({filteredWarehouses.length}
              {hasActiveFilters && segment?.warehouseIds?.length !== filteredWarehouses.length && 
                ` of ${segment.warehouseIds.length}`
              })
            </span>
          </div>
        }
        style={{ marginTop: '24px' }}
      >
        {/* Warehouse Filters */}
        {segment?.warehouseIds && segment.warehouseIds.length > 0 && (
          <>
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={6}>
                <Input
                  placeholder="Search by name or ID"
                  prefix={<SearchOutlined />}
                  value={warehouseSearch}
                  onChange={(e) => setWarehouseSearch(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={4}>
                <Select
                  placeholder="Domain"
                  style={{ width: '100%' }}
                  value={domainFilter || undefined}
                  onChange={setDomainFilter}
                  allowClear
                >
                  <Option value="all">All Domains</Option>
                  {filterOptions.domains.map(domain => (
                    <Option key={domain} value={domain}>{domain}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  placeholder="Demography"
                  style={{ width: '100%' }}
                  value={demographyFilter || undefined}
                  onChange={setDemographyFilter}
                  allowClear
                >
                  <Option value="all">All Demographies</Option>
                  {filterOptions.demographies.map(demography => (
                    <Option key={demography} value={demography}>{demography}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  placeholder="Size"
                  style={{ width: '100%' }}
                  value={sizeFilter || undefined}
                  onChange={setSizeFilter}
                  allowClear
                >
                  <Option value="all">All Sizes</Option>
                  {filterOptions.sizes.map(size => (
                    <Option key={size} value={size}>{size}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={2}>
                <Button onClick={clearAllFilters} style={{ width: '100%' }}>
                  Clear All
                </Button>
              </Col>
            </Row>

            {/* Filter Summary */}
            {hasActiveFilters && (
              <Row style={{ marginBottom: '16px' }}>
                <Col span={24}>
                  <Space wrap>
                    <Text type="secondary">Active filters:</Text>
                    {warehouseSearch && (
                      <Tag closable onClose={() => setWarehouseSearch('')}>
                        Search: {warehouseSearch}
                      </Tag>
                    )}
                    {domainFilter && (
                      <Tag closable onClose={() => setDomainFilter('')}>
                        Domain: {domainFilter}
                      </Tag>
                    )}
                    {demographyFilter && (
                      <Tag closable onClose={() => setDemographyFilter('')}>
                        Demography: {demographyFilter}
                      </Tag>
                    )}
                    {sizeFilter && (
                      <Tag closable onClose={() => setSizeFilter('')}>
                        Size: {sizeFilter}
                      </Tag>
                    )}
                    <Button type="link" size="small" onClick={clearAllFilters}>
                      Clear all filters
                    </Button>
                  </Space>
                </Col>
              </Row>
            )}
          </>
        )}

        {segment.warehouseIds && segment.warehouseIds.length > 0 ? (
          filteredWarehouses.length > 0 ? (
            <>
              {/* Warehouse List */}
              <div>
                {paginatedWarehouses.map((warehouseId) => {
                const warehouse = warehouses.find(w => w.id === warehouseId);
                if (!warehouse) return null;
                
                return (
                  <Card 
                    key={warehouseId}
                    size="small" 
                    hoverable
                    style={{ 
                      marginBottom: '8px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '6px'
                    }}
                    styles={{ body: { padding: '12px 16px' } }}
                  >
                    <Row align="middle" gutter={16}>
                      <Col flex="auto">
                        <div style={{ marginBottom: '4px' }}>
                          <Text strong style={{ fontSize: '14px', color: '#262626' }}>
                            {warehouse.name}
                          </Text>
                        </div>
                        
                        <div style={{ marginBottom: '4px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            📍 {warehouse.province}, {warehouse.region}
                          </Text>
                        </div>
                      </Col>
                      
                      <Col flex="none">
                        <Space size="small">
                          <Tag 
                            color={getDomainColor(warehouse.domain)} 
                            style={{ fontSize: '11px' }}
                          >
                            {warehouse.domain}
                          </Tag>
                          <Tag 
                            color={getOperationalColor('size')} 
                            style={{ fontSize: '11px' }}
                          >
                            {warehouse.size}
                          </Tag>
                          <Tag 
                            color={getOperationalColor('demography')} 
                            style={{ fontSize: '11px' }}
                          >
                            {warehouse.demography}
                          </Tag>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                );
              })}
            </div>
            
            {/* Pagination */}
            {filteredWarehouses.length > pageSize && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #f0f0f0'
              }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredWarehouses.length}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) => 
                    `${range[0]}-${range[1]} of ${total} ${hasActiveFilters ? 'filtered ' : ''}warehouses`
                  }
                  pageSizeOptions={['5', '10', '20', '50']}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                  onShowSizeChange={(current, size) => {
                    setCurrentPage(1);
                    setPageSize(size);
                  }}
                />
              </div>
            )}
          </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Text type="secondary">
                No warehouses found matching the current filters
              </Text>
              <br />
              <Button 
                type="primary" 
                onClick={clearAllFilters}
                style={{ marginTop: '12px' }}
              >
                Clear All Filters
              </Button>
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Text type="secondary">No warehouses assigned to this segment</Text>
            <br />
            <Button 
              type="primary" 
              onClick={handleEdit}
              style={{ marginTop: '16px' }}
            >
              Add Warehouses
            </Button>
          </div>
        )}
      </Card>

    </div>
  );
};

export default SegmentDetailPage; 