'use client';

import React, { useState, useEffect } from 'react';
import {
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
  Button,
  Space,
  App,
  Skeleton,
  Progress,
  Steps
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { getDomainColor } from '@/utils/badgeColors';
import { Segment, Warehouse, PriceLocation } from '@/types';

const { Option } = Select;
const { Title, Text } = Typography;

interface TransferItem {
  key: string;
  title: string;
  description: string;
  chosen: boolean;
}

interface SegmentFormPageProps {
  segmentId?: string; // If provided, we're editing; otherwise, we're creating
}

const SegmentFormPage: React.FC<SegmentFormPageProps> = ({ segmentId }) => {
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
    updateSegment
  } = useAppStore();

  const [selectedWarehouses, setSelectedWarehouses] = useState<React.Key[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState({
    domain: '',
    region: '',
    province: '',
    size: '',
    demography: ''
  });
  const [segment, setSegment] = useState<Segment | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({
    name: '',
    priceLocation: ''
  });

  const isEditing = Boolean(segmentId);

  useEffect(() => {
    fetchSegments();
    fetchWarehouses();
    fetchPriceLocations();
  }, [fetchSegments, fetchWarehouses, fetchPriceLocations]);

  // Track form values for progress indicator
  const handleFormValuesChange = (changedValues: any, allValues: any) => {
    setFormValues(allValues);
  };

  // Load segment data if editing
  useEffect(() => {
    if (isEditing && segmentId && segments.length > 0) {
      const existingSegment = segments.find(s => s.id === segmentId);
      if (existingSegment) {
        setSegment(existingSegment);
        setSelectedWarehouses(existingSegment.warehouseIds || []);
        const segmentData = {
          name: existingSegment.name,
          priceLocation: existingSegment.priceLocation
        };
        form.setFieldsValue(segmentData);
        setFormValues(segmentData);
      }
    }
  }, [isEditing, segmentId, segments, form]);

  const handleSave = async () => {
    try {
      setPageLoading(true);
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

      const segmentData = {
        name: values.name,
        warehouseIds: selectedWarehouses as string[],
        priceLocation: values.priceLocation
      };

      if (isEditing && segmentId) {
        await updateSegment(segmentId, segmentData);
        message.success('Segment updated successfully');
        router.push(`/pricing/segmentation/${segmentId}`);
      } else {
        const newSegment = await addSegment(segmentData);
        message.success('Segment created successfully');
        router.push('/pricing/segmentation');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} segment`;
      message.error(errorMessage);
    } finally {
      setPageLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditing && segmentId) {
      router.push(`/pricing/segmentation/${segmentId}`);
    } else {
      router.push('/pricing/segmentation');
    }
  };

  // Warehouse selection handlers
  const handleWarehouseSelection = (targetKeys: React.Key[]) => {
    setSelectedWarehouses(targetKeys as string[]);
  };

  // Get available warehouses (not assigned to any segment, except current one if editing)
  const getAvailableWarehouses = (): Warehouse[] => {
    const allAssignedWarehouseIds = segments
      .filter(seg => isEditing ? seg.id !== segmentId : true) // Exclude current segment if editing
      .flatMap(seg => seg.warehouseIds || []);
    
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
              color={getDomainColor(warehouse.domain)} 
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

  if (loading && warehouses.length === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <Skeleton active />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '16px 0',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Space align="center" style={{ marginBottom: '8px' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleCancel}
            style={{ padding: '4px 8px' }}
          >
            Back
          </Button>
        </Space>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Smart Pricing
          </Text>
          <Text type="secondary" style={{ fontSize: '14px' }}>/</Text>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Segmentation
          </Text>
          <Text type="secondary" style={{ fontSize: '14px' }}>/</Text>
          <Text style={{ fontSize: '14px', fontWeight: 500 }}>
            {isEditing ? 'Edit Segment' : 'Add New Segment'}
          </Text>
        </div>
        <Title level={2} style={{ margin: 0, fontSize: '28px' }}>
          {isEditing ? 'Edit Segment' : 'Add New Segment'}
        </Title>
        {isEditing && segment && (
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Editing: {segment.name}
          </Text>
        )}
      </div>

      {/* Progress Indicator */}
      <div style={{ 
        marginBottom: '24px',
        padding: '16px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e8e8e8'
      }}>
        <Steps
          current={formValues.name && formValues.priceLocation ? 
            (selectedWarehouses.length > 0 ? 2 : 1) : 0}
          items={[
            {
              title: 'Basic Information',
              description: 'Set segment name and price location',
              status: formValues.name && formValues.priceLocation ? 'finish' : 'process'
            },
            {
              title: 'Warehouse Selection',
              description: 'Choose warehouses for the segment',
              status: selectedWarehouses.length > 0 ? 'finish' : 
                (formValues.name && formValues.priceLocation ? 'process' : 'wait')
            },
            {
              title: 'Review & Save',
              description: 'Review and create the segment',
              status: selectedWarehouses.length > 0 ? 'process' : 'wait'
            }
          ]}
          size="small"
        />
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        onValuesChange={handleFormValuesChange}
        style={{ maxWidth: '100%' }}
      >
        {/* Basic Information Section */}
        <div style={{ 
          marginBottom: '32px',
          padding: '24px',
          background: '#fafafa',
          borderRadius: '8px',
          border: '1px solid #e8e8e8'
        }}>
          <Title level={4} style={{ margin: '0 0 20px 0', color: '#262626' }}>
            Basic Information
          </Title>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={<span style={{ fontWeight: 500, fontSize: '14px' }}>Segment Name</span>}
                rules={[{ required: true, message: 'Please enter segment name' }]}
              >
                <Input 
                  placeholder="Enter segment name" 
                  size="large"
                  style={{ borderRadius: '6px' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priceLocation"
                label={<span style={{ fontWeight: 500, fontSize: '14px' }}>Price Location</span>}
                rules={[{ required: true, message: 'Please select a price location' }]}
                tooltip="Select the location where competitor prices will be fetched from"
              >
                <Select 
                  placeholder="Select price location for pricing data" 
                  size="large"
                  style={{ borderRadius: '6px' }}
                >
                  {priceLocations.map(location => (
                    <Option key={location.id} value={location.id}>
                      {location.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Warehouse Selection Section */}
        <div style={{ 
          marginBottom: '32px',
          padding: '24px',
          background: '#fafafa',
          borderRadius: '8px',
          border: '1px solid #e8e8e8'
        }}>
          <Title level={4} style={{ margin: '0 0 20px 0', color: '#262626' }}>
            Warehouse Selection
          </Title>
          
          {/* Filter Controls */}
          <div style={{ 
            marginBottom: '20px',
            padding: '16px',
            background: '#fff',
            borderRadius: '6px',
            border: '1px solid #e8e8e8'
          }}>
            <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '14px' }}>
              Filter Warehouses
            </Text>
            <Row gutter={16}>
              <Col span={8}>
                <Select
                  placeholder="Filter by Domain"
                  style={{ width: '100%' }}
                  value={warehouseFilter.domain || undefined}
                  onChange={(value) => setWarehouseFilter(prev => ({ ...prev, domain: value || '' }))}
                  allowClear
                >
                  {[...new Set(getAvailableWarehouses().map(w => w.domain))].sort().map(domain => (
                    <Option key={domain} value={domain}>{domain}</Option>
                  ))}
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
            <Row gutter={16} style={{ marginTop: '12px' }}>
              <Col span={8}>
                <Select
                  placeholder="Filter by Size"
                  style={{ width: '100%' }}
                  value={warehouseFilter.size || undefined}
                  onChange={(value) => setWarehouseFilter(prev => ({ ...prev, size: value || '' }))}
                  allowClear
                >
                  {[...new Set(getAvailableWarehouses().map(w => w.size))].sort().map(size => (
                    <Option key={size} value={size}>{size}</Option>
                  ))}
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
                  {[...new Set(getAvailableWarehouses().map(w => w.demography))].sort().map(demography => (
                    <Option key={demography} value={demography}>{demography}</Option>
                  ))}
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
              <div style={{ 
                background: '#fff',
                borderRadius: '6px',
                border: '1px solid #e8e8e8',
                padding: '16px'
              }}>
                <Transfer
                  dataSource={filteredData}
                  targetKeys={selectedWarehouses}
                  onChange={handleWarehouseSelection}
                  render={renderWarehouseItem}
                  titles={[
                    <span key="available" style={{ fontWeight: 600, fontSize: '14px', color: '#262626' }}>
                      📦 Available Warehouses ({filteredData.length})
                    </span>, 
                    <span key="selected" style={{ fontWeight: 600, fontSize: '14px', color: '#262626' }}>
                      ✅ Selected Warehouses ({selectedWarehouses.length})
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
                  showSelectAll={false}
                />
              </div>
            );
          })()}
        </div>

        {/* Segment Preview Section */}
        {selectedWarehouses.length > 0 && (
          <div style={{ 
            marginBottom: '32px',
            padding: '24px',
            background: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #bae6fd'
          }}>
            <Title level={4} style={{ margin: '0 0 20px 0', color: '#0369a1' }}>
              📊 Segment Preview
            </Title>
            <Row gutter={[16, 12]}>
              <Col span={6}>
                <div style={{ 
                  textAlign: 'center',
                  padding: '16px',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #e8e8e8'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                    {selectedWarehouses.length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>Warehouses</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ 
                  textAlign: 'center',
                  padding: '16px',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #e8e8e8'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                    {[...new Set(warehouses
                      .filter(w => selectedWarehouses.includes(w.id))
                      .map(w => w.domain)
                    )].length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>Domains</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ 
                  textAlign: 'center',
                  padding: '16px',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #e8e8e8'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fa8c16' }}>
                    {[...new Set(warehouses
                      .filter(w => selectedWarehouses.includes(w.id))
                      .map(w => w.province)
                    )].length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>Provinces</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ 
                  textAlign: 'center',
                  padding: '16px',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #e8e8e8'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>
                    {[...new Set(warehouses
                      .filter(w => selectedWarehouses.includes(w.id))
                      .map(w => w.district)
                    )].length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>Districts</div>
                </div>
              </Col>
            </Row>
            
            <Divider style={{ margin: '20px 0' }} />
            
            <Row gutter={[8, 8]}>
              <Col span={24}>
                <Text strong style={{ fontSize: '14px', color: '#666' }}>DOMAINS:</Text>
                <div style={{ marginTop: '8px' }}>
                  {[...new Set(warehouses
                    .filter(w => selectedWarehouses.includes(w.id))
                    .map(w => w.domain)
                  )].map(domain => (
                    <Tag key={domain} color={getDomainColor(domain)} style={{ margin: '2px' }}>
                      {domain}
                    </Tag>
                  ))}
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          padding: '24px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e8e8e8',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <Button 
            size="large" 
            onClick={handleCancel}
            style={{ minWidth: '120px' }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={pageLoading}
            htmlType="submit"
            style={{ 
              background: '#7C3AED',
              borderColor: '#7C3AED',
              minWidth: '160px'
            }}
          >
            {isEditing ? 'Update Segment' : 'Create Segment'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SegmentFormPage;
