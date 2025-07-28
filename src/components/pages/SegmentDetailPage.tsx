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
  Divider
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { segmentApi } from '@/utils/segmentApi';
import { useAppStore } from '@/store/useAppStore';
import { Segment, Warehouse } from '@/types';

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
  const { updateSegment, deleteSegment, warehouses, fetchWarehouses } = useAppStore();
  
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
    }
  }, [segmentId, message, fetchWarehouses]);

  // Warehouse selection handlers
  const handleWarehouseSelection = (targetKeys: React.Key[]) => {
    setSelectedWarehouses(targetKeys as string[]);
  };

  const getWarehouseTransferData = (): TransferItem[] => {
    return warehouses.map(warehouse => ({
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
              color={warehouse.domain === 'Getir10' ? 'blue' : 'green'} 
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
        name: segment.name
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
      await updateSegment(segmentId, {
        name: values.name,
        warehouseIds: selectedWarehouses
      });
      
      // Refresh segment data to get updated computed fields
      const updatedSegment = await segmentApi.getById(segmentId);
      setSegment(updatedSegment);
      message.success('Segment updated successfully');
      setIsEditModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to update segment');
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
                  <Tag key={index} color={domain === 'Getir10' ? 'green' : 'blue'} style={{ fontSize: '14px' }}>
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
                  <Tag key={index} color={domain === 'Getir10' ? 'green' : 'blue'}>
                    {domain}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">No domains</Text>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Warehouse Count">
            <Text strong>{segment.warehouseIds?.length?.toLocaleString() || '0'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated" span={2}>
            {format(new Date(segment.lastUpdated), 'dd/MM/yyyy HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Geographic Information */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={12}>
          <Card title="Provinces" size="small">
            {segment.provinces && segment.provinces.length > 0 ? (
              <Space wrap>
                {segment.provinces.map((province, index) => (
                  <Tag key={index} color="blue">{province}</Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">No provinces specified</Text>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Districts" size="small">
            {segment.districts && segment.districts.length > 0 ? (
              <Space wrap>
                {segment.districts.map((district, index) => (
                  <Tag key={index} color="green">{district}</Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">No districts specified</Text>
            )}
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={6}>
          <Card title="Regions" size="small">
            {segment.regions && segment.regions.length > 0 ? (
              <Space wrap>
                {segment.regions.map((region, index) => (
                  <Tag key={index} color="volcano">{region}</Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">No regions specified</Text>
            )}
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Demographies" size="small">
            {segment.demographies && segment.demographies.length > 0 ? (
              <Space wrap>
                {segment.demographies.map((demography, index) => (
                  <Tag key={index} color="orange">{demography}</Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">No demographies specified</Text>
            )}
          </Card>
        </Col>
      </Row>

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
                  <Option value="Getir10">Getir10</Option>
                  <Option value="Getir30">Getir30</Option>
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
                  {[...new Set(warehouses.map(w => w.region))].map(region => (
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
                  {[...new Set(warehouses.map(w => w.province))].map(province => (
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

          <Transfer
            dataSource={getWarehouseTransferData().filter(item => {
              const warehouse = warehouses.find(w => w.id === item.key);
              if (!warehouse) return false;
              
              return (!warehouseFilter.domain || warehouse.domain === warehouseFilter.domain) &&
                     (!warehouseFilter.region || warehouse.region === warehouseFilter.region) &&
                     (!warehouseFilter.province || warehouse.province === warehouseFilter.province) &&
                     (!warehouseFilter.size || warehouse.size === warehouseFilter.size) &&
                     (!warehouseFilter.demography || warehouse.demography === warehouseFilter.demography);
            })}
            targetKeys={selectedWarehouses}
            onChange={handleWarehouseSelection}
            render={renderWarehouseItem}
            titles={[
              <span key="available" style={{ fontWeight: 600, fontSize: '14px' }}>
                📦 Available Warehouses ({warehouses.length})
              </span>, 
              <span key="selected" style={{ fontWeight: 600, fontSize: '14px' }}>
                ✅ Selected Warehouses ({selectedWarehouses.length})
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