import React from 'react';
import { ArrowUpOutlined, ArrowDownOutlined, SwapOutlined, HistoryOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

const Tile: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 8, cursor: 'pointer',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <div
        style={{
          width: 52, height: 52, borderRadius: 26,
          background: hover ? '#1B1E27' : '#15171E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: '#FFFFFF',
          transition: 'background 160ms ease',
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#FFFFFF', letterSpacing: '-0.005em' }}>{label}</div>
    </div>
  );
};

export const ActionBar: React.FC = () => {
  const nav = useNavigate();
  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px 16px 18px' }}>
      <Tile icon={<ArrowUpOutlined />} label="Send" onClick={() => nav('/send')} />
      <Tile icon={<ArrowDownOutlined />} label="Receive" onClick={() => nav('/receive')} />
      <Tile icon={<SwapOutlined />} label="Swap" onClick={() => message.info('Swap coming soon')} />
      <Tile icon={<HistoryOutlined />} label="History" onClick={() => nav('/activity')} />
      <Tile icon={<AppstoreOutlined />} label="More" onClick={() => nav('/settings')} />
    </div>
  );
};
