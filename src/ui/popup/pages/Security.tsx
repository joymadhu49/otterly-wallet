import React, { useState } from 'react';
import { Button, Input, Modal, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../shared/store';
import { api } from '../../shared/utils/rpc';

export const Security: React.FC = () => {
  const nav = useNavigate();
  const { selectedAddress } = useAppSelector((s) => s);
  const [mode, setMode] = useState<'priv' | 'mnemonic' | null>(null);
  const [pw, setPw] = useState('');
  const [secret, setSecret] = useState('');

  async function reveal() {
    try {
      if (!selectedAddress) return;
      const r = mode === 'mnemonic'
        ? await api.exportMnemonic(pw)
        : await api.exportPrivkey(selectedAddress, pw);
      setSecret(r);
    } catch (e: any) {
      message.error(e.message || 'Wrong password');
    }
  }

  function close() {
    setMode(null); setPw(''); setSecret('');
  }

  return (
    <div style={{ padding: 16 }}>
      <div className="arc-row">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} />
        <strong style={{ flex: 1, textAlign: 'center', marginRight: 32 }}>Security & backup</strong>
      </div>
      <div className="arc-card" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600 }}>Reveal seed phrase</div>
        <div style={{ fontSize: 12, color: '#A1A3AB', marginTop: 4 }}>Anyone with your phrase can take your funds.</div>
        <Button block style={{ marginTop: 10 }} onClick={() => setMode('mnemonic')}>Reveal</Button>
      </div>
      <div className="arc-card" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600 }}>Export private key (current account)</div>
        <div style={{ fontSize: 12, color: '#A1A3AB', marginTop: 4 }}>Never share this with anyone.</div>
        <Button block danger style={{ marginTop: 10 }} onClick={() => setMode('priv')}>Reveal</Button>
      </div>

      <Modal open={!!mode} onCancel={close} footer={null} title={mode === 'mnemonic' ? 'Reveal seed' : 'Reveal private key'}>
        {!secret ? (
          <div>
            <Input.Password placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} onPressEnter={reveal} />
            <Button type="primary" block style={{ marginTop: 12 }} onClick={reveal}>Confirm</Button>
          </div>
        ) : (
          <div>
            <div className="arc-mono arc-elevated" style={{ padding: 12, wordBreak: 'break-all', fontSize: 13 }}>
              {secret}
            </div>
            <Button block style={{ marginTop: 10 }} onClick={() => { navigator.clipboard.writeText(secret); message.success('Copied'); }}>Copy</Button>
            <Button block style={{ marginTop: 8 }} onClick={close}>Done</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
