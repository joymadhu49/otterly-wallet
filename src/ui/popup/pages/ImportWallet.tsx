import React, { useState } from 'react';
import { Button, Input, Tabs, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { api } from '../../shared/utils/rpc';
import { actions, useAppDispatch } from '../../shared/store';

export const ImportWallet: React.FC = () => {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState('mnemonic');
  const [mnemonic, setMnemonic] = useState('');
  const [privkey, setPrivkey] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (password.length < 8) return message.error('Password ≥ 8 characters');
    if (password !== confirm) return message.error('Passwords do not match');
    setLoading(true);
    try {
      if (tab === 'mnemonic') {
        const m = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
        if (!ethers.utils.isValidMnemonic(m)) throw new Error('Invalid mnemonic');
        await api.importMnemonic(m, password);
      } else {
        const pk = privkey.trim();
        try {
          new ethers.Wallet(pk.startsWith('0x') ? pk : `0x${pk}`);
        } catch {
          throw new Error('Invalid private key');
        }
        await api.importPrivkey(pk, password);
      }
      const state: any = await api.getState();
      dispatch(actions.setBootstrap({
        hasVault: true,
        locked: false,
        accounts: state.accounts,
        selectedAddress: state.selectedAddress,
      }));
      message.success('Wallet imported');
      nav('/', { replace: true });
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <div className="arc-row" style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} />
        <strong style={{ flex: 1, textAlign: 'center', marginRight: 32 }}>Import wallet</strong>
      </div>
      <Tabs activeKey={tab} onChange={setTab} items={[
        {
          key: 'mnemonic',
          label: 'Seed phrase',
          children: (
            <Input.TextArea
              rows={4}
              placeholder="12 or 24 words separated by spaces"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
            />
          ),
        },
        {
          key: 'privkey',
          label: 'Private key',
          children: (
            <Input.TextArea
              rows={4}
              placeholder="0x… (hex)"
              value={privkey}
              onChange={(e) => setPrivkey(e.target.value)}
            />
          ),
        },
      ]} />
      <div style={{ marginTop: 16 }}>
        <Input.Password size="large" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ marginBottom: 10 }} />
        <Input.Password size="large" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" />
        <Button type="primary" block size="large" loading={loading} onClick={submit} style={{ marginTop: 16 }}>Import</Button>
      </div>
    </div>
  );
};
