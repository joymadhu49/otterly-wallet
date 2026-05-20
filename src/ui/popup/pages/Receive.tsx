import React from 'react';
import { Button, message } from 'antd';
import { ArrowLeftOutlined, CopyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAppSelector } from '../../shared/store';
import { copy, shortAddr } from '../../shared/utils/format';
import { ARC_TESTNET } from '../../../constants/chain';

export const Receive: React.FC = () => {
  const nav = useNavigate();
  const { selectedAddress } = useAppSelector((s) => s);
  if (!selectedAddress) return null;

  return (
    <div style={{ padding: 16 }}>
      <div className="arc-row" style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} />
        <strong style={{ flex: 1, textAlign: 'center', marginRight: 32 }}>Receive</strong>
      </div>
      <div className="arc-card" style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ background: '#fff', padding: 12, borderRadius: 12, display: 'inline-block' }}>
          <QRCodeSVG value={selectedAddress} size={180} bgColor="#fff" fgColor="#000" />
        </div>
        <div className="arc-mono" style={{ marginTop: 16, fontSize: 13, wordBreak: 'break-all' }}>
          {selectedAddress}
        </div>
        <Button
          icon={<CopyOutlined />}
          size="large"
          block
          style={{ marginTop: 14 }}
          onClick={() => { copy(selectedAddress); message.success('Address copied'); }}
        >
          Copy address
        </Button>
      </div>
      <p style={{ fontSize: 11, color: '#5C5F69', textAlign: 'center', marginTop: 12 }}>
        Only send Arc Testnet assets to this address.<br />
        Need testnet USDC? <a href={ARC_TESTNET.faucet} target="_blank" rel="noreferrer">Get from faucet</a>
      </p>
    </div>
  );
};
