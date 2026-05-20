import React from 'react';
import { ConfigProvider, theme } from 'antd';

export const AntdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ConfigProvider
    theme={{
      algorithm: theme.darkAlgorithm,
      token: {
        colorPrimary: '#4D8EE9',
        colorBgBase: '#000000',
        colorBgContainer: '#0A0B0F',
        colorBgElevated: '#11131A',
        colorBorder: '#1B1E27',
        colorBorderSecondary: '#1B1E27',
        colorText: '#FFFFFF',
        colorTextSecondary: '#9CA3AF',
        colorTextTertiary: '#5A5F6E',
        colorError: '#FF5C5C',
        colorWarning: '#FFB020',
        colorSuccess: '#4D8EE9',
        colorInfo: '#5FBFFF',
        borderRadius: 12,
        borderRadiusLG: 18,
        fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
        motionDurationMid: '180ms',
      },
      components: {
        Button: {
          controlHeight: 44,
          fontWeight: 600,
        },
        Input: {
          controlHeight: 44,
        },
      },
    }}
  >
    {children}
  </ConfigProvider>
);
