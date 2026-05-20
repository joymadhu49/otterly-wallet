import React, { useState } from 'react';
import { Button } from 'antd';
import { ethers } from 'ethers';
import { api } from '../../shared/utils/rpc';
import { SiteHeader } from '../components/SiteHeader';
import { SignerCard } from '../components/SignerCard';

export const SignMessageApproval: React.FC<{ req: any; state: any; onDone: () => void }> = ({ req, onDone }) => {
  const { message: msg, address } = req.data;
  const [showHex, setShowHex] = useState(false);

  let utf8 = msg;
  try {
    if (typeof msg === 'string' && msg.startsWith('0x')) {
      utf8 = ethers.utils.toUtf8String(msg);
    }
  } catch {
    utf8 = msg;
  }

  async function approve() { await api.resolveApproval(req.id, true); onDone(); window.close(); }
  async function reject() { await api.rejectApproval(req.id); onDone(); window.close(); }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SiteHeader origin={req.origin} title="Sign message" subtitle="Off-chain signature — no gas, no funds move." />

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ padding: '14px 16px 4px' }}>
          <SignerCard address={address} />
        </div>

        <div style={{ padding: '12px 16px 16px' }}>
          <div className="arc-row" style={{ justifyContent: 'space-between', marginBottom: 6, paddingLeft: 2 }}>
            <div style={{ fontSize: 11, color: '#5A5F6E', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
              Message
            </div>
            <div
              onClick={() => setShowHex(!showHex)}
              style={{ fontSize: 11, color: '#5FBFFF', cursor: 'pointer', fontWeight: 600 }}
            >
              {showHex ? 'Show text' : 'Show hex'}
            </div>
          </div>
          <div
            className={showHex ? 'arc-mono' : ''}
            style={{
              background: '#0A0B0F',
              border: '1px solid #1B1E27',
              borderRadius: 12,
              padding: 14,
              fontSize: showHex ? 11 : 13,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: showHex ? '#A1A8B5' : '#fff',
            }}
          >
            {showHex ? msg : utf8}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '12px 16px 16px',
          borderTop: '1px solid #1B1E27',
          background: 'rgba(10, 11, 15, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <Button size="large" block onClick={reject}>Reject</Button>
        <Button type="primary" size="large" block onClick={approve}>Sign</Button>
      </div>
    </div>
  );
};
