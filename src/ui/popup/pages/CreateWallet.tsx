import React, { useMemo, useState } from 'react';
import { Button, Input, message } from 'antd';
import { ArrowLeftOutlined, CopyOutlined, EyeInvisibleOutlined, EyeOutlined, DownloadOutlined, CheckCircleFilled, WarningFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { api } from '../../shared/utils/rpc';
import { actions, useAppDispatch } from '../../shared/store';
import { copy } from '../../shared/utils/format';

export const CreateWallet: React.FC = () => {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<0 | 1>(0);
  const [mnemonic] = useState(() => ethers.utils.entropyToMnemonic(ethers.utils.randomBytes(16)));
  const words = useMemo(() => mnemonic.split(' '), [mnemonic]);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  function handleCopy() {
    const ok = copy(mnemonic);
    if (ok) {
      setCopied(true);
      message.success({ content: 'Recovery phrase copied', duration: 2 });
      setTimeout(() => setCopied(false), 2500);
    } else {
      message.error('Copy failed — write the phrase down instead');
    }
  }

  function handleDownload() {
    const blob = new Blob(
      [
        'Otterly Wallet — Recovery Phrase\n',
        '================================\n\n',
        mnemonic + '\n\n',
        'KEEP THIS FILE SECRET. Anyone with these 12 words can take your funds.\n',
        'Store it offline. Delete this file once written down securely.\n',
      ],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'otterly-recovery-phrase.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function finalize() {
    if (password.length < 8) return message.error('Password must be at least 8 characters');
    if (password !== confirm) return message.error('Passwords do not match');
    setLoading(true);
    try {
      await api.createVault(mnemonic, password);
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

  const passwordValid = password.length >= 8 && password === confirm;
  const pwStrength = passwordStrength(password);

  return (
    <div style={{ padding: 16, paddingTop: 18, minHeight: '100%' }}>
      <div className="arc-row" style={{ marginBottom: 18 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => (step === 0 ? nav(-1) : setStep(0))}
        />
        <strong style={{ flex: 1, textAlign: 'center', marginRight: 32, fontSize: 16 }}>Create wallet</strong>
      </div>

      <StepDots step={step} />

      {step === 0 && (
        <div>
          <div
            style={{
              background: '#10131C',
              border: '1px solid #1F2330',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              marginBottom: 14,
            }}
          >
            <WarningFilled style={{ color: '#F2B400', fontSize: 16, marginTop: 1 }} />
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#C8CBD4' }}>
              These 12 words are the only way to recover your wallet. Save them somewhere safe and offline.
              <span style={{ color: '#FF7676' }}> Never share them with anyone.</span>
            </div>
          </div>

          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div
              style={{
                background: '#0F1117',
                border: '1px solid #1B1E27',
                borderRadius: 16,
                padding: 12,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                filter: revealed ? 'none' : 'blur(9px)',
                transition: 'filter 0.25s',
                userSelect: revealed ? 'text' : 'none',
                pointerEvents: revealed ? 'auto' : 'none',
              }}
            >
              {words.map((w, i) => (
                <div
                  key={i}
                  style={{
                    background: '#181B24',
                    border: '1px solid #1F2330',
                    borderRadius: 10,
                    padding: '9px 12px',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: '#5C5F69', minWidth: 18, fontSize: 11 }}>{i + 1}</span>
                  <span style={{ color: '#FFFFFF' }}>{w}</span>
                </div>
              ))}
            </div>
            {!revealed && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Button
                  icon={<EyeOutlined />}
                  size="large"
                  onClick={() => setRevealed(true)}
                  style={{ background: '#181B24', borderColor: '#262A36', color: '#fff', borderRadius: 12 }}
                >
                  Tap to reveal
                </Button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Button
              icon={copied ? <CheckCircleFilled style={{ color: '#22C55E' }} /> : <CopyOutlined />}
              onClick={handleCopy}
              disabled={!revealed}
              block
              style={{
                background: '#15171E',
                border: '1px solid #1F2330',
                color: '#fff',
                height: 40,
                borderRadius: 12,
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              disabled={!revealed}
              block
              style={{
                background: '#15171E',
                border: '1px solid #1F2330',
                color: '#fff',
                height: 40,
                borderRadius: 12,
              }}
            >
              Download
            </Button>
            <Button
              icon={<EyeInvisibleOutlined />}
              onClick={() => setRevealed(false)}
              disabled={!revealed}
              style={{
                background: '#15171E',
                border: '1px solid #1F2330',
                color: '#fff',
                height: 40,
                width: 40,
                borderRadius: 12,
                padding: 0,
              }}
            />
          </div>

          <Button
            type="primary"
            block
            size="large"
            disabled={!revealed}
            onClick={() => setStep(1)}
            style={{ height: 48, borderRadius: 14, fontWeight: 600 }}
          >
            I saved my phrase
          </Button>
        </div>
      )}

      {step === 1 && (
        <div>
          <p style={{ color: '#A1A3AB', fontSize: 13, marginBottom: 16 }}>
            Set a password to unlock Otterly on this device. This does <strong style={{ color: '#fff' }}>not</strong> replace your recovery phrase.
          </p>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#A1A3AB', marginBottom: 6 }}>Password</div>
            <Input.Password
              size="large"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={{ borderRadius: 12 }}
            />
            {password.length > 0 && <StrengthBar level={pwStrength} />}
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: '#A1A3AB', marginBottom: 6 }}>Confirm password</div>
            <Input.Password
              size="large"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              style={{ borderRadius: 12 }}
              status={confirm && confirm !== password ? 'error' : undefined}
            />
            {confirm && confirm !== password && (
              <div style={{ color: '#FF5C5C', fontSize: 11.5, marginTop: 6 }}>Passwords do not match</div>
            )}
          </div>

          <Button
            type="primary"
            block
            size="large"
            loading={loading}
            disabled={!passwordValid}
            onClick={finalize}
            style={{ height: 48, borderRadius: 14, fontWeight: 600 }}
          >
            Create wallet
          </Button>
        </div>
      )}
    </div>
  );
};

const StepDots: React.FC<{ step: 0 | 1 }> = ({ step }) => (
  <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
    {[0, 1].map((i) => (
      <div
        key={i}
        style={{
          flex: 1,
          height: 3,
          borderRadius: 2,
          background: i <= step ? '#4D8EE9' : '#1F2330',
          transition: 'background 0.2s',
        }}
      />
    ))}
  </div>
);

function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < 8) return 0;
  let score = 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score = Math.min(3, score + 1) as 1 | 2 | 3;
  return Math.min(3, score) as 0 | 1 | 2 | 3;
}

const StrengthBar: React.FC<{ level: 0 | 1 | 2 | 3 }> = ({ level }) => {
  const colors = ['#FF5C5C', '#F2B400', '#5FBFFF', '#22C55E'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, display: 'flex', gap: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= level ? colors[level] : '#1F2330',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <span style={{ color: colors[level], fontSize: 11, minWidth: 40, textAlign: 'right' }}>{labels[level]}</span>
    </div>
  );
};
