'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Transfer,
  Select,
  Tag,
  Row,
  Col,
  Divider,
  Typography,
  Card,
  Statistic,
  Tooltip,
  Popconfirm,
  Checkbox,
  Dropdown,
  Menu,
  App
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  MoreOutlined,
  SearchOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Segment, Warehouse, PriceLocation } from '@/types';
import ClientOnlyTable from '../common/ClientOnlyTable';

const { Option } = Select;
const { Title, Text } = Typography;

interface TransferItem {
  key: string;
  title: string;
  description: string;
  chosen: boolean;
}

const SegmentationPage: React.FC = () => {
  const { message } = App.useApp();
  const router = useRouter();
  const {
    segments,
    warehouses,
    priceLocations,
    loading,
    fetchSegments,
    fetchWarehouses,
    fetchPriceLocations,
    addSegment,
    deleteSegment
  } = useAppStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedWarehouses, setSelectedWarehouses] = useState<React.Key[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState({
    domain: '',
    region: '',
    province: '',
    size: '',
    demography: ''
  });
  const [filters, setFilters] = useState({
    search: '',
    province: '',
    district: '',
    region: '',
    domain: ''
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSegments();
    fetchWarehouses();
    fetchPriceLocations();
  }, [fetchSegments, fetchWarehouses, fetchPriceLocations]);

  // Initialize filtered data when segments load
  const filteredData = useMemo(() => {
    let filtered = [...segments];

    // Search filter (name, domains, or ID)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((item: Segment) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.domains?.some(domain => domain.toLowerCase().includes(searchLower)) ||
        item.id.toLowerCase().includes(searchLower)
      );
    }

    // Province filter
    if (filters.province && filters.province !== 'all') {
      filtered = filtered.filter((item: Segment) =>
        item.provinces?.some(province =>
          province.toLowerCase() === filters.province.toLowerCase()
        )
      );
    }

    // District filter
    if (filters.district && filters.district !== 'all') {
      filtered = filtered.filter((item: Segment) =>
        item.districts?.some(district =>
          district.toLowerCase() === filters.district.toLowerCase()
        )
      );
    }

    // Region filter
    if (filters.region && filters.region !== 'all') {
      filtered = filtered.filter((item: Segment) =>
        item.regions?.some(region =>
          region.toLowerCase() === filters.region.toLowerCase()
        )
      );
    }

    // Domain filter
    if (filters.domain && filters.domain !== 'all') {
      filtered = filtered.filter((item: Segment) =>
        item.domains?.some(domain => domain.toLowerCase() === filters.domain.toLowerCase())
      );
    }

    return filtered;
  }, [segments, filters]);

  // Get unique values for filter options
  const getUniqueValues = (field: 'provinces' | 'districts' | 'regions' | 'domains') => {
    const values = new Set<string>();
    segments.forEach(segment => {
      if (segment[field]) {
        segment[field]!.forEach(value => values.add(value));
      }
    });
    return Array.from(values).sort();
  };

  // Table columns
  const columns = [
    {
      title: 'Segment',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      render: (name: string, record: Segment) => (
        <Button
          type="link"
          style={{ padding: 0, height: 'auto', fontWeight: 500 }}
          onClick={() => router.push(`/pricing/segmentation/${record.id}`)}
        >
          {name}
        </Button>
      ),
    },
    {
      title: 'Domains',
      dataIndex: 'domains',
      key: 'domains',
      render: (domains: string[]) => (
        <Space wrap>
          {domains && domains.length > 0 ? (
            domains.map((domain, index) => (
                              <Tag key={index} color={domain === 'Getir' ? 'green' : 'blue'}>
                {domain}
              </Tag>
            ))
          ) : (
            <Tag color="default">No Domain</Tag>
          )}
        </Space>
      ),
      sorter: (a: any, b: any) => {
        const aStr = a.domains?.join(', ') || '';
        const bStr = b.domains?.join(', ') || '';
        return aStr.localeCompare(bStr);
      },
    },
    {
      title: 'Warehouse Count',
      dataIndex: 'warehouseIds',
      key: 'warehouseCount',
      align: 'center' as const,
      render: (warehouseIds: string[]) => (
        <span style={{ fontWeight: 500 }}>
          {warehouseIds?.length || 0}
        </span>
      ),
      sorter: (a: any, b: any) => (a.warehouseIds?.length || 0) - (b.warehouseIds?.length || 0),
    },
    {
      title: 'Price Location',
      dataIndex: 'priceLocation',
      key: 'priceLocation',
      align: 'center' as const,
              render: (priceLocation: string) => {
          if (!priceLocation) {
            return (
              <Tag color="red" style={{ fontSize: '11px' }}>
                ⚠️ Not Set
              </Tag>
            );
          }
          const location = priceLocations.find(loc => loc.id === priceLocation);
          return (
            <Tag color="blue" style={{ fontSize: '11px' }}>
              {location?.name || priceLocation}
            </Tag>
          );
        },
      sorter: (a: any, b: any) => {
        const aLoc = a.priceLocation || '';
        const bLoc = b.priceLocation || '';
        return aLoc.localeCompare(bLoc);
      },
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (date: string) => format(new Date(date), 'dd/MM/yyyy HH:mm'),
      sorter: (a: any, b: any) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (record: Segment) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            title="View Details"
            onClick={() => router.push(`/pricing/segmentation/${record.id}`)}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
            title="Delete Segment"
            onClick={() => handleDeleteSegment(record.id)}
          />
        </Space>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleProvinceChange = (value: string) => {
    setFilters(prev => ({ ...prev, province: value }));
  };

  const handleDistrictChange = (value: string) => {
    setFilters(prev => ({ ...prev, district: value }));
  };

  const handleRegionChange = (value: string) => {
    setFilters(prev => ({ ...prev, region: value }));
  };

  const handleDomainChange = (value: string) => {
    setFilters(prev => ({ ...prev, domain: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      province: '',
      district: '',
      region: '',
      domain: ''
    });
  };

  const handleAddSegment = () => {
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Validate that at least one warehouse is selected
      if (selectedWarehouses.length === 0) {
        message.error('Please select at least one warehouse for the segment');
        return;
      }
      
      // Validate price location is selected
      if (!values.priceLocation) {
        message.error('Please select a price location for the segment');
        return;
      }

      await addSegment({
        name: values.name,
        warehouseIds: selectedWarehouses as string[],
        priceLocation: values.priceLocation
      });
      message.success('Segment added successfully');
      setIsModalVisible(false);
      setSelectedWarehouses([]);
      form.resetFields();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add segment';
      message.error(errorMessage);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedWarehouses([]);
    form.resetFields();
  };

  // Warehouse selection handlers
  const handleWarehouseSelection = (targetKeys: React.Key[]) => {
    setSelectedWarehouses(targetKeys as string[]);
  };

  // Get available warehouses (not assigned to any segment)
  const getAvailableWarehouses = (): Warehouse[] => {
    const allAssignedWarehouseIds = segments.flatMap(seg => seg.warehouseIds || []);
    return warehouses.filter(warehouse => 
      !allAssignedWarehouseIds.includes(warehouse.id)
    );
  };

  const getWarehouseTransferData = (): TransferItem[] => {
    const availableWarehouses = getAvailableWarehouses();
    return availableWarehouses.map(warehouse => ({
      key: warehouse.id,
      title: warehouse.name,
      description: `${warehouse.province}, ${warehouse.district} - ${warehouse.domain}`,
      chosen: selectedWarehouses.includes(warehouse.id)
    }));
  };

  const renderWarehouseItem = (item: TransferItem) => {
    const availableWarehouses = getAvailableWarehouses();
    const warehouse = availableWarehouses.find(w => w.id === item.key);
    if (!warehouse) return item.title;
    
    return {
      label: (
        <div style={{ 
          padding: '8px 0', 
          borderBottom: '1px solid #f0f0f0',
          width: '100%'
        }}>
          <div style={{ 
            fontWeight: 500, 
            fontSize: '14px',
            marginBottom: '4px',
            color: '#262626'
          }}>
            {warehouse.name}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#8c8c8c',
            marginBottom: '6px'
          }}>
            📍 {warehouse.province}, {warehouse.district}
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '4px',
            flexWrap: 'wrap'
          }}>
            <Tag 
                              color={warehouse.domain === 'Getir' ? 'blue' : 'green'} 
              style={{ fontSize: '11px', margin: '0 2px 2px 0' }}
            >
              {warehouse.domain}
            </Tag>
            <Tag 
              color="orange" 
              style={{ fontSize: '11px', margin: '0 2px 2px 0' }}
            >
              {warehouse.size}
            </Tag>
            <Tag 
              color="purple" 
              style={{ fontSize: '11px', margin: '0 2px 2px 0' }}
            >
              {warehouse.demography}
            </Tag>
          </div>
        </div>
      ),
      value: warehouse.id
    };
  };

  const handleDeleteSegment = async (id: string) => {
    try {
      await deleteSegment(id);
      message.success('Segment deleted successfully');
    } catch (error) {
      message.error('Failed to delete segment');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select segments to delete');
      return;
    }

    try {
      // Delete all selected segments
      await Promise.all(selectedRowKeys.map(id => deleteSegment(id as string)));
      message.success(`Successfully deleted ${selectedRowKeys.length} segments`);
      setSelectedRowKeys([]); // Clear selection
    } catch (error) {
      message.error('Failed to delete some segments');
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys as string[]);
    },
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Segmentation</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddSegment}
            style={{ background: '#7C3AED' }}
          >
            Add Segment
          </Button>
        </Col>
      </Row>

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Input
            placeholder="Search by name, domain, or ID"
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={e => handleSearch(e.target.value)}
            allowClear
          />
        </Col>
        <Col span={4}>
          <Select
            placeholder="Province"
            style={{ width: '100%' }}
            value={filters.province || undefined}
            onChange={handleProvinceChange}
            allowClear
          >
            <Option value="all">All Provinces</Option>
            {getUniqueValues('provinces').map(province => (
              <Option key={province} value={province}>{province}</Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="District"
            style={{ width: '100%' }}
            value={filters.district || undefined}
            onChange={handleDistrictChange}
            allowClear
          >
            <Option value="all">All Districts</Option>
            {getUniqueValues('districts').map(district => (
              <Option key={district} value={district}>{district}</Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="Region"
            style={{ width: '100%' }}
            value={filters.region || undefined}
            onChange={handleRegionChange}
            allowClear
          >
            <Option value="all">All Regions</Option>
            {getUniqueValues('regions').map(region => (
              <Option key={region} value={region}>{region}</Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="Domain"
            style={{ width: '100%' }}
            value={filters.domain || undefined}
            onChange={handleDomainChange}
            allowClear
          >
            <Option value="all">All Domains</Option>
            <Option value="Getir10">Getir10</Option>
            <Option value="Getir30">Getir30</Option>
          </Select>
        </Col>
        <Col span={2}>
          <Button onClick={clearAllFilters} style={{ width: '100%' }}>
            Clear All
          </Button>
        </Col>
      </Row>

      {/* Filter Summary */}
      {(filters.search || filters.province || filters.district || filters.region || filters.domain) && (
        <Row style={{ marginBottom: '16px' }}>
          <Col span={24}>
            <Space wrap>
              <Text type="secondary">Active filters:</Text>
              {filters.search && <Tag closable onClose={() => setFilters(prev => ({ ...prev, search: '' }))}>Search: {filters.search}</Tag>}
              {filters.province && <Tag closable onClose={() => setFilters(prev => ({ ...prev, province: '' }))}>Province: {filters.province}</Tag>}
              {filters.district && <Tag closable onClose={() => setFilters(prev => ({ ...prev, district: '' }))}>District: {filters.district}</Tag>}
              {filters.region && <Tag closable onClose={() => setFilters(prev => ({ ...prev, region: '' }))}>Region: {filters.region}</Tag>}
              {filters.domain && <Tag closable onClose={() => setFilters(prev => ({ ...prev, domain: '' }))}>Domain: {filters.domain}</Tag>}
              <Button type="link" size="small" onClick={clearAllFilters}>Clear all filters</Button>
            </Space>
          </Col>
        </Row>
      )}

      {/* Bulk Actions Bar */}
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
            <Space>
              <Button
                onClick={() => setSelectedRowKeys([])}
              >
                Clear Selection
              </Button>
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={handleBulkDelete}
              >
                Delete Selected
              </Button>
            </Space>
          </Col>
        </Row>
      )}

      {/* Table */}
      <ClientOnlyTable
        dataSource={filteredData}
        columns={columns}
        loading={loading}
        pagination={{
          total: filteredData.length,
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => {
            const totalSegments = segments.length;
            const filtered = filteredData.length;
            return filtered !== totalSegments
              ? `${range[0]}-${range[1]} of ${total} filtered items (${totalSegments} total)`
              : `${range[0]}-${range[1]} of ${total} items`;
          },
          pageSizeOptions: ['10', '20', '50'],
        }}
        rowSelection={rowSelection}
        rowKey="id"
      />

      {/* Add Segment Modal */}
      <Modal
        title="Add New Segment"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Create"
        cancelText="Cancel"
        okButtonProps={{ style: { background: '#7C3AED' } }}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '20px' }}
        >
          <Form.Item
            name="name"
            label="Segment Name"
            rules={[{ required: true, message: 'Please enter segment name' }]}
          >
            <Input placeholder="Enter segment name" />
          </Form.Item>

          <Form.Item
            name="priceLocation"
            label="Price Location"
            rules={[{ required: true, message: 'Please select a price location' }]}
            tooltip="Select the location where competitor prices will be fetched from"
          >
            <Select placeholder="Select price location for pricing data">
              {priceLocations.map(location => (
                <Option key={location.id} value={location.id}>
                  {location.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Divider>Warehouse Selection</Divider>
          
          <div style={{ marginBottom: '16px' }}>
            <Row gutter={16} style={{ marginBottom: '8px' }}>
              <Col span={8}>
                <Select
                  placeholder="Filter by Domain"
                  style={{ width: '100%' }}
                  value={warehouseFilter.domain || undefined}
                  onChange={(value) => setWarehouseFilter(prev => ({ ...prev, domain: value || '' }))}
                  allowClear
                >
                  <Option value="Getir">Getir</Option>
                  <Option value="Getir Büyük">Getir Büyük</Option>
                </Select>
              </Col>
              <Col span={8}>
                <Select
                  placeholder="Filter by Region"
                  style={{ width: '100%' }}
                  value={warehouseFilter.region || undefined}
                  onChange={(value) => setWarehouseFilter(prev => ({ ...prev, region: value || '' }))}
                  allowClear
                >
                  {[...new Set(getAvailableWarehouses().map(w => w.region))].map(region => (
                    <Option key={region} value={region}>{region}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <Select
                  placeholder="Filter by Province"
                  style={{ width: '100%' }}
                  value={warehouseFilter.province || undefined}
                  onChange={(value) => setWarehouseFilter(prev => ({ ...prev, province: value || '' }))}
                  allowClear
                >
                  {[...new Set(getAvailableWarehouses().map(w => w.province))].map(province => (
                    <Option key={province} value={province}>{province}</Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Select
                  placeholder="Filter by Size"
                  style={{ width: '100%' }}
                  value={warehouseFilter.size || undefined}
                  onChange={(value) => setWarehouseFilter(prev => ({ ...prev, size: value || '' }))}
                  allowClear
                >
                  <Option value="Small">Small</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="Large">Large</Option>
                  <Option value="XLarge">XLarge</Option>
                </Select>
              </Col>
              <Col span={8}>
                <Select
                  placeholder="Filter by Demography"
                  style={{ width: '100%' }}
                  value={warehouseFilter.demography || undefined}
                  onChange={(value) => setWarehouseFilter(prev => ({ ...prev, demography: value || '' }))}
                  allowClear
                >
                  <Option value="Urban">Urban</Option>
                  <Option value="Suburban">Suburban</Option>
                  <Option value="Rural">Rural</Option>
                </Select>
              </Col>
            </Row>
          </div>

          {(() => {
            const filteredData = getWarehouseTransferData().filter(item => {
              const availableWarehouses = getAvailableWarehouses();
              const warehouse = availableWarehouses.find(w => w.id === item.key);
              if (!warehouse) return false;
              
              return (!warehouseFilter.domain || warehouse.domain === warehouseFilter.domain) &&
                     (!warehouseFilter.region || warehouse.region === warehouseFilter.region) &&
                     (!warehouseFilter.province || warehouse.province === warehouseFilter.province) &&
                     (!warehouseFilter.size || warehouse.size === warehouseFilter.size) &&
                     (!warehouseFilter.demography || warehouse.demography === warehouseFilter.demography);
            });
            
            return (
              <Transfer
                dataSource={filteredData}
                targetKeys={selectedWarehouses}
                onChange={handleWarehouseSelection}
                render={renderWarehouseItem}
                titles={[
                  <span key="available" style={{ fontWeight: 600, fontSize: '14px' }}>
                    📦 Available Warehouses
                  </span>, 
                  <span key="selected" style={{ fontWeight: 600, fontSize: '14px' }}>
                    ✅ Selected Warehouses
                  </span>
                ]}
                listStyle={{
                  width: 380,
                  height: 400,
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px'
                }}
                oneWay
                pagination={{
                  pageSize: 5,
                  simple: true
                }}
                showSearch
              />
            );
          })()}
          
          {selectedWarehouses.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <Title level={5} style={{ marginBottom: '12px', color: '#262626' }}>
                📊 Segment Preview
              </Title>
              <Card 
                size="small" 
                style={{ 
                  background: '#fafafa',
                  border: '1px solid #e6f7ff'
                }}
              >
                <Row gutter={[16, 12]}>
                  <Col span={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                        {selectedWarehouses.length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Warehouses</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                        {[...new Set(warehouses
                          .filter(w => selectedWarehouses.includes(w.id))
                          .map(w => w.domain)
                        )].length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Domains</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16' }}>
                        {[...new Set(warehouses
                          .filter(w => selectedWarehouses.includes(w.id))
                          .map(w => w.province)
                        )].length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Provinces</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1' }}>
                        {[...new Set(warehouses
                          .filter(w => selectedWarehouses.includes(w.id))
                          .map(w => w.district)
                        )].length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Districts</div>
                    </div>
                  </Col>
                </Row>
                
                <Divider style={{ margin: '12px 0' }} />
                
                <Row gutter={[8, 8]}>
                  <Col span={24}>
                    <Text strong style={{ fontSize: '12px', color: '#666' }}>DOMAINS:</Text>
                    <div style={{ marginTop: '4px' }}>
                      {[...new Set(warehouses
                        .filter(w => selectedWarehouses.includes(w.id))
                        .map(w => w.domain)
                      )].map(domain => (
                        <Tag key={domain} color={domain === 'Getir' ? 'blue' : 'green'} style={{ margin: '2px' }}>
                          {domain}
                        </Tag>
                      ))}
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default SegmentationPage; 