import React from 'react';
import { Button } from 'antd';
import { api } from '../../shared/utils/rpc';
import { shortAddr } from '../../shared/utils/format';
import { SiteHeader } from '../components/SiteHeader';
import { SignerCard } from '../components/SignerCard';

const Row: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="arc-row" style={{ justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid #1B1E27' }}>
    <span style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 500 }}>{label}</span>
    <span className={mono ? 'arc-mono' : ''} style={{ fontSize: 13, color: '#fff' }}>{value}</span>
  </div>
);

export const SignTypedDataApproval: React.FC<{ req: any; state: any; onDone: () => void }> = ({ req, onDone }) => {
  const { payload, address } = req.data;
  async function approve() { await api.resolveApproval(req.id, true); onDone(); window.close(); }
  async function reject() { await api.rejectApproval(req.id); onDone(); window.close(); }

  return (
    <div style={{ minHeight: '100vh', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader origin={req.origin} title="Sign typed data" subtitle="Off-chain message — no gas, no funds move." />

      <div style={{ padding: '14px 16px 4px' }}>
        <SignerCard address={address} />
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        <div
          style={{
            background: 'linear-gradient(180deg, #11131A 0%, #0A0B0F 100%)',
            border: '1px solid #1B1E27',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '10px 14px', fontSize: 11, color: '#5A5F6E', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
            Domain
          </div>
          <Row label="Primary type" value={payload?.primaryType || '—'} />
          <Row label="Name" value={payload?.domain?.name || '—'} />
          <Row label="Chain ID" value={payload?.domain?.chainId ?? '—'} mono />
          <Row
            label="Contract"
            value={payload?.domain?.verifyingContract ? shortAddr(payload.domain.verifyingContract, 6) : '—'}
            mono
          />
        </div>
      </div>

      <div style={{ padding: '14px 16px 6px' }}>
        <div style={{ fontSize: 11, color: '#5A5F6E', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6, paddingLeft: 2 }}>
          Message
        </div>
        <div
          className="arc-mono"
          style={{
            background: '#0A0B0F',
            border: '1px solid #1B1E27',
            borderRadius: 12,
            padding: 12,
            fontSize: 11,
            lineHeight: 1.6,
            maxHeight: 200,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: '#A1A8B5',
          }}
        >
          {JSON.stringify(payload?.message, null, 2)}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          padding: '12px 16px 16px',
          borderTop: '1px solid #1B1E27',
          background: 'rgba(10, 11, 15, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          gap: 10,
        }}
      >
        <Button size="large" block onClick={reject}>Reject</Button>
        <Button type="primary" size="large" block onClick={approve}>Sign</Button>
      </div>
    </div>
  );
};
