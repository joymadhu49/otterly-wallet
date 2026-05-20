import React from 'react';
import { useAppSelector } from '../../shared/store';
import { formatUnits } from '../../shared/utils/format';
import { ARC_TESTNET } from '../../../constants/chain';

export const PortfolioHeader: React.FC = () => {
  const { balances } = useAppSelector((s) => s);
  const native = balances.find((b: any) => b.isNative);
  const display = native ? formatUnits(native.balance, ARC_TESTNET.nativeCurrency.decimals, 4) : '0.0000';
  const [int, frac = ''] = display.split('.');

  return (
    <div style={{ padding: '28px 16px 18px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#9CA3AF', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
        Total balance
      </div>
      <div style={{ marginTop: 10, fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
        <span>${int}</span>
        {frac && <span style={{ color: '#5A5F6E', fontSize: 30 }}>.{frac}</span>}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: '#5A5F6E', letterSpacing: '-0.005em' }}>
        Arc Testnet · USDC native gas
      </div>
    </div>
  );
};
