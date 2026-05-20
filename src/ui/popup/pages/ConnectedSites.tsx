import React, { useEffect, useState } from 'react';
import { Empty, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../shared/utils/rpc';
import { shortAddr } from '../../shared/utils/format';

function hostOf(origin: string): string {
  try { return new URL(origin).host; } catch { return origin; }
}

const SiteIcon: React.FC<{ origin: string }> = ({ origin }) => {
  const host = hostOf(origin);
  const [failed, setFailed] = useState(false);
  const letter = (host[0] || '?').toUpperCase();

  if (failed) {
    return (
      <div
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: '#15171E',
          color: '#5FBFFF',
          fontSize: 14, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {letter}
      </div>
    );
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
      onError={() => setFailed(true)}
      width={36}
      height={36}
      style={{ borderRadius: 10, background: '#15171E', flexShrink: 0 }}
      alt=""
    />
  );
};

export const ConnectedSites: React.FC = () => {
  const nav = useNavigate();
  const [sites, setSites] = useState<any[]>([]);

  async function refresh() {
    const s: any = await api.connectedSites();
    setSites(s);
  }
  useEffect(() => { refresh(); }, []);

  async function dc(origin: string) {
    await api.disconnectSite(origin);
    message.success('Disconnected');
    refresh();
  }

  return (
    <div>
      <div className="arc-row" style={{ padding: '14px 16px', position: 'relative', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => nav('/settings')}
          style={{
            position: 'absolute', left: 12, top: 12,
            width: 32, height: 32, borderRadius: 10,
            background: 'transparent', border: 'none',
            color: '#FFFFFF', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowLeftOutlined />
        </button>
        <strong style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>Connected sites</strong>
      </div>

      <div style={{ padding: '0 16px' }}>
        {!sites.length ? (
          <Empty description="No sites connected" style={{ padding: 60 }} />
        ) : (
          <div
            style={{
              background: '#0F1117',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            {sites.map((s, i) => (
              <div
                key={s.origin}
                className="arc-row"
                style={{
                  padding: '12px 14px',
                  gap: 12,
                  borderTop: i === 0 ? 'none' : '1px solid #15171E',
                }}
              >
                <SiteIcon origin={s.origin} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600, fontSize: 14, color: '#FFFFFF',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {hostOf(s.origin)}
                  </div>
                  <div className="arc-mono" style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                    {(s.accounts || []).map((a: string) => shortAddr(a)).join(', ')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dc(s.origin)}
                  className="arc-tap"
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    border: '1px solid #1B1E27',
                    borderRadius: 8,
                    color: '#9CA3AF',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
