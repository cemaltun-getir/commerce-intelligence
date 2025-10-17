'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Typography, 
  Table, 
  Button, 
  Input, 
  Select, 
  Row,
  Col,
  Card,
  Tag,
  Space,
  App,
  Checkbox,
  InputNumber,
  Modal,
  Form,
  message,
  Tooltip,
  Statistic,
  List,
  Divider
} from 'antd';
import { 
  SettingOutlined, 
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  DollarOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { WastePrice, WasteConfiguration, AggressionTier } from '@/types';
import { getUrgencyColor, getUrgencyLevel } from '@/utils/wastePriceCalculations';
import ClientOnlyTable from '../common/ClientOnlyTable';

const { Title, Text } = Typography;
const { Option } = Select;
const { useApp } = App;

const WastePricePage: React.FC = () => {
  const { message: messageApi } = useApp();
  
  // Store state
  const { 
    wastePrices,
    wasteConfiguration,
    warehouses,
    categories,
    loading,
    fetchWastePrices,
    fetchWasteConfiguration,
    fetchWarehouses,
    fetchCategories,
    generateWastePrices,
    confirmWastePrice,
    rejectWastePrice,
    bulkConfirmWastePrices,
    updateWasteConfiguration,
    setWastePriceFilter,
    wastePriceFilter
  } = useAppStore();

  // Local state
  const [searchText, setSearchText] = useState('');
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [selectedLevel1, setSelectedLevel1] = useState('all');
  const [selectedLevel2, setSelectedLevel2] = useState('all');
  const [selectedLevel3, setSelectedLevel3] = useState('all');
  const [selectedLevel4, setSelectedLevel4] = useState('all');
  const [minDays, setMinDays] = useState<number | undefined>(undefined);
  const [maxDays, setMaxDays] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editingPrice, setEditingPrice] = useState<WastePrice | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [configForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Mock user ID - in real app this would come from auth
  const currentUserId = 'procurement_user_1';

  // Category change handlers
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

  // Fetch data on component mount
  useEffect(() => {
    fetchWastePrices();
    fetchWasteConfiguration();
    fetchWarehouses();
    fetchCategories();
  }, [fetchWastePrices, fetchWasteConfiguration, fetchWarehouses, fetchCategories]);

  // Update store filter when local filters change
  useEffect(() => {
    setWastePriceFilter({
      search: searchText || undefined,
      warehouse: selectedWarehouses.length > 0 ? selectedWarehouses : undefined,
      minDays: minDays,
      maxDays: maxDays,
      status: selectedStatus !== 'all' ? selectedStatus as any : undefined,
    });
  }, [searchText, selectedWarehouses, minDays, maxDays, selectedStatus, setWastePriceFilter]);

  // Set form values when configuration modal opens
  useEffect(() => {
    if (isConfigModalVisible && wasteConfiguration) {
      configForm.setFieldsValue(wasteConfiguration);
    }
  }, [isConfigModalVisible, wasteConfiguration, configForm]);

  // Filter waste prices
  const filteredWastePrices = useMemo(() => {
    let filtered = wastePrices;
    
    if (searchText) {
      filtered = filtered.filter(wp => 
        wp.productName.toLowerCase().includes(searchText.toLowerCase()) ||
        wp.warehouseName.toLowerCase().includes(searchText.toLowerCase()) ||
        wp.categoryName.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    if (selectedWarehouses.length > 0) {
      filtered = filtered.filter(wp => selectedWarehouses.includes(wp.warehouseId));
    }
    
    // Category filtering
    if (selectedLevel1 !== 'all') {
      filtered = filtered.filter(wp => wp.categoryLevel1Id === selectedLevel1);
    }
    if (selectedLevel2 !== 'all') {
      filtered = filtered.filter(wp => wp.categoryLevel2Id === selectedLevel2);
    }
    if (selectedLevel3 !== 'all') {
      filtered = filtered.filter(wp => wp.categoryLevel3Id === selectedLevel3);
    }
    if (selectedLevel4 !== 'all') {
      filtered = filtered.filter(wp => wp.categoryLevel4Id === selectedLevel4);
    }
    
    if (minDays !== undefined) {
      filtered = filtered.filter(wp => wp.daysUntilExpiry >= minDays);
    }
    
    if (maxDays !== undefined) {
      filtered = filtered.filter(wp => wp.daysUntilExpiry <= maxDays);
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(wp => wp.status === selectedStatus);
    }
    
    return filtered;
  }, [wastePrices, searchText, selectedWarehouses, selectedLevel1, selectedLevel2, selectedLevel3, selectedLevel4, minDays, maxDays, selectedStatus]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalWasteValue = filteredWastePrices.reduce((sum, wp) => sum + wp.projectedWasteValue, 0);
    const criticalItems = filteredWastePrices.filter(wp => wp.daysUntilExpiry <= 3).length;
    const pendingItems = filteredWastePrices.filter(wp => wp.status === 'pending').length;
    const topItems = filteredWastePrices
      .sort((a, b) => b.projectedWasteValue - a.projectedWasteValue)
      .slice(0, 5);

    return { totalWasteValue, criticalItems, pendingItems, topItems };
  }, [filteredWastePrices]);

  // Handle confirm waste price
  const handleConfirmPrice = async (wastePrice: WastePrice, confirmedPrice?: number) => {
    try {
      const price = confirmedPrice || wastePrice.suggestedWastePrice;
      await confirmWastePrice(wastePrice._id!, price, currentUserId);
      messageApi.success('Waste price confirmed and applied successfully');
    } catch (error) {
      messageApi.error('Failed to confirm waste price');
    }
  };

  // Handle reject waste price
  const handleRejectPrice = async (wastePrice: WastePrice) => {
    try {
      await rejectWastePrice(wastePrice._id!, currentUserId);
      messageApi.success('Waste price rejected');
    } catch (error) {
      messageApi.error('Failed to reject waste price');
    }
  };

  // Handle bulk confirm
  const handleBulkConfirm = async () => {
    try {
      await bulkConfirmWastePrices(selectedRowKeys as string[], currentUserId);
      messageApi.success(`${selectedRowKeys.length} waste prices confirmed and applied`);
      setSelectedRowKeys([]);
    } catch (error) {
      messageApi.error('Failed to bulk confirm waste prices');
    }
  };

  // Handle edit price
  const handleEditPrice = (wastePrice: WastePrice) => {
    setEditingPrice(wastePrice);
    editForm.setFieldsValue({
      confirmedPrice: wastePrice.suggestedWastePrice,
      notes: wastePrice.notes || ''
    });
    setIsEditModalVisible(true);
  };

  // Handle save edited price
  const handleSaveEditedPrice = async () => {
    try {
      const values = await editForm.validateFields();
      if (editingPrice) {
        await confirmWastePrice(editingPrice._id!, values.confirmedPrice, currentUserId, values.notes);
        messageApi.success('Waste price updated and applied successfully');
        setIsEditModalVisible(false);
        setEditingPrice(null);
      }
    } catch (error) {
      messageApi.error('Failed to update waste price');
    }
  };

  // Handle configuration update
  const handleConfigUpdate = async () => {
    try {
      const values = await configForm.validateFields();
      if (wasteConfiguration) {
        await updateWasteConfiguration({
          ...wasteConfiguration,
          ...values
        }, currentUserId);
        messageApi.success('Configuration updated successfully');
        setIsConfigModalVisible(false);
      }
    } catch (error) {
      messageApi.error('Failed to update configuration');
    }
  };

  // Generate new waste prices
  const handleGeneratePrices = async () => {
    try {
      await generateWastePrices();
      messageApi.success('Waste prices generated successfully');
    } catch (error) {
      messageApi.error('Failed to generate waste prices');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      fixed: 'left' as const,
      render: (name: string, record: WastePrice) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.categoryName}</div>
        </div>
      ),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 200,
      render: (name: string) => (
        <Tag color="blue" style={{ maxWidth: '100%', wordBreak: 'break-word', whiteSpace: 'normal' }}>
          {name}
        </Tag>
      ),
    },
    {
      title: 'Stock Qty',
      dataIndex: 'quantityOnHand',
      key: 'quantityOnHand',
      width: 100,
      align: 'center' as const,
      render: (qty: number) => (
        <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {qty}
        </div>
      ),
    },
    {
      title: 'Days Until Expiry',
      dataIndex: 'daysUntilExpiry',
      key: 'daysUntilExpiry',
      width: 140,
      align: 'center' as const,
      render: (days: number) => {
        const urgency = getUrgencyLevel(days);
        const color = getUrgencyColor(days);
        return (
          <Tag color={color} style={{ fontWeight: 'bold' }}>
            {days} days
          </Tag>
        );
      },
    },
    {
      title: 'Buying Price',
      dataIndex: 'buyingPrice',
      key: 'buyingPrice',
      width: 120,
      align: 'center' as const,
      render: (price: number) => (
        <div style={{ color: '#722ed1', fontWeight: 'bold' }}>
          ₺{price.toFixed(2)}
        </div>
      ),
    },
    {
      title: 'Selling Price',
      dataIndex: 'originalSellingPrice',
      key: 'originalSellingPrice',
      width: 120,
      align: 'center' as const,
      render: (price: number) => (
        <div style={{ color: '#722ed1', fontWeight: 'bold' }}>
          ₺{price.toFixed(2)}
        </div>
      ),
    },
    {
      title: 'Current Margin %',
      dataIndex: 'marginPercent',
      key: 'marginPercent',
      width: 120,
      align: 'center' as const,
      render: (margin: number, record: WastePrice) => {
        const currentMargin = ((record.originalSellingPrice - record.buyingPrice) / record.buyingPrice) * 100;
        return (
          <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
            {currentMargin.toFixed(1)}%
          </div>
        );
      },
    },
    {
      title: 'Projected Waste Value',
      dataIndex: 'projectedWasteValue',
      key: 'projectedWasteValue',
      width: 160,
      align: 'center' as const,
      render: (value: number) => (
        <div style={{ color: '#fa8c16', fontWeight: 'bold' }}>
          ₺{value.toFixed(2)}
        </div>
      ),
    },
    {
      title: 'Suggested Waste Price',
      dataIndex: 'suggestedWastePrice',
      key: 'suggestedWastePrice',
      width: 160,
      align: 'center' as const,
      render: (price: number, record: WastePrice) => (
        <div>
          <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
            ₺{price.toFixed(2)}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            -{record.discountPercent.toFixed(1)}%
          </div>
        </div>
      ),
    },
    {
      title: 'New Margin %',
      dataIndex: 'marginPercent',
      key: 'marginPercent',
      width: 120,
      align: 'center' as const,
      render: (margin: number) => (
        <div style={{ color: margin >= 5 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
          {margin.toFixed(1)}%
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => {
        const colorMap = {
          pending: 'orange',
          confirmed: 'blue',
          applied: 'green',
          rejected: 'red'
        };
        return (
          <Tag color={colorMap[status as keyof typeof colorMap]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: WastePrice) => (
        <Space size="small">
          <Tooltip title="Edit price">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditPrice(record)}
              disabled={record.status !== 'pending'}
            />
          </Tooltip>
          <Tooltip title="Confirm suggested price">
            <Button
              type="text"
              icon={<CheckOutlined />}
              onClick={() => handleConfirmPrice(record)}
              disabled={record.status !== 'pending'}
              style={{ color: '#52c41a' }}
            />
          </Tooltip>
          <Tooltip title="Reject">
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => handleRejectPrice(record)}
              disabled={record.status !== 'pending'}
              style={{ color: '#ff4d4f' }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Waste Price Management</Title>
          <Text type="secondary">
            Manage waste pricing for products approaching expiry across warehouses.
          </Text>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleGeneratePrices}
              loading={loading}
            >
              Generate Prices
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setIsConfigModalVisible(true)}
            >
              Configuration
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Projected Waste Value"
              value={summaryStats.totalWasteValue}
              precision={2}
              prefix="₺"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Critical Items (0-3 days)"
              value={summaryStats.criticalItems}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Confirmation"
              value={summaryStats.pendingItems}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div>
              <Text strong>Top 5 Highest Value</Text>
              <List
                size="small"
                dataSource={summaryStats.topItems}
                renderItem={(item) => (
                  <List.Item style={{ padding: '4px 0' }}>
                    <Text style={{ fontSize: '12px' }}>
                      {item.productName} - ₺{item.projectedWasteValue.toFixed(0)}
                    </Text>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search products..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={8} md={3}>
            <Select
              placeholder="Level 1"
              style={{ width: '100%' }}
              value={selectedLevel1}
              onChange={handleLevel1Change}
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">Level 1</Option>
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={3}>
            <Select
              placeholder="Level 2"
              style={{ width: '100%' }}
              value={selectedLevel2}
              onChange={handleLevel2Change}
              disabled={selectedLevel1 === 'all'}
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">Level 2</Option>
              {selectedLevel1 !== 'all' && categories.find(cat => cat.id === selectedLevel1)?.children?.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={3}>
            <Select
              placeholder="Level 3"
              style={{ width: '100%' }}
              value={selectedLevel3}
              onChange={handleLevel3Change}
              disabled={selectedLevel2 === 'all'}
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">Level 3</Option>
              {selectedLevel1 !== 'all' && selectedLevel2 !== 'all' && 
                categories.find(cat => cat.id === selectedLevel1)?.children
                  ?.find(cat => cat.id === selectedLevel2)?.children?.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={3}>
            <Select
              placeholder="Level 4"
              style={{ width: '100%' }}
              value={selectedLevel4}
              onChange={handleLevel4Change}
              disabled={selectedLevel3 === 'all'}
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">Level 4</Option>
              {selectedLevel1 !== 'all' && selectedLevel2 !== 'all' && selectedLevel3 !== 'all' &&
                categories.find(cat => cat.id === selectedLevel1)?.children
                  ?.find(cat => cat.id === selectedLevel2)?.children
                  ?.find(cat => cat.id === selectedLevel3)?.children?.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="Warehouse"
              style={{ width: '100%' }}
              mode="multiple"
              value={selectedWarehouses}
              onChange={setSelectedWarehouses}
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {warehouses.map(warehouse => (
                <Option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={3}>
            <InputNumber
              placeholder="Min Days"
              style={{ width: '100%' }}
              min={0}
              value={minDays}
              onChange={(value) => setMinDays(value || undefined)}
            />
          </Col>
          <Col xs={12} sm={8} md={3}>
            <InputNumber
              placeholder="Max Days"
              style={{ width: '100%' }}
              min={0}
              value={maxDays}
              onChange={(value) => setMaxDays(value || undefined)}
            />
          </Col>
          <Col xs={12} sm={8} md={3}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              value={selectedStatus}
              onChange={setSelectedStatus}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="applied">Applied</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Space>
              <Button
                type="primary"
                onClick={handleBulkConfirm}
                disabled={selectedRowKeys.length === 0}
              >
                Confirm Selected ({selectedRowKeys.length})
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Waste Prices Table */}
      <Card>
        <ClientOnlyTable
          dataSource={filteredWastePrices}
          columns={columns}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record: WastePrice) => ({
              disabled: record.status !== 'pending',
            }),
          }}
          pagination={{
            total: filteredWastePrices.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1500 }}
          rowKey="_id"
        />
      </Card>

      {/* Edit Price Modal */}
      <Modal
        title="Edit Waste Price"
        open={isEditModalVisible}
        onOk={handleSaveEditedPrice}
        onCancel={() => setIsEditModalVisible(false)}
        okText="Confirm & Apply"
        cancelText="Cancel"
      >
        {editingPrice && (
          <Form form={editForm} layout="vertical">
            <Form.Item label="Product">
              <Text strong>{editingPrice.productName}</Text>
            </Form.Item>
            <Form.Item label="Warehouse">
              <Text>{editingPrice.warehouseName}</Text>
            </Form.Item>
            <Form.Item label="Days Until Expiry">
              <Text>{editingPrice.daysUntilExpiry} days</Text>
            </Form.Item>
            <Form.Item label="Suggested Price">
              <Text>₺{editingPrice.suggestedWastePrice.toFixed(2)}</Text>
            </Form.Item>
            <Form.Item
              name="confirmedPrice"
              label="Confirmed Price"
              rules={[{ required: true, message: 'Please enter confirmed price' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={editingPrice.buyingPrice * 1.05} // Minimum 5% margin
                max={editingPrice.originalSellingPrice}
                precision={2}
                prefix="₺"
              />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={3} placeholder="Optional notes..." />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Configuration Modal */}
      <Modal
        title="Waste Price Configuration"
        open={isConfigModalVisible}
        onOk={handleConfigUpdate}
        onCancel={() => setIsConfigModalVisible(false)}
        okText="Save Configuration"
        cancelText="Cancel"
        width={800}
      >
        {wasteConfiguration && (
          <Form form={configForm} layout="vertical" initialValues={wasteConfiguration}>
            <Form.Item label="Minimum Margin %" name="minMarginPercent">
              <InputNumber min={0} max={50} precision={1} />
            </Form.Item>
            <Form.Item label="Maximum Discount %" name="maxDiscountPercent">
              <InputNumber min={0} max={100} precision={1} />
            </Form.Item>
            <Divider>Aggression Tiers</Divider>
            <Form.List name="aggressionTiers">
              {(fields) => (
                <>
                  {fields.map((field) => (
                    <Card key={field.key} size="small" style={{ marginBottom: '16px' }}>
                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item
                            name={[field.name, 'name']}
                            label="Name"
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            name={[field.name, 'minDays']}
                            label="Min Days"
                          >
                            <InputNumber min={0} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            name={[field.name, 'maxDays']}
                            label="Max Days"
                          >
                            <InputNumber min={0} />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            name={[field.name, 'baseDiscount']}
                            label="Base Discount %"
                          >
                            <InputNumber min={0} max={100} precision={1} />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            name={[field.name, 'dailyIncrement']}
                            label="Daily Increment %"
                          >
                            <InputNumber min={0} precision={1} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </>
              )}
            </Form.List>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default WastePricePage;
