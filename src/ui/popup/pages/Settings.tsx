import React from 'react';
import {
  ArrowLeftOutlined, RightOutlined, UserOutlined, AppstoreOutlined,
  SafetyOutlined, LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ARC_TESTNET } from '../../../constants/chain';
import { useAppDispatch, useAppSelector, actions } from '../../shared/store';
import { api } from '../../shared/utils/rpc';
import { PixelAvatar } from '../components/PixelAvatar';
import { shortAddr } from '../../shared/utils/format';

type RowProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  sub?: string;
  danger?: boolean;
};

const Row: React.FC<RowProps> = ({ icon, label, onClick, sub, danger }) => (
  <div
    onClick={onClick}
    className="arc-row arc-tap"
    style={{
      padding: '14px 16px',
      cursor: 'pointer',
      gap: 12,
    }}
  >
    <div
      style={{
        width: 32, height: 32, borderRadius: 16,
        background: '#15171E',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: danger ? '#FF5C5C' : '#FFFFFF',
        fontSize: 15,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.005em', color: danger ? '#FF5C5C' : '#FFFFFF' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>}
    </div>
    <RightOutlined style={{ color: '#5A5F6E', fontSize: 11 }} />
  </div>
);

const Group: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ marginTop: 14 }}>
    <div
      style={{
        margin: '0 16px',
        background: '#0F1117',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {React.Children.toArray(children).map((c, i) => (
        <div key={i} style={{ borderTop: i === 0 ? 'none' : '1px solid #15171E' }}>
          {c}
        </div>
      ))}
    </div>
  </div>
);

export const Settings: React.FC = () => {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const { accounts, selectedAddress } = useAppSelector((s) => s);
  const selected = accounts.find((a) => a.address.toLowerCase() === (selectedAddress || '').toLowerCase()) || accounts[0];

  async function lock() {
    await api.lock();
    dispatch(actions.setLocked(true));
    nav('/unlock', { replace: true });
  }

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
        <strong style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>Settings</strong>
      </div>

      {selected && (
        <div
          className="arc-row"
          style={{
            margin: '4px 16px 0',
            padding: 14,
            background: '#0F1117',
            borderRadius: 14,
            gap: 12,
          }}
        >
          <PixelAvatar address={selected.address} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>{selected.name}</div>
            <div className="arc-mono" style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{shortAddr(selected.address, 6)}</div>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 999,
              background: '#15171E',
              fontSize: 11,
              fontWeight: 500,
              color: '#FFFFFF',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#22C55E' }} />
            Arc Testnet
          </div>
        </div>
      )}

      <Group>
        <Row icon={<UserOutlined />} label="Accounts" sub={`${accounts.length} account${accounts.length === 1 ? '' : 's'}`} onClick={() => nav('/settings/accounts')} />
        <Row icon={<AppstoreOutlined />} label="Connected sites" onClick={() => nav('/settings/sites')} />
        <Row icon={<SafetyOutlined />} label="Security & backup" sub="Reveal seed, export key" onClick={() => nav('/settings/security')} />
        <Row icon={<LogoutOutlined />} label="Lock wallet" onClick={lock} danger />
      </Group>

      <div
        className="arc-row"
        style={{
          justifyContent: 'center',
          gap: 16,
          padding: '22px 16px 6px',
          fontSize: 12,
          color: '#9CA3AF',
        }}
      >
        <a href="https://docs.arc.io" target="_blank" rel="noreferrer" style={{ color: '#9CA3AF' }}>Docs</a>
        <span style={{ color: '#262A36' }}>·</span>
        <a href={ARC_TESTNET.explorer} target="_blank" rel="noreferrer" style={{ color: '#9CA3AF' }}>Explorer</a>
      </div>
      <div style={{ padding: '4px 16px 20px', textAlign: 'center', fontSize: 10, color: '#5A5F6E', letterSpacing: '0.04em' }}>
        Otterly · v0.1.0
      </div>
    </div>
  );
};
