import React, { useState } from 'react';
import { Button, Checkbox } from 'antd';
import { api } from '../../shared/utils/rpc';
import { shortAddr } from '../../shared/utils/format';
import { SiteHeader } from '../components/SiteHeader';
import { SignerCard } from '../components/SignerCard';

export const ConnectApproval: React.FC<{ req: any; state: any; onDone: () => void }> = ({ req, state, onDone }) => {
  const accounts: any[] = state?.accounts || [];
  const [picked, setPicked] = useState<string[]>(
    state?.selectedAddress ? [state.selectedAddress] : (accounts[0] ? [accounts[0].address] : []),
  );

  async function approve() {
    await api.resolveApproval(req.id, picked);
    onDone();
    window.close();
  }
  async function reject() {
    await api.rejectApproval(req.id);
    onDone();
    window.close();
  }

  return (
    <div style={{ minHeight: '100vh', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader origin={req.origin} title="Connect wallet" subtitle="This site is requesting access to your accounts." />

      <div style={{ padding: '10px 16px 4px' }}>
        <div style={{ fontSize: 10, color: '#5A5F6E', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6, paddingLeft: 2 }}>
          Permissions
        </div>
        <div
          style={{
            background: '#11131A',
            border: '1px solid #1B1E27',
            borderRadius: 12,
            padding: '10px 12px',
            fontSize: 12,
            color: '#9CA3AF',
            lineHeight: 1.6,
          }}
        >
          <div>• View addresses and account balance</div>
          <div>• Request transaction & signature approvals</div>
        </div>
      </div>

      <div style={{ padding: '10px 16px 4px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, color: '#5A5F6E', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6, paddingLeft: 2 }}>
          Select accounts
        </div>
        <div
          style={{
            background: '#11131A',
            border: '1px solid #1B1E27',
            borderRadius: 12,
            overflow: 'hidden',
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {accounts.map((a, i) => (
            <label
              key={a.address}
              className="arc-row arc-tap"
              style={{
                padding: '10px 14px',
                borderTop: i === 0 ? 'none' : '1px solid #1B1E27',
                cursor: 'pointer',
                gap: 10,
              }}
            >
              <Checkbox
                checked={picked.includes(a.address)}
                onChange={(e) => {
                  if (e.target.checked) setPicked([...picked, a.address]);
                  else setPicked(picked.filter((p) => p !== a.address));
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, letterSpacing: '-0.01em' }}>{a.name}</div>
                <div className="arc-mono" style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{shortAddr(a.address, 6)}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: '12px 16px 14px',
          borderTop: '1px solid #1B1E27',
          background: 'rgba(10, 11, 15, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          gap: 10,
        }}
      >
        <Button size="large" block onClick={reject}>Reject</Button>
        <Button type="primary" size="large" block disabled={!picked.length} onClick={approve}>Connect</Button>
      </div>
    </div>
  );
};
