import React, { useState } from 'react';
import { Button, Input, message } from 'antd';
import { api } from '../../shared/utils/rpc';

export const UnlockGate: React.FC<{ onUnlocked: () => void }> = ({ onUnlocked }) => {
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit() {
    setLoading(true);
    try {
      await api.unlock(pw);
      onUnlocked();
    } catch {
      message.error('Wrong password');
    } finally { setLoading(false); }
  }
  return (
    <div style={{ padding: 24, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h2 style={{ textAlign: 'center' }}>Unlock to continue</h2>
      <p style={{ color: '#A1A3AB', textAlign: 'center' }}>A site is requesting access to Otterly.</p>
      <Input.Password value={pw} onChange={(e) => setPw(e.target.value)} onPressEnter={submit} size="large" placeholder="Password" />
      <Button type="primary" block size="large" style={{ marginTop: 12 }} loading={loading} onClick={submit}>Unlock</Button>
    </div>
  );
};
