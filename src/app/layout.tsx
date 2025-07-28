import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import AntdCompatProvider from '../components/layout/AntdCompatProvider';
import WarningSuppress from '../components/layout/WarningSuppress';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Getir Commerce Intelligence",
  description: "Competitive pricing intelligence and product matching platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AntdRegistry>
          <AntdCompatProvider>
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: '#7c3aed',
                  colorBgContainer: '#ffffff',
                },
                components: {
                  Button: {
                    // Disable wave effect to prevent React compatibility warning
                    defaultActiveColor: 'transparent',
                  },
                },
              }}
              wave={{ disabled: true }}
            >
              <App>
                <WarningSuppress />
                {children}
              </App>
            </ConfigProvider>
          </AntdCompatProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
