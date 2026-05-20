import React, { useState } from 'react';
import { Popover, Button, message } from 'antd';
import { CopyOutlined, PlusOutlined, LogoutOutlined, CaretDownFilled } from '@ant-design/icons';
import { useAppSelector, useAppDispatch, actions } from '../../shared/store';
import { shortAddr, copy } from '../../shared/utils/format';
import { api } from '../../shared/utils/rpc';
import { useNavigate } from 'react-router-dom';
import { PixelAvatar } from './PixelAvatar';

export const AccountSwitcher: React.FC = () => {
  const { accounts, selectedAddress } = useAppSelector((s) => s);
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const selected = accounts.find((a) => a.address.toLowerCase() === (selectedAddress || '').toLowerCase()) || accounts[0];

  async function pick(addr: string) {
    await api.selectAccount(addr);
    dispatch(actions.setSelected(addr));
    setOpen(false);
  }

  async function addAccount() {
    try {
      await api.addAccount();
      const state: any = await api.getState();
      dispatch(actions.setBootstrap({
        hasVault: true,
        locked: false,
        accounts: state.accounts,
        selectedAddress: state.selectedAddress,
      }));
    } catch (e: any) {
      message.error(e.message);
    }
  }

  async function lock() {
    await api.lock();
    dispatch(actions.setLocked(true));
    nav('/unlock', { replace: true });
  }

  const content = (
    <div style={{ width: 290 }}>
      <div style={{ maxHeight: 300, overflow: 'auto' }}>
        {accounts.map((a, i) => (
          <div
            key={a.address}
            onClick={() => pick(a.address)}
            className="arc-row arc-tap"
            style={{
              padding: '10px 10px',
              cursor: 'pointer',
              borderRadius: 10,
              background: a.address === selected?.address ? '#181B24' : 'transparent',
            }}
          >
            <PixelAvatar address={a.address} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, letterSpacing: '-0.01em' }}>{a.name}</div>
              <div className="arc-mono" style={{ fontSize: 11, color: '#9CA3AF' }}>{shortAddr(a.address)}</div>
            </div>
            <CopyOutlined
              style={{ color: '#5A5F6E', padding: 6 }}
              onClick={(e) => { e.stopPropagation(); copy(a.address); message.success('Copied'); }}
            />
          </div>
        ))}
      </div>
      <div className="arc-divider" />
      <Button block icon={<PlusOutlined />} onClick={addAccount}>Add account</Button>
      <Button block icon={<LogoutOutlined />} danger style={{ marginTop: 6 }} onClick={lock}>Lock</Button>
    </div>
  );

  if (!selected) return null;

  return (
    <Popover open={open} onOpenChange={setOpen} content={content} trigger="click" placement="bottomLeft">
      <div
        className="arc-row arc-tap"
        style={{
          cursor: 'pointer',
          padding: '4px 6px 4px 4px',
          borderRadius: 12,
          gap: 8,
          maxWidth: 200,
        }}
      >
        <PixelAvatar address={selected.address} size={32} />
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="arc-row" style={{ gap: 4, fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em', lineHeight: 1.15 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
              {selected.name}
            </span>
            <CaretDownFilled style={{ fontSize: 9, color: '#9CA3AF' }} />
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
            {selected.type === 'hd' ? 'Otterly Wallet' : 'Imported'}
          </div>
        </div>
      </div>
    </Popover>
  );
};
