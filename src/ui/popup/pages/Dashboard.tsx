import React, { useEffect, useMemo, useState } from 'react';
import { Spin, Empty } from 'antd';
import { ethers } from 'ethers';
import { useAppDispatch, useAppSelector, actions } from '../../shared/store';
import { api } from '../../shared/utils/rpc';
import { AccountSwitcher } from '../components/AccountSwitcher';
import { TopActions } from '../components/TopActions';
import { ActionBar } from '../components/ActionBar';
import { TokenRow } from '../components/TokenRow';
import { AssetTabs, AssetTabKey } from '../components/AssetTabs';
import { NftGrid } from '../components/NftGrid';

// Stub USD prices for v1 (Arc testnet has no public price feed)
const PRICES: Record<string, number> = { USDC: 1.0, EURC: 1.085 };

export const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedAddress, balances, loadingBalances } = useAppSelector((s) => s);
  const [tab, setTab] = useState<AssetTabKey>('crypto');

  useEffect(() => {
    if (!selectedAddress) return;
    let mounted = true;
    dispatch(actions.setLoadingBalances(true));
    api.getBalances(selectedAddress).then((b: any) => mounted && dispatch(actions.setBalances(b)))
      .finally(() => mounted && dispatch(actions.setLoadingBalances(false)));
    const t = setInterval(() => {
      api.getBalances(selectedAddress).then((b: any) => mounted && dispatch(actions.setBalances(b)));
    }, 15000);
    return () => { mounted = false; clearInterval(t); };
  }, [selectedAddress, dispatch]);

  const totalUsd = useMemo(() => {
    let sum = 0;
    balances.forEach((b: any) => {
      const p = PRICES[b.symbol?.toUpperCase()] ?? 0;
      if (!p) return;
      try {
        const human = parseFloat(ethers.utils.formatUnits(ethers.BigNumber.from(b.balance), b.decimals));
        sum += human * p;
      } catch { /* noop */ }
    });
    return sum;
  }, [balances]);

  const [int, frac] = totalUsd.toFixed(2).split('.');

  return (
    <div style={{ paddingBottom: 24 }}>
      <div className="arc-row" style={{ padding: '14px 16px', justifyContent: 'space-between' }}>
        <AccountSwitcher />
        <TopActions />
      </div>

      <div style={{ padding: '14px 16px 8px' }}>
        <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05 }}>
          ${int}<span style={{ color: '#5A5F6E', fontSize: 32 }}>.{frac}</span>
        </div>
      </div>

      <ActionBar />

      <AssetTabs value={tab} onChange={setTab} />

      <div style={{ padding: '4px 0 24px' }}>
        {tab === 'crypto' && (
          loadingBalances && !balances.length ? (
            <div style={{ padding: 36, textAlign: 'center' }}><Spin /></div>
          ) : balances.length ? (
            balances.map((b: any, i: number) => <TokenRow key={b.address + i} token={b} />)
          ) : (
            <Empty description="No assets yet" style={{ padding: 36 }} />
          )
        )}
        {tab === 'nft' && <NftGrid address={selectedAddress || ''} />}
        {tab === 'approvals' && (
          <Empty description="No active approvals" style={{ padding: 36 }} />
        )}
      </div>
    </div>
  );
};
