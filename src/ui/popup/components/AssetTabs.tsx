import React from 'react';
import { message } from 'antd';

export type AssetTabKey = 'crypto' | 'defi' | 'nft' | 'approvals';

export const AssetTabs: React.FC<{ value: AssetTabKey; onChange: (k: AssetTabKey) => void }> = ({ value, onChange }) => {
  const tabs: { key: AssetTabKey; label: string; soon?: boolean }[] = [
    { key: 'crypto', label: 'Crypto' },
    { key: 'defi', label: 'DeFi', soon: true },
    { key: 'nft', label: 'NFT' },
    { key: 'approvals', label: 'Approvals' },
  ];
  return (
    <div className="arc-row" style={{ padding: '0 16px', gap: 22, borderBottom: '1px solid #1B1E27' }}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <div
            key={t.key}
            onClick={() => {
              if (t.soon) { message.info(`${t.label} coming soon`); return; }
              onChange(t.key);
            }}
            style={{
              padding: '12px 0',
              fontSize: 15,
              fontWeight: active ? 700 : 500,
              color: active ? '#fff' : '#5A5F6E',
              borderBottom: active ? '2px solid #FFFFFF' : '2px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              transition: 'color 180ms, border-color 180ms',
            }}
          >
            {t.label}
          </div>
        );
      })}
    </div>
  );
};
