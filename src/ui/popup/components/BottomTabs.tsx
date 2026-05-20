import React from 'react';
import { WalletOutlined, HistoryOutlined, SettingOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const items = [
  { key: '/', label: 'Wallet', icon: <WalletOutlined /> },
  { key: '/activity', label: 'Activity', icon: <HistoryOutlined /> },
  { key: '/settings', label: 'Settings', icon: <SettingOutlined /> },
];

export const BottomTabs: React.FC = () => {
  const loc = useLocation();
  const nav = useNavigate();
  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        display: 'flex',
        background: 'rgba(10, 11, 15, 0.92)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderTop: '1px solid #1B1E27',
        padding: '8px 0 10px',
        width: 360,
      }}
    >
      {items.map((it) => {
        const active = loc.pathname === it.key;
        return (
          <div
            key={it.key}
            onClick={() => nav(it.key)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', padding: '4px 0', cursor: 'pointer',
              color: active ? '#5FBFFF' : '#5A5F6E', gap: 3,
              transition: 'color 180ms cubic-bezier(0.32,0.72,0.32,1)',
            }}
          >
            <div style={{ fontSize: 18 }}>{it.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '-0.005em' }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
};
