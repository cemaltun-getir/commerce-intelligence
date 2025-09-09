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
  Skeleton
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

  const isEditing = Boolean(segmentId);

  useEffect(() => {
    fetchSegments();
    fetchWarehouses();
    fetchPriceLocations();
  }, [fetchSegments, fetchWarehouses, fetchPriceLocations]);

  // Load segment data if editing
  useEffect(() => {
    if (isEditing && segmentId && segments.length > 0) {
      const existingSegment = segments.find(s => s.id === segmentId);
      if (existingSegment) {
        setSegment(existingSegment);
        setSelectedWarehouses(existingSegment.warehouseIds || []);
        form.setFieldsValue({
          name: existingSegment.name,
          priceLocation: existingSegment.priceLocation
        });
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
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Space align="center" style={{ marginBottom: '16px' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleCancel}
          >
            Back
          </Button>
        </Space>
        <Title level={2} style={{ margin: 0 }}>
          {isEditing ? 'Edit Segment' : 'Add New Segment'}
        </Title>
        {isEditing && segment && (
          <Text type="secondary">
            Editing: {segment.name}
          </Text>
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
      >
        <Card title="Basic Information" style={{ marginBottom: '24px' }}>
          <Form.Item
            name="name"
            label="Segment Name"
            rules={[{ required: true, message: 'Please enter segment name' }]}
          >
            <Input placeholder="Enter segment name" size="large" />
          </Form.Item>

          <Form.Item
            name="priceLocation"
            label="Price Location"
            rules={[{ required: true, message: 'Please select a price location' }]}
            tooltip="Select the location where competitor prices will be fetched from"
          >
            <Select placeholder="Select price location for pricing data" size="large">
              {priceLocations.map(location => (
                <Option key={location.id} value={location.id}>
                  {location.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        <Card title="Warehouse Selection" style={{ marginBottom: '24px' }}>
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
            <Row gutter={16}>
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
        </Card>

        {selectedWarehouses.length > 0 && (
          <Card title="📊 Segment Preview" style={{ marginBottom: '24px' }}>
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
                    <Tag key={domain} color={getDomainColor(domain)} style={{ margin: '2px' }}>
                      {domain}
                    </Tag>
                  ))}
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* Action Buttons */}
        <Card>
          <Row justify="end">
            <Space>
              <Button size="large" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={pageLoading}
                htmlType="submit"
                style={{ background: '#7C3AED' }}
              >
                {isEditing ? 'Update Segment' : 'Create Segment'}
              </Button>
            </Space>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

export default SegmentFormPage;
