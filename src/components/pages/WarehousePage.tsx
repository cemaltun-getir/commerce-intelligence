'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Card,
  Row,
  Col,
  Typography,
  Tooltip
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';
import { Warehouse } from '@/types';
import ClientOnlyTable from '../common/ClientOnlyTable';

const { Option } = Select;
const { Title } = Typography;
const { Search } = Input;

const WarehousePage: React.FC = () => {
  const {
    warehouses,
    loading,
    fetchWarehouses,
  } = useAppStore();

  const [filters, setFilters] = useState({
    search: '',
    city: '',
    region: '',
    domain: '',
    demography: '',
    size: ''
  });

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // Filter warehouses based on current filters
  const filteredWarehouses = warehouses.filter(warehouse => {
    return (
      (!filters.search || 
        warehouse.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        warehouse.province.toLowerCase().includes(filters.search.toLowerCase()) ||
        warehouse.region.toLowerCase().includes(filters.search.toLowerCase())
      ) &&
      (!filters.city || warehouse.province === filters.city) &&
      (!filters.region || warehouse.region === filters.region) &&
      (!filters.domain || (warehouse.domains || []).includes(filters.domain as any)) &&
      (!filters.demography || warehouse.demography === filters.demography) &&
      (!filters.size || warehouse.size === filters.size)
    );
  });

  // Get unique values for filter dropdowns
  const uniqueCities = [...new Set(warehouses.map(w => w.province))];
  const uniqueRegions = [...new Set(warehouses.map(w => w.region))];

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleCityChange = (value: string) => {
    setFilters(prev => ({ ...prev, city: value }));
  };

  const handleRegionChange = (value: string) => {
    setFilters(prev => ({ ...prev, region: value }));
  };

  const handleDomainChange = (value: string) => {
    setFilters(prev => ({ ...prev, domain: value }));
  };

  const handleDemographyChange = (value: string) => {
    setFilters(prev => ({ ...prev, demography: value }));
  };

  const handleSizeChange = (value: string) => {
    setFilters(prev => ({ ...prev, size: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      city: '',
      region: '',
      domain: '',
      demography: '',
      size: ''
    });
  };

  const columns: ColumnsType<Warehouse> = [
    {
      title: 'Warehouse Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => (
        <div style={{ fontWeight: 500 }}>{name}</div>
      )
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.province}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.region}</div>
        </div>
      )
    },
    {
      title: 'Domain',
      dataIndex: 'domains',
      key: 'domains',
      render: (domains: string[]) => {
        const colorMap: Record<string, string> = {
          'Getir': 'blue',
          'Getir Büyük': 'green',
          'Getir Express': 'orange',
          'Getir Market': 'purple'
        };
        return (
          <Space wrap>
            {domains && domains.length > 0 ? (
              domains.map((domain, index) => (
                <Tag key={index} color={colorMap[domain] || 'default'}>
                  {domain}
                </Tag>
              ))
            ) : (
              <Tag color="default">No Domain</Tag>
            )}
          </Space>
        );
      },
      filters: [...new Set(warehouses.flatMap(w => w.domains || []))].map(domain => ({
        text: domain,
        value: domain
      })),
      onFilter: (value, record) => (record.domains || []).includes(value as any)
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: string) => {
        const colorMap: Record<string, string> = {
          'Micro': 'default',
          'Mini': 'blue',
          'Midi': 'green',
          'Maxi': 'orange',
          'GB Midi': 'purple',
          'GB Maxi': 'red'
        };
        return (
          <Tag color={colorMap[size] || 'default'}>
            {size}
          </Tag>
        );
      },
      filters: [...new Set(warehouses.map(w => w.size))].map(size => ({
        text: size,
        value: size
      })),
      onFilter: (value, record) => record.size === value
    },
    {
      title: 'Demography',
      dataIndex: 'demography',
      key: 'demography',
      render: (demography: string) => (
        <Tag color="purple">{demography}</Tag>
      ),
      filters: [...new Set(warehouses.map(w => w.demography))].map(demography => ({
        text: demography,
        value: demography
      })),
      onFilter: (value, record) => record.demography === value
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Warehouse Management</Title>
        </Col>
        <Col>
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchWarehouses}
            loading={loading}
          >
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {warehouses.length}
              </div>
              <div style={{ color: '#666' }}>Total Warehouses</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {warehouses.filter(w => (w.domains || []).includes('Getir')).length}
              </div>
              <div style={{ color: '#666' }}>Getir</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                {warehouses.filter(w => (w.domains || []).includes('Getir Büyük')).length}
              </div>
              <div style={{ color: '#666' }}>Getir Büyük</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                {uniqueCities.length}
              </div>
              <div style={{ color: '#666' }}>Cities</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={4}>
            <Search 
              placeholder="Search warehouses..." 
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onSearch={handleSearch}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select 
              placeholder="City" 
              style={{ width: '100%' }}
              value={filters.city || undefined}
              onChange={handleCityChange}
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {uniqueCities.map(city => (
                <Option key={city} value={city}>{city}</Option>
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
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {uniqueRegions.map(region => (
                <Option key={region} value={region}>{region}</Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select 
              placeholder="Domain" 
              style={{ width: '100%' }}
              value={filters.domain || undefined}
              onChange={handleDomainChange}
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {[...new Set(warehouses.flatMap(w => w.domains || []))].map(domain => (
                <Option key={domain} value={domain}>{domain}</Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select 
              placeholder="Demography" 
              style={{ width: '100%' }}
              value={filters.demography || undefined}
              onChange={handleDemographyChange}
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {[...new Set(warehouses.map(w => w.demography))].map(demography => (
                <Option key={demography} value={demography}>{demography}</Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select 
              placeholder="Size" 
              style={{ width: '100%' }}
              value={filters.size || undefined}
              onChange={handleSizeChange}
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {[...new Set(warehouses.map(w => w.size))].map(size => (
                <Option key={size} value={size}>{size}</Option>
              ))}
            </Select>
          </Col>
          <Col span={2}>
            <Space>
              <Button 
                icon={<FilterOutlined />}
                onClick={clearAllFilters}
              >
                Clear
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <ClientOnlyTable
        dataSource={filteredWarehouses}
        columns={columns}
        loading={loading}
        pagination={{
          total: filteredWarehouses.length,
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total, range) => {
            const totalWarehouses = warehouses.length;
            const filtered = filteredWarehouses.length;
            return filtered !== totalWarehouses 
              ? `${range[0]}-${range[1]} of ${total} filtered items (${totalWarehouses} total)` 
              : `${range[0]}-${range[1]} of ${total} items`;
          },
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        rowKey="id"
      />
    </div>
  );
};

export default WarehousePage; 