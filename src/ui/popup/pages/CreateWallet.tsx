import React, { useMemo, useState } from 'react';
import { Button, Input, Steps, Tag, message } from 'antd';
import { ArrowLeftOutlined, CopyOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { api } from '../../shared/utils/rpc';
import { actions, useAppDispatch } from '../../shared/store';
import { copy } from '../../shared/utils/format';

export const CreateWallet: React.FC = () => {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(0);
  const [mnemonic] = useState(() => ethers.utils.entropyToMnemonic(ethers.utils.randomBytes(16)));
  const words = useMemo(() => mnemonic.split(' '), [mnemonic]);
  const [revealed, setRevealed] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [picks, setPicks] = useState<string[]>([]);

  const verifyOrder = useMemo(() => [...words].sort(() => Math.random() - 0.5), [words]);
  const verifyTargets = useMemo(() => [2, 5, 8].map((i) => ({ idx: i, word: words[i] })), [words]);
  const [verifyInputs, setVerifyInputs] = useState<Record<number, string>>({});

  const verifyOk = verifyTargets.every((t) => verifyInputs[t.idx]?.trim().toLowerCase() === t.word);

  async function finalize() {
    if (password.length < 8) return message.error('Password ≥ 8 characters');
    if (password !== confirm) return message.error('Passwords do not match');
    setLoading(true);
    try {
      const accounts: any = await api.createVault(mnemonic, password);
      const state: any = await api.getState();
      dispatch(actions.setBootstrap({
        hasVault: true,
        locked: false,
        accounts: state.accounts,
        selectedAddress: state.selectedAddress,
      }));
      message.success('Wallet created');
      nav('/', { replace: true });
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, paddingTop: 18 }}>
      <div className="arc-row" style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => (step === 0 ? nav(-1) : setStep(step - 1))} />
        <strong style={{ flex: 1, textAlign: 'center', marginRight: 32 }}>Create wallet</strong>
      </div>
      <Steps current={step} size="small" items={[{ title: 'Phrase' }, { title: 'Verify' }, { title: 'Password' }]} style={{ marginBottom: 16 }} />

      {step === 0 && (
        <div>
          <p style={{ color: '#A1A3AB', fontSize: 13 }}>Write down these 12 words. They are the only way to recover your wallet.</p>
          <div style={{ position: 'relative' }}>
            <div
              className="arc-card"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                filter: revealed ? 'none' : 'blur(8px)',
                transition: 'filter 0.25s',
                userSelect: revealed ? 'text' : 'none',
              }}
            >
              {words.map((w, i) => (
                <div key={i} className="arc-elevated arc-mono" style={{ padding: '10px 12px', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#5C5F69', width: 18 }}>{i + 1}</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
            {!revealed && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Button icon={<EyeOutlined />} onClick={() => setRevealed(true)}>Tap to reveal</Button>
              </div>
            )}
          </div>
          <div className="arc-row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
            <Button icon={<CopyOutlined />} type="text" onClick={() => { copy(mnemonic); message.success('Copied'); }}>Copy</Button>
            <Button icon={<EyeInvisibleOutlined />} type="text" onClick={() => setRevealed(false)}>Hide</Button>
          </div>
          <Button type="primary" block size="large" disabled={!revealed} onClick={() => setStep(1)} style={{ marginTop: 12 }}>
            I saved my phrase
          </Button>
        </div>
      )}

      {step === 1 && (
        <div>
          <p style={{ color: '#A1A3AB', fontSize: 13 }}>Type the requested words to confirm.</p>
          {verifyTargets.map((t) => (
            <div key={t.idx} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#A1A3AB', marginBottom: 4 }}>Word #{t.idx + 1}</div>
              <Input
                value={verifyInputs[t.idx] || ''}
                onChange={(e) => setVerifyInputs({ ...verifyInputs, [t.idx]: e.target.value })}
                placeholder="…"
              />
            </div>
          ))}
          <Button type="primary" block size="large" disabled={!verifyOk} onClick={() => setStep(2)}>Continue</Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <p style={{ color: '#A1A3AB', fontSize: 13 }}>Set a password to unlock this wallet on this device.</p>
          <Input.Password size="large" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ marginBottom: 10 }} />
          <Input.Password size="large" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" />
          <Button type="primary" block size="large" loading={loading} onClick={finalize} style={{ marginTop: 16 }}>
            Create wallet
          </Button>
        </div>
      )}
    </div>
  );
};
