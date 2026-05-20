import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Welcome: React.FC = () => {
  const nav = useNavigate();
  return (
    <div style={{ padding: 24, height: 600, display: 'flex', flexDirection: 'column' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.32, 0.72, 0.32, 1] }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
      >
        <img
          src="assets/icon-128.png"
          width={104}
          height={104}
          alt="Otterly"
          style={{ marginBottom: 28, borderRadius: 24, boxShadow: '0 20px 60px rgba(77,142,233,0.35)' }}
        />
        <h1 className="arc-grad-text" style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em' }}>
          Otterly
        </h1>
        <p style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 12, fontSize: 14, lineHeight: 1.55, letterSpacing: '-0.005em' }}>
          Friendly self-custodial wallet for the Arc Network.
          <br />USDC-native gas. Instant finality. Built for builders.
        </p>
      </motion.div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button type="primary" size="large" block onClick={() => nav('/create')}>
          Create new wallet
        </Button>
        <Button
          size="large"
          block
          onClick={() => nav('/import')}
          style={{ background: '#11131A', borderColor: '#1B1E27', color: '#fff' }}
        >
          Import existing
        </Button>
        <p style={{ fontSize: 11, color: '#5A5F6E', textAlign: 'center', marginTop: 8 }}>
          By continuing you agree this is testnet software.
        </p>
      </div>
    </div>
  );
};
