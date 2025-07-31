'use client';

import React, { useState, useEffect } from 'react';
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
  Form,
  Input,
  Select,
  App,
  Skeleton,
  Transfer,
  Divider,
  Radio
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { segmentApi } from '@/utils/segmentApi';
import { useAppStore } from '@/store/useAppStore';
import { Segment, Warehouse, PriceLocation } from '@/types';

interface TransferItem {
  key: string;
  title: string;
  description: string;
  chosen: boolean;
}

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
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState({
    domain: '',
    region: '',
    province: '',
    district: '',
    demography: '',
    size: ''
  });
  const [warehouseViewMode, setWarehouseViewMode] = useState<'grid' | 'list'>('grid');
  const [form] = Form.useForm();

  // Fetch segment details and warehouses
  useEffect(() => {
    const fetchSegment = async () => {
      try {
        setLoading(true);
        const data = await segmentApi.getById(segmentId);
        setSegment(data);
        setSelectedWarehouses(data.warehouseIds || []);
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

  // Get available warehouses (not assigned to any segment except current one)
  const getAvailableWarehouses = (): Warehouse[] => {
    const allAssignedWarehouseIds = segments
      .filter(seg => seg.id !== segmentId) // Exclude current segment
      .flatMap(seg => seg.warehouseIds || []);
    
    return warehouses.filter(warehouse => 
      !allAssignedWarehouseIds.includes(warehouse.id)
    );
  };

  // Warehouse selection handlers
  const handleWarehouseSelection = (targetKeys: React.Key[]) => {
    setSelectedWarehouses(targetKeys as string[]);
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
    const warehouse = warehouses.find(w => w.id === item.key);
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

  const handleBack = () => {
    router.push('/pricing/segmentation');
  };

  const handleEdit = () => {
    if (segment) {
      form.setFieldsValue({
        name: segment.name,
        priceLocation: segment.priceLocation
      });
      setSelectedWarehouses(segment.warehouseIds || []);
      setIsEditModalVisible(true);
    }
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setSelectedWarehouses(segment?.warehouseIds || []);
    form.resetFields();
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Validate that at least one warehouse is selected
      if (selectedWarehouses.length === 0) {
        message.error('Please select at least one warehouse for the segment');
        return;
      }
      
      await updateSegment(segmentId, {
        name: values.name,
        warehouseIds: selectedWarehouses,
        priceLocation: values.priceLocation
      });
      
      // Refresh segment data to get updated computed fields
      const updatedSegment = await segmentApi.getById(segmentId);
      setSegment(updatedSegment);
      message.success('Segment updated successfully');
      setIsEditModalVisible(false);
      form.resetFields();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update segment';
      message.error(errorMessage);
    }
  };

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
                  <Tag key={index} color={domain === 'Getir' ? 'green' : 'blue'} style={{ fontSize: '14px' }}>
                    {domain}
                  </Tag>
                ))
              ) : (
                <Tag color="default" style={{ fontSize: '14px' }}>No Domain</Tag>
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
                  <Tag key={index} color={domain === 'Getir' ? 'green' : 'blue'}>
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
          <Descriptions.Item label="Provinces">
            <Space wrap>
              {segment.provinces && segment.provinces.length > 0 ? (
                segment.provinces.map((province, index) => (
                  <Tag key={index} color="blue">{province}</Tag>
                ))
              ) : (
                <Text type="secondary">No provinces</Text>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Districts">
            <Space wrap>
              {segment.districts && segment.districts.length > 0 ? (
                segment.districts.map((district, index) => (
                  <Tag key={index} color="green">{district}</Tag>
                ))
              ) : (
                <Text type="secondary">No districts</Text>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Regions">
            <Space wrap>
              {segment.regions && segment.regions.length > 0 ? (
                segment.regions.map((region, index) => (
                  <Tag key={index} color="volcano">{region}</Tag>
                ))
              ) : (
                <Text type="secondary">No regions</Text>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Demographies">
            <Space wrap>
              {segment.demographies && segment.demographies.length > 0 ? (
                segment.demographies.map((demography, index) => (
                  <Tag key={index} color="orange">{demography}</Tag>
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
                  <Tag key={index} color="purple">{size}</Tag>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Warehouses ({segment.warehouseIds?.length || 0})</span>
            {segment.warehouseIds && segment.warehouseIds.length > 0 && (
              <Radio.Group 
                value={warehouseViewMode} 
                onChange={(e) => setWarehouseViewMode(e.target.value)}
                size="small"
                buttonStyle="solid"
              >
                <Radio.Button value="grid">
                  <AppstoreOutlined />
                </Radio.Button>
                <Radio.Button value="list">
                  <UnorderedListOutlined />
                </Radio.Button>
              </Radio.Group>
            )}
          </div>
        }
        style={{ marginTop: '24px' }}
      >
        {segment.warehouseIds && segment.warehouseIds.length > 0 ? (
          warehouseViewMode === 'grid' ? (
            <Row gutter={[16, 16]}>
              {segment.warehouseIds.map((warehouseId) => {
                const warehouse = warehouses.find(w => w.id === warehouseId);
                if (!warehouse) return null;
                
                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={warehouseId}>
                    <Card 
                      size="small" 
                      hoverable
                      style={{ 
                        height: '100%',
                        border: '1px solid #f0f0f0',
                        borderRadius: '8px'
                      }}
                      styles={{ body: { padding: '12px' } }}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <Text strong style={{ fontSize: '14px', color: '#262626' }}>
                          {warehouse.name}
                        </Text>
                      </div>
                      
                      <div style={{ marginBottom: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          📍 {warehouse.province}, {warehouse.district}
                        </Text>
                      </div>
                      
                      <div style={{ marginBottom: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          🏢 {warehouse.region}
                        </Text>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <Tag 
                          color={warehouse.domain === 'Getir' ? 'blue' : 'green'} 
                          style={{ fontSize: '10px', margin: '0 2px 2px 0' }}
                        >
                          {warehouse.domain}
                        </Tag>
                        <Tag 
                          color="orange" 
                          style={{ fontSize: '10px', margin: '0 2px 2px 0' }}
                        >
                          {warehouse.size}
                        </Tag>
                        <Tag 
                          color="purple" 
                          style={{ fontSize: '10px', margin: '0 2px 2px 0' }}
                        >
                          {warehouse.demography}
                        </Tag>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <div>
              {segment.warehouseIds.map((warehouseId) => {
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
                            📍 {warehouse.province}, {warehouse.district} • 🏢 {warehouse.region}
                          </Text>
                        </div>
                      </Col>
                      
                      <Col flex="none">
                        <Space size="small">
                          <Tag 
                            color={warehouse.domain === 'Getir' ? 'blue' : 'green'} 
                            style={{ fontSize: '11px' }}
                          >
                            {warehouse.domain}
                          </Tag>
                          <Tag 
                            color="orange" 
                            style={{ fontSize: '11px' }}
                          >
                            {warehouse.size}
                          </Tag>
                          <Tag 
                            color="purple" 
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

      {/* Edit Modal */}
      <Modal
        title="Edit Segment"
        open={isEditModalVisible}
        onOk={handleEditSubmit}
        onCancel={handleEditCancel}
        okText="Update"
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
            // Get available warehouses for display
            const availableWarehouses = getAvailableWarehouses();
            
            // Get currently selected warehouses that might not be available anymore
            const selectedWarehousesData = selectedWarehouses
              .map(id => warehouses.find(w => w.id === id))
              .filter(w => w && !availableWarehouses.find(aw => aw.id === w.id));
            
            // Combine available warehouses with selected warehouses that are no longer available
            const allDisplayWarehouses = [...availableWarehouses, ...selectedWarehousesData];
            
            const filteredData = allDisplayWarehouses
              .filter((warehouse): warehouse is Warehouse => {
                if (!warehouse) return false;
                
                return (!warehouseFilter.domain || warehouse.domain === warehouseFilter.domain) &&
                       (!warehouseFilter.region || warehouse.region === warehouseFilter.region) &&
                       (!warehouseFilter.province || warehouse.province === warehouseFilter.province) &&
                       (!warehouseFilter.size || warehouse.size === warehouseFilter.size) &&
                       (!warehouseFilter.demography || warehouse.demography === warehouseFilter.demography);
              })
              .map(warehouse => ({
                key: warehouse.id,
                title: warehouse.name,
                description: `${warehouse.province}, ${warehouse.district} - ${warehouse.domain}`,
                chosen: selectedWarehouses.includes(warehouse.id)
              }));
            
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
                  height: 350,
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
            <div style={{ marginTop: '16px' }}>
              <Card 
                size="small" 
                title="Updated Segment Preview"
                style={{ 
                  background: '#fafafa',
                  border: '1px solid #e6f7ff'
                }}
              >
                <Row gutter={[16, 8]}>
                  <Col span={8}>
                    <Text strong>Warehouses: </Text>
                    <Text style={{ color: '#1890ff' }}>{selectedWarehouses.length}</Text>
                  </Col>
                  <Col span={8}>
                    <Text strong>Domains: </Text>
                    <Text>
                      {[...new Set(warehouses
                        .filter(w => selectedWarehouses.includes(w.id))
                        .map(w => w.domain)
                      )].join(', ')}
                    </Text>
                  </Col>
                  <Col span={8}>
                    <Text strong>Provinces: </Text>
                    <Text>
                      {[...new Set(warehouses
                        .filter(w => selectedWarehouses.includes(w.id))
                        .map(w => w.province)
                      )].length}
                    </Text>
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

export default SegmentDetailPage; 