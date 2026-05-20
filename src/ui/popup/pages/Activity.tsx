import React, { useEffect, useMemo, useState } from 'react';
import { Dropdown, Empty } from 'antd';
import { BrandLoader } from '../components/BrandLoader';
import { ethers } from 'ethers';
import {
  ArrowLeftOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  SwapOutlined,
  FileTextOutlined,
  SafetyOutlined,
  GlobalOutlined,
  CaretDownOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../shared/store';
import { api } from '../../shared/utils/rpc';
import { explorerTx, formatUnits, shortAddr } from '../../shared/utils/format';
import { ARC_TESTNET } from '../../../constants/chain';

type TypeFilter = 'all' | 'send' | 'receive' | 'swap' | 'contract' | 'approve';

const TYPE_LABEL: Record<TypeFilter, string> = {
  all: 'All types',
  send: 'Send',
  receive: 'Receive',
  swap: 'Swap',
  contract: 'Contract interaction',
  approve: 'Approve',
};

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

type TxKind = {
  kind: TypeFilter;
  title: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
};

function classify(r: any, me: string): TxKind {
  const moves = (r.tokenTransfers || []) as any[];
  const meLc = (me || '').toLowerCase();
  const method = (r.method || '').toLowerCase();
  const dir = r.direction || (r.from?.toLowerCase() === meLc ? 'out' : 'in');
  const counterparty = dir === 'in' ? r.from : r.to;
  const nativeBn = ethers.BigNumber.from(r.value || '0');
  const hasNative = !nativeBn.isZero();

  const outMoves = moves.filter((m) => m.direction === 'out');
  const inMoves = moves.filter((m) => m.direction === 'in');
  const isSwap = outMoves.length > 0 && inMoves.length > 0;

  if (method.startsWith('approve')) {
    const tok = moves[0]?.symbol || r.tokenSymbol;
    return {
      kind: 'approve',
      title: tok ? `Approve ${tok}` : 'Approve',
      sub: shortAddr(r.to, 4),
      icon: <SafetyOutlined />,
      iconBg: 'rgba(255,180,77,0.12)',
      iconColor: '#FFB44D',
    };
  }
  if (isSwap) {
    return {
      kind: 'swap',
      title: 'Swap',
      sub: shortAddr(r.to, 4),
      icon: <SwapOutlined />,
      iconBg: 'rgba(95,191,255,0.12)',
      iconColor: '#5FBFFF',
    };
  }
  if (!moves.length && !hasNative && (r.data && r.data !== '0x')) {
    return {
      kind: 'contract',
      title: 'Contract interaction',
      sub: shortAddr(r.to, 4),
      icon: <FileTextOutlined />,
      iconBg: 'rgba(156,163,175,0.10)',
      iconColor: '#9CA3AF',
    };
  }
  if (dir === 'in') {
    return {
      kind: 'receive',
      title: 'Receive',
      sub: `From ${shortAddr(counterparty, 4)}`,
      icon: <ArrowDownOutlined />,
      iconBg: 'rgba(34,197,94,0.12)',
      iconColor: '#22C55E',
    };
  }
  if (dir === 'self') {
    return {
      kind: 'send',
      title: 'Self transfer',
      sub: `To ${shortAddr(counterparty, 4)}`,
      icon: <SwapOutlined />,
      iconBg: 'rgba(156,163,175,0.10)',
      iconColor: '#9CA3AF',
    };
  }
  return {
    kind: 'send',
    title: 'Send',
    sub: `To ${shortAddr(counterparty, 4)}`,
    icon: <ArrowUpOutlined />,
    iconBg: 'rgba(77,142,233,0.12)',
    iconColor: '#5FBFFF',
  };
}

const AmountLine: React.FC<{ sign: '+' | '-' | ''; amount: string; symbol: string; primary: boolean }> = ({
  sign, amount, symbol, primary,
}) => {
  const color = sign === '+' ? '#22C55E' : primary ? '#FFFFFF' : '#9CA3AF';
  return (
    <div
      style={{
        fontSize: primary ? 14 : 12,
        fontWeight: primary ? 700 : 600,
        color,
        letterSpacing: '-0.005em',
        lineHeight: 1.3,
        textAlign: 'right',
      }}
    >
      {sign}{amount} {symbol}
    </div>
  );
};

const Row: React.FC<{ r: any; me: string }> = ({ r, me }) => {
  const k = classify(r, me);
  const moves = (r.tokenTransfers || []) as any[];
  const nativeBn = ethers.BigNumber.from(r.value || '0');
  const hasNative = !nativeBn.isZero();
  const meLc = (me || '').toLowerCase();
  const failed = r.status === 'failed';
  const pending = r.status === 'pending';

  const amounts: { sign: '+' | '-' | ''; amount: string; symbol: string }[] = [];
  for (const m of moves) {
    const sign = m.direction === 'in' ? '+' : m.direction === 'self' ? '' : '-';
    amounts.push({ sign, amount: formatUnits(m.value, m.decimals, 4), symbol: m.symbol });
  }
  if (hasNative) {
    const dir = r.from?.toLowerCase() === meLc ? 'out' : 'in';
    amounts.push({
      sign: dir === 'in' ? '+' : '-',
      amount: formatUnits(r.value, ARC_TESTNET.nativeCurrency.decimals, 6),
      symbol: ARC_TESTNET.nativeCurrency.symbol,
    });
  }

  return (
    <a
      href={explorerTx(r.hash)}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 4px',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          width: 36, height: 36, borderRadius: 18,
          background: k.iconBg,
          color: k.iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {k.icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: failed ? '#FF8C8C' : '#FFFFFF',
            letterSpacing: '-0.005em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {k.title}
          {failed && <span style={{ marginLeft: 6, fontSize: 10, color: '#FF8C8C', fontWeight: 700 }}>FAILED</span>}
          {pending && <span style={{ marginLeft: 6, fontSize: 10, color: '#FFB44D', fontWeight: 700 }}>PENDING</span>}
        </div>
        <div style={{ fontSize: 12, color: '#5A5F6E', marginTop: 2 }} className="arc-mono">
          {k.sub}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, minWidth: 0 }}>
        {amounts.length === 0 ? (
          <div style={{ color: '#5A5F6E', fontSize: 13 }}>—</div>
        ) : (
          amounts.slice(0, 2).map((a, i) => (
            <AmountLine key={i} sign={a.sign} amount={a.amount} symbol={a.symbol} primary={i === 0} />
          ))
        )}
      </div>
    </a>
  );
};

