import React, { useEffect, useState } from 'react';
import { Spin, message } from 'antd';
import { api } from '../shared/utils/rpc';
import { ConnectApproval } from './screens/Connect';
import { SignTxApproval } from './screens/SignTx';
import { SignMessageApproval } from './screens/SignMessage';
import { SignTypedDataApproval } from './screens/SignTypedData';
import { UnlockGate } from './screens/UnlockGate';

export const ApprovalApp: React.FC = () => {
  const [approval, setApproval] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const all: any[] = await api.pendingApprovals();
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const id = params.get('id');
    const target = (id && all.find((a) => a.id === id)) || all[0];
    setApproval(target || null);
    setState(await api.getState());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 1500);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>;
  }

  if (state?.hasVault && state?.locked) {
    return <UnlockGate onUnlocked={refresh} />;
  }

  if (!approval) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#A1A3AB' }}>
        No pending requests.
      </div>
    );
  }

  switch (approval.kind) {
    case 'connect': return <ConnectApproval req={approval} state={state} onDone={refresh} />;
    case 'signTx': return <SignTxApproval req={approval} state={state} onDone={refresh} />;
    case 'signMessage': return <SignMessageApproval req={approval} state={state} onDone={refresh} />;
    case 'signTypedData': return <SignTypedDataApproval req={approval} state={state} onDone={refresh} />;
    default:
      return <div style={{ padding: 24, color: '#FF4D4F' }}>Unknown request type: {approval.kind}</div>;
  }
};
