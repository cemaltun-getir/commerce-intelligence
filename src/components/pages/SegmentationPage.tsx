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
    cities: [] as string[],
    regions: [] as string[],
    domains: [] as string[]
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

    // Cities filter
    if (filters.cities.length > 0) {
      filtered = filtered.filter((item: Segment) =>
        item.provinces?.some(city =>
          filters.cities.some(filterCity => 
            city.toLowerCase() === filterCity.toLowerCase()
          )
        )
      );
    }

    // Regions filter
    if (filters.regions.length > 0) {
      filtered = filtered.filter((item: Segment) =>
        item.regions?.some(region =>
          filters.regions.some(filterRegion => 
            region.toLowerCase() === filterRegion.toLowerCase()
          )
        )
      );
    }

    // Domains filter
    if (filters.domains.length > 0) {
      filtered = filtered.filter((item: Segment) =>
        item.domains?.some(domain => 
          filters.domains.some(filterDomain => 
            domain.toLowerCase() === filterDomain.toLowerCase()
          )
        )
      );
    }

    return filtered;
  }, [segments, filters]);

  // Get unique values for filter options
  const getUniqueValues = (field: 'provinces' | 'regions' | 'domains') => {
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
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>{name}</span>
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

  const handleCitiesChange = (value: string[]) => {
    setFilters(prev => ({ ...prev, cities: value }));
  };

  const handleRegionsChange = (value: string[]) => {
    setFilters(prev => ({ ...prev, regions: value }));
  };

  const handleDomainsChange = (value: string[]) => {
    setFilters(prev => ({ ...prev, domains: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      cities: [],
      regions: [],
      domains: []
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
        <Col span={6}>
          <Select
            mode="multiple"
            placeholder="All Cities"
            style={{ width: '100%' }}
            value={filters.cities}
            onChange={handleCitiesChange}
            allowClear
            maxTagCount="responsive"
            showSearch
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {getUniqueValues('provinces').map(city => (
              <Option key={city} value={city}>{city}</Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            mode="multiple"
            placeholder="All Regions"
            style={{ width: '100%' }}
            value={filters.regions}
            onChange={handleRegionsChange}
            allowClear
            maxTagCount="responsive"
            showSearch
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {getUniqueValues('regions').map(region => (
              <Option key={region} value={region}>{region}</Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            mode="multiple"
            placeholder="All Domains"
            style={{ width: '100%' }}
            value={filters.domains}
            onChange={handleDomainsChange}
            allowClear
            maxTagCount="responsive"
            showSearch
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {getUniqueValues('domains').map(domain => (
              <Option key={domain} value={domain}>{domain}</Option>
            ))}
          </Select>
        </Col>
      </Row>


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