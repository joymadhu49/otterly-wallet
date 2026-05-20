import React from 'react';
import { ethers } from 'ethers';
import { formatUnits } from '../../shared/utils/format';
import { TokenIcon } from './TokenIcon';

// Stub USD prices for testnet stablecoins
const PRICES: Record<string, number> = {
  USDC: 1.0,
  EURC: 1.085,
};

export const TokenRow: React.FC<{ token: any }> = ({ token }) => {
  const amount = formatUnits(token.balance, token.decimals, 4);
  const price = PRICES[token.symbol?.toUpperCase()] ?? 0;
  let usd = '';
  try {
    const human = parseFloat(ethers.utils.formatUnits(ethers.BigNumber.from(token.balance), token.decimals));
    if (price) usd = (human * price).toFixed(2);
  } catch { /* noop */ }

  return (
    <div
      className="arc-row arc-tap"
      style={{
        padding: '14px 16px',
        cursor: 'pointer',
      }}
    >
      <TokenIcon symbol={token.symbol} address={token.address} size={40} />
      <div style={{ flex: 1, minWidth: 0, marginLeft: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>{token.symbol}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{amount}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>
          {usd ? `$${usd}` : '—'}
        </div>
        <div style={{ fontSize: 12, color: '#5A5F6E', fontWeight: 500 }}>
          {price ? `$${price.toFixed(2)}` : token.isNative ? 'Native' : 'ERC-20'}
        </div>
      </div>
    </div>
  );
};
