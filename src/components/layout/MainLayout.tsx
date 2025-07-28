'use client';

import React, { useState } from 'react';
import { Layout, Menu, Typography, Avatar, Button } from 'antd';
import { 
  HomeOutlined, 
  TagsOutlined, 
  DollarOutlined, 
  BarChartOutlined,
  FileTextOutlined,
  SettingOutlined,
  RightOutlined,
  LeftOutlined,
  AppstoreOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Sider, Header, Content } = Layout;
const { Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: '/pricing',
      icon: <DollarOutlined />,
      label: 'Smart Pricing',
      children: [
        {
          key: '/pricing/segmentation',
          icon: <AppstoreOutlined />,
          label: 'Segmentation',
        },
        {
          key: '/pricing/index',
          icon: <LineChartOutlined />,
          label: 'Index',
        },
      ]
    },
    {
      key: '/boundary-rules',
      icon: <SettingOutlined />,
      label: 'Rulesets & Guardrails',
    },
    {
      key: '/waste-price',
      icon: <TagsOutlined />,
      label: 'Waste Price',
    },
    {
      key: '/newsfeed',
      icon: <FileTextOutlined />,
      label: 'NewsFeed',
    },
  ];

  const handleMenuClick = (e: any) => {
    router.push(e.key);
  };

  const getSelectedKeys = () => {
    if (pathname === '/') return ['/'];
    if (pathname.startsWith('/pricing')) {
      return [pathname];
    }
    return [pathname];
  };

  const getOpenKeys = () => {
    if (pathname.startsWith('/pricing')) {
      return ['/pricing'];
    }
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        trigger={null}
        style={{
          background: '#6B46C1',
        }}
        width={240}
      >
        <div style={{ 
          padding: collapsed ? '12px 8px' : '16px', 
          textAlign: 'center',
          position: 'relative',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          height: collapsed ? '64px' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {collapsed ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '6px',
            }}>
              <Title level={3} style={{ 
                color: '#FBBF24', 
                margin: 0,
                fontSize: '20px',
                fontWeight: 'bold',
              }}>
                g
              </Title>
              <Button
                type="text"
                icon={<RightOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '10px',
                  width: '20px',
                  height: '20px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0',
                  transition: 'all 0.2s ease',
                  minWidth: '20px',
                }}
                className="collapse-button"
              />
            </div>
          ) : (
            <>
              <Title level={3} style={{ 
                color: '#FBBF24', 
                margin: 0,
                paddingRight: '44px',
              }}>
                getir
              </Title>
              
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  fontSize: '12px',
                  width: '28px',
                  height: '28px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0',
                  transition: 'all 0.2s ease',
                  minWidth: '28px',
                }}
                className="collapse-button"
              />
            </>
          )}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          onClick={handleMenuClick}
          items={menuItems}
          style={{
            background: 'transparent',
            border: 'none',
          }}
          className="custom-menu"
        />
      </Sider>
      
      <Layout>
        <Header 
          style={{ 
            background: '#fff', 
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
              Commerce Intelligence
            </Title>
          </div>
        </Header>
        
        <Content style={{ 
          margin: '24px',
          background: '#fff',
          borderRadius: '8px',
          overflow: 'auto'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 