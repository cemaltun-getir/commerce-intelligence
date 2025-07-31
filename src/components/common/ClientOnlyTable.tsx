'use client';

import React, { useState, useEffect } from 'react';
import { Table, TableProps } from 'antd';

interface ClientOnlyTableProps<T> extends TableProps<T> {
  fallback?: React.ReactNode;
}

export default function ClientOnlyTable<T extends Record<string, any>>({
  fallback,
  ...tableProps
}: ClientOnlyTableProps<T>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return fallback ? <>{fallback}</> : <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return <Table<T> {...tableProps} />;
} 