const FilterPill: React.FC<{
  label: string;
  icon?: React.ReactNode;
  items: { key: string; label: string }[];
  selected: string;
  onSelect: (k: string) => void;
}> = ({ label, icon, items, selected, onSelect }) => {
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: items.map((it) => ({
          key: it.key,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
              <span style={{ flex: 1 }}>{it.label}</span>
              {selected === it.key && <CheckOutlined style={{ color: '#5FBFFF', fontSize: 12 }} />}
            </div>
          ),
          onClick: () => onSelect(it.key),
        })),
      }}
    >
      <button
        type="button"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          background: '#11131A',
          border: '1px solid #1B1E27',
          borderRadius: 10,
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {icon}
        <span>{label}</span>
        <CaretDownOutlined style={{ fontSize: 9, color: '#9CA3AF' }} />
      </button>
    </Dropdown>
  );
};

export const Activity: React.FC = () => {
  const nav = useNavigate();
  const { selectedAddress } = useAppSelector((s) => s);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  async function load() {
    if (!selectedAddress) return;
    const h: any = await api.txHistory(selectedAddress);
    setHistory(h);
    setLoading(false);
  }

  useEffect(() => {
    if (!selectedAddress) return;
    let mounted = true;
    setLoading(true);
    (async () => { await load(); })();
    const t = setInterval(() => mounted && load(), 12000);
    return () => { mounted = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddress]);

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return history;
    return history.filter((r) => classify(r, selectedAddress || '').kind === typeFilter);
  }, [history, typeFilter, selectedAddress]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const r of filtered) {
      const key = fmtDate(r.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div>
      <div className="arc-row" style={{ padding: '14px 16px', position: 'relative', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => nav('/')}
          style={{
            position: 'absolute', left: 12, top: 12,
            width: 32, height: 32, borderRadius: 10,
            background: 'transparent', border: 'none',
            color: '#FFFFFF', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowLeftOutlined />
        </button>
        <strong style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>History</strong>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '6px 16px 14px' }}>
        <FilterPill
          label="All networks"
          icon={<GlobalOutlined style={{ fontSize: 12, color: '#9CA3AF' }} />}
          items={[{ key: 'arc', label: 'Arc Testnet' }]}
          selected={'arc'}
          onSelect={() => undefined}
        />
        <FilterPill
          label={TYPE_LABEL[typeFilter]}
          items={[
            { key: 'all', label: 'All types' },
            { key: 'send', label: 'Send' },
            { key: 'receive', label: 'Receive' },
            { key: 'swap', label: 'Swap' },
            { key: 'contract', label: 'Contract interaction' },
            { key: 'approve', label: 'Approve' },
          ]}
          selected={typeFilter}
          onSelect={(k) => setTypeFilter(k as TypeFilter)}
        />
      </div>

      <div style={{ padding: '0 16px' }}>
        {loading && !history.length ? (
          <BrandLoader label="Loading history" />
        ) : grouped.length === 0 ? (
          <Empty description="No transactions yet" style={{ padding: 60 }} />
        ) : (
          grouped.map(([date, rows]) => (
            <div key={date} style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#5A5F6E',
                  letterSpacing: '0.02em',
                  padding: '8px 4px 4px',
                }}
              >
                {date}
              </div>
              <div>
                {rows.map((r) => <Row key={r.hash} r={r} me={selectedAddress || ''} />)}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
