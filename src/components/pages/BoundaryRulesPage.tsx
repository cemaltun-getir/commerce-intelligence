'use client';

import React, { useState } from 'react';
import { 
  Typography, 
  Button, 
  Table, 
  Input, 
  Select, 
  Row,
  Col,
  Modal,
  Form,
  Space,
  Tag,
  Switch,
  InputNumber,
  Card
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { BoundaryRule } from '@/types';
import ClientOnlyTable from '../common/ClientOnlyTable';

const { Title, Text } = Typography;
const { Option } = Select;

// Mock boundary rules data
const mockBoundaryRules: BoundaryRule[] = [
  {
    id: '1',
    name: 'Minimum Price Floor',
    minPrice: 5,
    category: 'Basic Foods',
    salesChannel: 'getir',
    isActive: true,
  },
  {
    id: '2',
    name: 'Maximum Price Ceiling',
    maxPrice: 500,
    category: 'Beverages',
    salesChannel: 'getir',
    isActive: true,
  },
  {
    id: '3',
    name: 'Minimum Margin Rule',
    minMargin: 15,
    competitor: 'migros',
    salesChannel: 'getirbuyuk',
    isActive: false,
  },
  {
    id: '4',
    name: 'Category Price Limit',
    maxPrice: 200,
    category: 'Dairy',
    subCategory: 'Cheese',
    salesChannel: 'getir',
    isActive: true,
  },
];

const BoundaryRulesPage: React.FC = () => {
  const [rules, setRules] = useState<BoundaryRule[]>(mockBoundaryRules);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<BoundaryRule | null>(null);
  const [form] = Form.useForm();

  // Table columns
  const columns = [
    {
      title: 'Rule Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Type',
      key: 'type',
      width: 120,
      render: (record: BoundaryRule) => {
        const types = [];
        if (record.minPrice) types.push('Min Price');
        if (record.maxPrice) types.push('Max Price');
        if (record.minMargin) types.push('Min Margin');
        if (record.maxMargin) types.push('Max Margin');
        
        return (
          <Space direction="vertical" size="small">
            {types.map(type => (
              <Tag key={type} color="blue">{type}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Values',
      key: 'values',
      width: 150,
      render: (record: BoundaryRule) => (
        <Space direction="vertical" size="small">
          {record.minPrice && <Text>Min: ₺{record.minPrice}</Text>}
          {record.maxPrice && <Text>Max: ₺{record.maxPrice}</Text>}
          {record.minMargin && <Text>Min Margin: {record.minMargin}%</Text>}
          {record.maxMargin && <Text>Max Margin: {record.maxMargin}%</Text>}
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => category || '-',
    },
    {
      title: 'Sub Category',
      dataIndex: 'subCategory',
      key: 'subCategory',
      width: 120,
      render: (subCategory: string) => subCategory || '-',
    },
    {
      title: 'Competitor',
      dataIndex: 'competitor',
      key: 'competitor',
      width: 120,
      render: (competitor: string) => competitor || '-',
    },
    {
      title: 'Sales Channel',
      dataIndex: 'salesChannel',
      key: 'salesChannel',
      width: 120,
      render: (channel: string) => (
        <Tag color={channel === 'getir' ? 'green' : 'blue'}>
          {channel === 'getir' ? 'Getir' : 'GetirBüyük'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean, record: BoundaryRule) => (
        <Switch 
          checked={isActive}
          size="small"
          onChange={(checked) => handleStatusChange(record.id, checked)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: BoundaryRule) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Button 
            type="text" 
            icon={<DeleteOutlined />} 
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  const handleStatusChange = (id: string, isActive: boolean) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, isActive } : rule
    ));
  };

  const handleAdd = () => {
    setEditingRule(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (rule: BoundaryRule) => {
    setEditingRule(rule);
    setIsModalVisible(true);
    form.setFieldsValue(rule);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this rule?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        setRules(prev => prev.filter(rule => rule.id !== id));
      },
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingRule(null);
    form.resetFields();
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (editingRule) {
        // Update existing rule
        setRules(prev => prev.map(rule => 
          rule.id === editingRule.id ? { ...rule, ...values } : rule
        ));
      } else {
        // Add new rule
        const newRule: BoundaryRule = {
          id: Math.random().toString(36).substr(2, 9),
          ...values,
        };
        setRules(prev => [...prev, newRule]);
      }
      
      setIsModalVisible(false);
      setEditingRule(null);
      form.resetFields();
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Rulesets & Guardrails</Title>
          <Text type="secondary">
            Set price constraints and margin rules to ensure pricing stays within acceptable bounds
          </Text>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{ background: '#7C3AED' }}
          >
            Add Rule
          </Button>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Total Rules</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7C3AED' }}>
                {rules.length}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Active Rules</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52C41A' }}>
                {rules.filter(rule => rule.isActive).length}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Price Rules</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890FF' }}>
                {rules.filter(rule => rule.minPrice || rule.maxPrice).length}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Margin Rules</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FA8C16' }}>
                {rules.filter(rule => rule.minMargin || rule.maxMargin).length}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Input placeholder="Search rules" />
        </Col>
        <Col span={4}>
          <Select placeholder="Sales Channel" style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="all">All Channels</Option>
            <Option value="getir">Getir</Option>
            <Option value="getirbuyuk">GetirBüyük</Option>
          </Select>
        </Col>
        <Col span={4}>
          <Select placeholder="Category" style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="all">All Categories</Option>
            <Option value="basic-foods">Basic Foods</Option>
            <Option value="beverages">Beverages</Option>
            <Option value="dairy">Dairy</Option>
          </Select>
        </Col>
        <Col span={4}>
          <Select placeholder="Status" style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="all">All Status</Option>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </Col>
      </Row>

      {/* Table */}
      <ClientOnlyTable
        dataSource={rules}
        columns={columns}
        pagination={{
          total: rules.length,
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        }}
        bordered
        size="middle"
        rowKey="id"
      />

      {/* Add/Edit Rule Modal */}
      <Modal
        title={editingRule ? 'Edit Boundary Rule' : 'Add New Boundary Rule'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={editingRule ? 'Update' : 'Create'}
        cancelText="Cancel"
        okButtonProps={{ style: { background: '#7C3AED' } }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '20px' }}
        >
          <Form.Item
            name="name"
            label="Rule Name"
            rules={[{ required: true, message: 'Please enter rule name' }]}
          >
            <Input placeholder="Enter rule name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="salesChannel"
                label="Sales Channel"
                rules={[{ required: true, message: 'Please select sales channel' }]}
              >
                <Select placeholder="Select sales channel">
                  <Option value="getir">Getir</Option>
                  <Option value="getirbuyuk">GetirBüyük</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="Status"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Select placeholder="Select category" allowClear>
                  <Option value="Basic Foods">Basic Foods</Option>
                  <Option value="Beverages">Beverages</Option>
                  <Option value="Dairy">Dairy</Option>
                  <Option value="Canned Foods">Canned Foods</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subCategory" label="Sub Category">
                <Select placeholder="Select sub category" allowClear>
                  <Option value="Flour & Grains">Flour & Grains</Option>
                  <Option value="Soft Drinks">Soft Drinks</Option>
                  <Option value="Cheese">Cheese</Option>
                  <Option value="Tomato Products">Tomato Products</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="competitor" label="Competitor">
            <Select placeholder="Select competitor (optional)" allowClear>
              <Option value="migros">Migros</Option>
              <Option value="carrefour">Carrefour</Option>
              <Option value="sok">ŞOK</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="minPrice" label="Minimum Price (₺)">
                <InputNumber 
                  placeholder="Enter minimum price" 
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxPrice" label="Maximum Price (₺)">
                <InputNumber 
                  placeholder="Enter maximum price" 
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="minMargin" label="Minimum Margin (%)">
                <InputNumber 
                  placeholder="Enter minimum margin" 
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  precision={1}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxMargin" label="Maximum Margin (%)">
                <InputNumber 
                  placeholder="Enter maximum margin" 
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  precision={1}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default BoundaryRulesPage; 