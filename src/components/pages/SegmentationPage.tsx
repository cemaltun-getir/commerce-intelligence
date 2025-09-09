'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Typography,
  Tooltip,
  Popconfirm,
  Checkbox,
  Dropdown,
  Menu,
  App,
  Input,
  Select
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
import { getDomainColor, getPriceLocationColor } from '@/utils/badgeColors';
import ClientOnlyTable from '../common/ClientOnlyTable';

const { Title, Text } = Typography;
const { Option } = Select;

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

  const [filters, setFilters] = useState({
    search: '',
    province: '',
    district: '',
    region: '',
    domain: ''
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    fetchSegments();
    fetchWarehouses();
    fetchPriceLocations();
  }, [fetchSegments, fetchWarehouses, fetchPriceLocations]);

  // Initialize filtered data when segments load
  const filteredData = useMemo(() => {
    let filtered = [...segments];

    // Search filter (name or ID)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((item: Segment) =>
        item.name.toLowerCase().includes(searchLower) ||
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
              <Tag key={index} color={getDomainColor(domain)}>
                {domain}
              </Tag>
            ))
          ) : (
            <Tag color={getDomainColor(undefined)}>No Domain</Tag>
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
              <Tag color={getPriceLocationColor(undefined)} style={{ fontSize: '11px' }}>
                ⚠️ Not Set
              </Tag>
            );
          }
          const location = priceLocations.find(loc => loc.id === priceLocation);
          return (
            <Tag color={getPriceLocationColor(priceLocation)} style={{ fontSize: '11px' }}>
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
    router.push('/pricing/segmentation/new');
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
            placeholder="Search by name or ID"
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

    </div>
  );
};

export default SegmentationPage; 