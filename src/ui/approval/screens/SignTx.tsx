import React, { useState } from 'react';
import { Button } from 'antd';
import { ethers } from 'ethers';
import { api } from '../../shared/utils/rpc';
import { formatUnits, shortAddr } from '../../shared/utils/format';
import { ARC_TESTNET } from '../../../constants/chain';
import { SiteHeader } from '../components/SiteHeader';
import { SignerCard } from '../components/SignerCard';

const Row: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="arc-row" style={{ justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid #1B1E27' }}>
    <span style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 500 }}>{label}</span>
    <span className={mono ? 'arc-mono' : ''} style={{ fontSize: 13, color: '#fff' }}>{value}</span>
  </div>
);

export const SignTxApproval: React.FC<{ req: any; state: any; onDone: () => void }> = ({ req, onDone }) => {
  const tx = req.data.tx;
  const [submitting, setSubmitting] = useState(false);
  const [showData, setShowData] = useState(false);

  const totalFee = ethers.BigNumber.from(tx.gasLimit || '0').mul(ethers.BigNumber.from(tx.gasPrice || '0'));
  const isCall = tx.data && tx.data !== '0x';
  const methodSel = isCall ? tx.data.slice(0, 10) : undefined;

  async function approve() {
    setSubmitting(true);
    await api.resolveApproval(req.id, true);
    onDone();
    window.close();
  }
  async function reject() {
    await api.rejectApproval(req.id);
    onDone();
    window.close();
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SiteHeader origin={req.origin} title={isCall ? 'Confirm contract call' : 'Confirm transaction'} />

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '14px 16px 4px' }}>
        <SignerCard address={tx.from} label="From" />
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
          <div style={{ padding: '12px 14px 6px' }}>
            <div style={{ fontSize: 11, color: '#5A5F6E', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Value</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>
              {formatUnits(tx.value || '0', ARC_TESTNET.nativeCurrency.decimals, 6)}{' '}
              <span style={{ color: '#5FBFFF' }}>{ARC_TESTNET.nativeCurrency.symbol}</span>
            </div>
          </div>
          <Row label="To" value={shortAddr(tx.to, 6)} mono />
          {isCall && (
            <Row
              label="Method"
              value={
                <span
                  className="arc-mono"
                  style={{
                    background: 'rgba(77,142,233,0.12)',
                    border: '1px solid rgba(77,142,233,0.28)',
                    color: '#5FBFFF',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {methodSel}
                </span>
              }
            />
          )}
        </div>
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
          <Row label="Gas limit" value={ethers.BigNumber.from(tx.gasLimit || '0').toString()} mono />
          <Row
            label="Gas price"
            value={`${formatUnits(tx.gasPrice || '0', ARC_TESTNET.nativeCurrency.decimals, 9)} ${ARC_TESTNET.nativeCurrency.symbol}`}
          />
          <Row
            label="Network fee"
            value={
              <span style={{ fontWeight: 700 }}>
                {formatUnits(totalFee.toString(), ARC_TESTNET.nativeCurrency.decimals, 6)}{' '}
                <span style={{ color: '#5FBFFF' }}>{ARC_TESTNET.nativeCurrency.symbol}</span>
              </span>
            }
          />
        </div>
      </div>

      {isCall && (
        <div style={{ padding: '12px 16px 6px' }}>
          <div
            className="arc-row"
            style={{
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: '#11131A',
              border: '1px solid #1B1E27',
              borderRadius: 12,
              cursor: 'pointer',
            }}
            onClick={() => setShowData(!showData)}
          >
            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>Raw calldata</span>
            <span style={{ fontSize: 11, color: '#5FBFFF', fontWeight: 600 }}>{showData ? 'Hide' : 'Show'}</span>
          </div>
          {showData && (
            <div
              className="arc-mono"
              style={{
                marginTop: 6,
                background: '#0A0B0F',
                border: '1px solid #1B1E27',
                borderRadius: 12,
                padding: 12,
                fontSize: 11,
                lineHeight: 1.6,
                maxHeight: 140,
                overflow: 'auto',
                wordBreak: 'break-all',
                color: '#A1A8B5',
              }}
            >
              {tx.data}
            </div>
          )}
        </div>
      )}

        <div style={{ height: 16 }} />
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
        <Button type="primary" size="large" block loading={submitting} onClick={approve}>Confirm</Button>
      </div>
    </div>
  );
};
