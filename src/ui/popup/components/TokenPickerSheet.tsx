import React, { useMemo, useState } from 'react';
import { Drawer, Input, Empty } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import { TokenIcon } from './TokenIcon';
import { formatUnits } from '../../shared/utils/format';

const PRICES: Record<string, number> = { USDC: 1.0, EURC: 1.085 };
const CHANGES: Record<string, number> = { USDC: 0.0, EURC: 0.12 };

type Props = {
  open: boolean;
  onClose: () => void;
  balances: any[];
  onPick: (idx: number) => void;
};

export const TokenPickerSheet: React.FC<Props> = ({ open, onClose, balances, onPick }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return balances.map((b, i) => ({ b, i }));
    return balances
      .map((b, i) => ({ b, i }))
      .filter(({ b }) =>
        b.symbol?.toLowerCase().includes(q) ||
        b.name?.toLowerCase().includes(q) ||
        b.address?.toLowerCase() === q,
      );
  }, [balances, query]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="bottom"
      height={520}
      closable={false}
      styles={{
        body: { padding: 0, background: '#0A0B0F' },
        content: {
          background: '#0A0B0F',
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          overflow: 'hidden',
          borderTop: '1px solid #1B1E27',
          boxShadow: '0 -24px 64px rgba(0,0,0,0.7)',
        },
        mask: { background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' },
      }}
    >
      <div style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#262A36' }} />
      </div>
      <div className="arc-row" style={{ padding: '10px 16px 6px', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>Select token</div>
        <CloseOutlined onClick={onClose} style={{ color: '#9CA3AF', cursor: 'pointer', padding: 6 }} />
      </div>

      <div style={{ padding: '8px 16px' }}>
        <Input
          size="large"
          prefix={<SearchOutlined style={{ color: '#5A5F6E' }} />}
          placeholder="Search name or address"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          allowClear
        />
      </div>

      <div className="arc-row" style={{ padding: '6px 16px 10px', gap: 8 }}>
        <div
          className="arc-row"
          style={{
            gap: 6,
            background: 'rgba(77,142,233,0.08)',
            border: '1px solid rgba(77,142,233,0.28)',
            borderRadius: 9,
            padding: '5px 10px',
            fontSize: 12,
            color: '#5FBFFF',
            fontWeight: 600,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#5FBFFF', boxShadow: '0 0 6px #5FBFFF' }} />
          Arc Testnet
        </div>
      </div>

      <div style={{ overflowY: 'auto', maxHeight: 360, paddingBottom: 16 }}>
        {filtered.length === 0 ? (
          <Empty description="No tokens" style={{ padding: 32 }} />
        ) : (
          filtered.map(({ b, i }) => {
            const sym = b.symbol?.toUpperCase();
            const amount = formatUnits(b.balance, b.decimals, 4);
            const price = PRICES[sym] ?? 0;
            const chg = CHANGES[sym] ?? 0;
            let usd = '';
            try {
              const human = parseFloat(ethers.utils.formatUnits(ethers.BigNumber.from(b.balance), b.decimals));
              if (price) usd = (human * price).toFixed(2);
            } catch { /* noop */ }
            return (
              <div
                key={b.address + i}
                className="arc-row arc-tap"
                onClick={() => { onPick(i); onClose(); }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  gap: 12,
                }}
              >
                <TokenIcon symbol={b.symbol} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>{b.symbol}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{amount}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>
                    {usd ? `$${usd}` : '—'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {price ? `$${price.toFixed(2)}` : (b.isNative ? 'Native' : 'ERC-20')}
                    {price && (
                      <span style={{ color: chg >= 0 ? '#22C55E' : '#FF5C5C', marginLeft: 6, fontWeight: 600 }}>
                        ({chg >= 0 ? '+' : ''}{chg.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Drawer>
  );
};
