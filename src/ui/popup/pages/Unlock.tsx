import React, { useState } from 'react';
import { Button, Input, message } from 'antd';
import { LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../shared/utils/rpc';
import { actions, useAppDispatch } from '../../shared/store';

export const Unlock: React.FC = () => {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);

  async function submit() {
    if (!pw) return;
    setLoading(true);
    setErr(false);
    try {
      await api.unlock(pw);
      const state: any = await api.getState();
      dispatch(actions.setBootstrap({
        hasVault: true,
        locked: false,
        accounts: state.accounts,
        selectedAddress: state.selectedAddress,
      }));
      nav('/', { replace: true });
    } catch (e: any) {
      setErr(true);
      message.error('Wrong password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, height: 600, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <img
          src="assets/icon-128.png"
          width={76}
          height={76}
          alt="Otterly"
          style={{ marginBottom: 18, borderRadius: 18, boxShadow: '0 16px 48px rgba(77,142,233,0.35)' }}
        />
        <h2 style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>Welcome back</h2>
        <p style={{ color: '#9CA3AF', marginTop: 6, fontSize: 13 }}>Unlock Otterly</p>
      </div>

      <div
        style={{
          background: '#11131A',
          border: `1px solid ${err ? '#FF5C5C' : '#1B1E27'}`,
          borderRadius: 14,
          padding: '14px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          transition: 'border-color 180ms',
        }}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: 10, background: '#181B24',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#5FBFFF',
          }}
        >
          <LockOutlined style={{ fontSize: 14 }} />
        </div>
        <Input
          variant="borderless"
          type={show ? 'text' : 'password'}
          value={pw}
          onChange={(e) => { setPw(e.target.value); if (err) setErr(false); }}
          onPressEnter={submit}
          placeholder="Password"
          style={{
            flex: 1,
            fontSize: 15,
            background: 'transparent',
            padding: 0,
            color: '#fff',
            letterSpacing: pw && !show ? '0.18em' : 0,
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'transparent', border: 'none',
            color: '#5A5F6E', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {show ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        </button>
      </div>
      {err && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#FF5C5C' }}>Wrong password. Try again.</div>
      )}

      <Button
        type="primary"
        block
        size="large"
        loading={loading}
        disabled={!pw}
        onClick={submit}
        style={{ marginTop: 18, height: 48, fontWeight: 700, fontSize: 15, borderRadius: 12 }}
      >
        Unlock
      </Button>
    </div>
  );
};
