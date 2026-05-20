import React from 'react';
import { Button, Input, message, Modal } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, CopyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch, actions } from '../../shared/store';
import { api } from '../../shared/utils/rpc';
import { addrGradient, copy, shortAddr } from '../../shared/utils/format';

export const AccountList: React.FC = () => {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const { accounts, selectedAddress } = useAppSelector((s) => s);
  const [editing, setEditing] = React.useState<{ address: string; name: string } | null>(null);

  async function refresh() {
    const state: any = await api.getState();
    dispatch(actions.setBootstrap({
      hasVault: true,
      locked: false,
      accounts: state.accounts,
      selectedAddress: state.selectedAddress,
    }));
  }

  async function add() {
    try {
      await api.addAccount();
      await refresh();
    } catch (e: any) {
      message.error(e.message);
    }
  }

  async function saveName() {
    if (!editing) return;
    await api.renameAccount(editing.address, editing.name);
    setEditing(null);
    await refresh();
  }

  return (
    <div style={{ padding: 16 }}>
      <div className="arc-row">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} />
        <strong style={{ flex: 1, textAlign: 'center', marginRight: 32 }}>Accounts</strong>
      </div>
      <div className="arc-card" style={{ padding: 0, marginTop: 12 }}>
        {accounts.map((a) => (
          <div key={a.address} className="arc-row" style={{ padding: '12px 16px', borderTop: '1px solid #1F2026' }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: addrGradient(a.address) }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
              <div className="arc-mono" style={{ fontSize: 11, color: '#A1A3AB' }}>{shortAddr(a.address)}</div>
            </div>
            <Button type="text" icon={<EditOutlined />} onClick={() => setEditing({ address: a.address, name: a.name })} />
            <Button type="text" icon={<CopyOutlined />} onClick={() => { copy(a.address); message.success('Copied'); }} />
          </div>
        ))}
      </div>
      <Button block icon={<PlusOutlined />} onClick={add} size="large" style={{ marginTop: 12 }}>Add account</Button>

      <Modal
        title="Rename account"
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={saveName}
      >
        <Input value={editing?.name || ''} onChange={(e) => setEditing(editing && { ...editing, name: e.target.value })} />
      </Modal>
    </div>
  );
};
