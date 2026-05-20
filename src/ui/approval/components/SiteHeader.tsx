import React from 'react';
import { ARC_TESTNET } from '../../../constants/chain';

export const SiteHeader: React.FC<{ origin: string; title: string; subtitle?: string }> = ({ origin, title, subtitle }) => {
  let host = origin;
  try { host = new URL(origin).host; } catch { /* noop */ }
  const favicon = `${origin}/favicon.ico`;

  return (
    <div style={{ padding: '14px 16px 4px' }}>
      <div className="arc-row" style={{ justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
        <div className="arc-row" style={{ gap: 8, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: '#11131A', border: '1px solid #1B1E27',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}
          >
            <img
              src={favicon}
              alt=""
              width={20}
              height={20}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <span style={{ fontSize: 12, color: '#9CA3AF', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {host}
          </span>
        </div>
        <span className="arc-chip arc-row" style={{ gap: 5, padding: '3px 8px', fontSize: 10, flexShrink: 0, whiteSpace: 'nowrap' }}>
          <span style={{ width: 5, height: 5, borderRadius: 3, background: '#5FBFFF' }} />
          {ARC_TESTNET.name}
        </span>
      </div>
      <div style={{ marginTop: 18, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</div>
      {subtitle && <div style={{ marginTop: 4, fontSize: 13, color: '#9CA3AF' }}>{subtitle}</div>}
    </div>
  );
};
