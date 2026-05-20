import React from 'react';
import { CopyOutlined, LinkOutlined, GlobalOutlined } from '@ant-design/icons';
import { message, Tooltip } from 'antd';
import { useAppSelector } from '../../shared/store';
import { copy } from '../../shared/utils/format';

const RoundBtn: React.FC<{ icon: React.ReactNode; onClick?: () => void; title?: string }> = ({ icon, onClick, title }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <Tooltip title={title} placement="bottom">
      <div
        style={{
          width: 34, height: 34, borderRadius: 17,
          background: hover ? '#1B1E27' : '#15171E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#FFFFFF', fontSize: 14,
          transition: 'background 160ms ease',
        }}
        onClick={onClick}
      >
        {icon}
      </div>
    </Tooltip>
  );
};

export const TopActions: React.FC = () => {
  const { selectedAddress } = useAppSelector((s) => s);
  return (
    <div className="arc-row" style={{ gap: 8 }}>
      <RoundBtn
        icon={<CopyOutlined />}
        title="Copy address"
        onClick={() => { if (selectedAddress) { copy(selectedAddress); message.success('Address copied'); } }}
      />
      <RoundBtn icon={<LinkOutlined />} title="Connected sites" onClick={() => window.location.hash = '#/settings/sites'} />
      <RoundBtn icon={<GlobalOutlined />} title="Network" />
    </div>
  );
};
