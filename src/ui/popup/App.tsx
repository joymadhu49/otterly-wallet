import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAppDispatch, useAppSelector, actions } from '../shared/store';
import { api } from '../shared/utils/rpc';
import { Welcome } from './pages/Welcome';
import { CreateWallet } from './pages/CreateWallet';
import { ImportWallet } from './pages/ImportWallet';
import { Unlock } from './pages/Unlock';
import { Dashboard } from './pages/Dashboard';
import { Send } from './pages/Send';
import { Receive } from './pages/Receive';
import { Activity } from './pages/Activity';
import { Settings } from './pages/Settings';
import { AccountList } from './pages/AccountList';
import { ConnectedSites } from './pages/ConnectedSites';
import { Security } from './pages/Security';

export const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { bootstrapped, hasVault, locked } = useAppSelector((s) => s);
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const state: any = await api.getState();
      if (!mounted) return;
      dispatch(actions.setBootstrap({
        hasVault: state.hasVault,
        locked: state.locked,
        accounts: state.accounts,
        selectedAddress: state.selectedAddress,
      }));
    })();
    return () => { mounted = false; };
  }, [dispatch]);

  useEffect(() => {
    if (!bootstrapped) return;
    const path = loc.pathname;
    if (!hasVault && !path.startsWith('/welcome') && !path.startsWith('/create') && !path.startsWith('/import')) {
      navigate('/welcome', { replace: true });
    } else if (hasVault && locked && path !== '/unlock') {
      navigate('/unlock', { replace: true });
    } else if (hasVault && !locked && (path === '/welcome' || path === '/unlock')) {
      navigate('/', { replace: true });
    }
  }, [bootstrapped, hasVault, locked, loc.pathname, navigate]);

  if (!bootstrapped) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 600 }}>
        <Spin />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/create" element={<CreateWallet />} />
      <Route path="/import" element={<ImportWallet />} />
      <Route path="/unlock" element={<Unlock />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/send" element={<Send />} />
      <Route path="/receive" element={<Receive />} />
      <Route path="/activity" element={<Activity />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/accounts" element={<AccountList />} />
      <Route path="/settings/sites" element={<ConnectedSites />} />
      <Route path="/settings/security" element={<Security />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
