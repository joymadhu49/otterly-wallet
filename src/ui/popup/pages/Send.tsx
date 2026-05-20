import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, message } from 'antd';
import { TokenPickerSheet } from '../components/TokenPickerSheet';
import {
  ArrowLeftOutlined, CaretDownFilled, RightOutlined,
  WalletOutlined, ExpandOutlined, CheckCircleFilled, CloseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useAppSelector } from '../../shared/store';
import { api } from '../../shared/utils/rpc';
import { formatUnits, shortAddr, explorerTx } from '../../shared/utils/format';
import { TokenIcon } from '../components/TokenIcon';
import { PixelAvatar } from '../components/PixelAvatar';
import { ARC_TESTNET } from '../../../constants/chain';

const PRICES: Record<string, number> = { USDC: 1.0, EURC: 1.085 };
const GAS_LIMIT_NATIVE = 21000;
const GAS_LIMIT_ERC20 = 65000;

export const Send: React.FC = () => {
  const nav = useNavigate();
  const { selectedAddress, accounts, balances } = useAppSelector((s) => s);
  const [tokenIdx, setTokenIdx] = useState(0);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);
  const [gasPrice, setGasPrice] = useState<string>('');

  const token = balances[tokenIdx];
  const account = accounts.find((a) => a.address.toLowerCase() === (selectedAddress || '').toLowerCase());
  const validAddr = ethers.utils.isAddress(to);
  const toAccount = useMemo(
    () => (validAddr ? accounts.find((a) => a.address.toLowerCase() === to.toLowerCase()) : undefined),
    [accounts, to, validAddr],
  );
  const isOwn = !!toAccount;

  const max = useMemo(() => {
    if (!token) return '0';
    return formatUnits(token.balance, token.decimals, 8);
  }, [token]);

  const usdValue = useMemo(() => {
    const p = PRICES[token?.symbol?.toUpperCase()] ?? 0;
    const n = parseFloat(amount);
    if (!p || !n || isNaN(n)) return '0.00';
    return (n * p).toFixed(2);
  }, [amount, token]);

  useEffect(() => {
    let mounted = true;
    api.getGasPrice().then((gp) => mounted && setGasPrice(gp)).catch(() => {});
    const t = setInterval(() => {
      api.getGasPrice().then((gp) => mounted && setGasPrice(gp)).catch(() => {});
    }, 12000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  const gasFee = useMemo(() => {
    if (!gasPrice || !token) return { usdc: '0.000000', usd: '0.00' };
    try {
      const limit = token.isNative ? GAS_LIMIT_NATIVE : GAS_LIMIT_ERC20;
      const wei = ethers.BigNumber.from(gasPrice).mul(limit);
      const native = ARC_TESTNET.nativeCurrency;
      const human = parseFloat(ethers.utils.formatUnits(wei, native.decimals));
      return {
        usdc: human.toFixed(6),
        usd: (human * (PRICES[native.symbol] ?? 1)).toFixed(4),
      };
    } catch {
      return { usdc: '0.000000', usd: '0.00' };
    }
  }, [gasPrice, token]);

  const numAmount = parseFloat(amount);
  const canSend = validAddr && !!token && numAmount > 0 && numAmount <= parseFloat(max);

  async function send() {
    if (!selectedAddress || !token) return;
    setLoading(true);
    try {
      const hash = await api.sendTx({
        from: selectedAddress,
        to,
        value: amount,
        tokenAddress: token.isNative ? undefined : token.address,
        decimals: token.decimals,
      });
      message.success(
        <span>Sent. <a href={explorerTx(hash)} target="_blank" rel="noreferrer">View</a></span>,
      );
      nav('/activity');
    } catch (e: any) {
      message.error(e.message || 'Send failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: 600, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: '14px 16px 18px', position: 'relative', textAlign: 'center' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => nav(-1)}
          style={{ position: 'absolute', left: 8, top: 10 }}
        />
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>Send</div>
        {account && (
          <div className="arc-row" style={{ justifyContent: 'center', marginTop: 4, gap: 6, color: '#9CA3AF', fontSize: 12 }}>
            <span
              style={{
                width: 18, height: 18, borderRadius: 5, background: '#181B24',
                border: '1px solid #262A36',
                fontSize: 10, fontWeight: 700, color: '#5FBFFF',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
            >A</span>
            {account.name}
          </div>
        )}
        <Button
          type="text"
          icon={<ExpandOutlined />}
          onClick={() => window.open(location.href.split('#')[0] + '#/send', '_blank')}
          style={{ position: 'absolute', right: 8, top: 10 }}
        />
      </div>

      <div style={{ padding: '0 16px', flex: 1 }}>
        <div className="arc-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>To</div>
          {isOwn && (
            <div className="arc-row" style={{ gap: 5, color: '#22C55E', fontSize: 12, fontWeight: 600 }}>
              <CheckCircleFilled style={{ fontSize: 12 }} />
              Your own address
            </div>
          )}
        </div>

        {validAddr ? (
          <div
            className="arc-tap"
            onClick={() => setTo('')}
            style={{
              background: '#11131A',
              border: '1px solid #1B1E27',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
            }}
          >
            <PixelAvatar address={to} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {toAccount?.name ?? 'External address'}
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}>
                {shortAddr(to)}
              </div>
            </div>
            <RightOutlined style={{ color: '#5A5F6E', fontSize: 12 }} />
          </div>
        ) : (
          <>
            <div
              style={{
                background: '#11131A',
                border: `1px solid ${to ? '#FF5C5C' : '#1B1E27'}`,
                borderRadius: 14,
                padding: '14px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'border-color 180ms',
              }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: 9, background: '#181B24',
                  border: '1px solid #262A36',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#5FBFFF', fontSize: 12, fontWeight: 700,
                }}
              >0x</div>
              <Input
                variant="borderless"
                value={to}
                onChange={(e) => setTo(e.target.value.trim())}
                placeholder="Paste address (0x…)"
                style={{
                  flex: 1,
                  fontSize: 14,
                  background: 'transparent',
                  padding: 0,
                  color: '#fff',
                }}
                allowClear
              />
            </div>
            {to && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#FF5C5C' }}>Invalid address</div>
            )}
            {accounts.length > 1 && !to && (
              <div className="arc-row" style={{ gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {accounts
                  .filter((a) => a.address.toLowerCase() !== (selectedAddress || '').toLowerCase())
                  .slice(0, 3)
                  .map((a) => (
                    <div
                      key={a.address}
                      className="arc-tap"
                      onClick={() => setTo(a.address)}
                      style={{
                        background: '#11131A',
                        border: '1px solid #1B1E27',
                        borderRadius: 9,
                        padding: '4px 10px 4px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      <PixelAvatar address={a.address} size={20} />
                      <span style={{ color: '#9CA3AF' }}>{a.name}</span>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}

        <div style={{ fontWeight: 700, fontSize: 15, margin: '22px 0 8px', letterSpacing: '-0.01em' }}>Amount</div>
        <div
          style={{
            background: '#11131A',
            border: '1px solid #1B1E27',
            borderRadius: 14,
            padding: '16px 14px 12px',
          }}
        >
          <div className="arc-row" style={{ gap: 10, alignItems: 'center' }}>
            <Input
              variant="borderless"
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '');
                setAmount(v);
              }}
              placeholder="0"
              style={{
                flex: 1,
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: '-0.025em',
                background: 'transparent',
                padding: 0,
                color: '#fff',
                height: 40,
              }}
            />
            <div
              className="arc-row arc-tap"
              onClick={() => setTokenOpen(true)}
              style={{
                background: '#181B24',
                borderRadius: 999,
                padding: '5px 10px 5px 5px',
                gap: 7,
                cursor: 'pointer',
              }}
            >
              <TokenIcon symbol={token?.symbol || 'USDC'} size={22} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>{token?.symbol || 'USDC'}</span>
              <CaretDownFilled style={{ fontSize: 10, color: '#9CA3AF' }} />
            </div>
            <TokenPickerSheet
              open={tokenOpen}
              onClose={() => setTokenOpen(false)}
              balances={balances}
              onPick={(i) => setTokenIdx(i)}
            />
          </div>
          <div className="arc-row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontSize: 13, color: '#5A5F6E' }}>${usdValue}</span>
            <div className="arc-row" style={{ gap: 8 }}>
              <WalletOutlined style={{ color: '#5A5F6E', fontSize: 13 }} />
              <span style={{ fontSize: 13, color: '#9CA3AF' }}>{max}</span>
              <span
                className="arc-tap"
                style={{
                  background: 'rgba(77, 142, 233, 0.14)',
                  color: '#5FBFFF',
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                }}
                onClick={() => setAmount(max)}
              >
                MAX
              </span>
            </div>
          </div>
        </div>

        <div className="arc-row" style={{ justifyContent: 'space-between', padding: '14px 4px 0' }}>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>Network fee</span>
          <span style={{ fontSize: 13, color: '#5FBFFF', fontWeight: 600 }}>
            Instant · {gasFee.usdc} USDC
          </span>
        </div>
      </div>

      <div
        style={{
          padding: '12px 16px 16px',
          borderTop: '1px solid #1B1E27',
          background: 'rgba(10, 11, 15, 0.92)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          display: 'flex',
          gap: 10,
        }}
      >
        <Button
          type="primary"
          size="large"
          loading={loading}
          disabled={!canSend}
          onClick={send}
          style={{ flex: 1, height: 48, fontWeight: 700, fontSize: 15, borderRadius: 12 }}
        >
          {canSend ? 'Confirm' : 'Enter amount'}
        </Button>
        <Button
          size="large"
          icon={<CloseOutlined />}
          onClick={() => nav(-1)}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#15171E',
            border: '1px solid #1B1E27',
            color: '#9CA3AF',
          }}
        />
      </div>
    </div>
  );
};
