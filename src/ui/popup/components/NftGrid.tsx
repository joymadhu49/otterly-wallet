import React, { useEffect, useState } from 'react';
import { Empty } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { api } from '../../shared/utils/rpc';
import { ARC_TESTNET } from '../../../constants/chain';
import { BrandLoader } from './BrandLoader';

type Nft = {
  contract: string;
  tokenId: string;
  name: string;
  symbol: string;
  title: string;
  image?: string;
  standard: string;
  amount?: string;
};

const NftCard: React.FC<{ n: Nft }> = ({ n }) => {
  const [imgFailed, setImgFailed] = useState(false);

  function openOnExplorer(e: React.MouseEvent) {
    e.preventDefault();
    const url = `${ARC_TESTNET.explorer}/token/${n.contract}/instance/${n.tokenId}`;
    window.open(url, '_blank');
  }

  return (
    <div
      className="arc-tap"
      onClick={openOnExplorer}
      style={{
        background: '#0F1117',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          background: 'linear-gradient(135deg, #15171E 0%, #0A0B0F 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#262A36',
          fontSize: 36,
          position: 'relative',
        }}
      >
        {n.image && !imgFailed ? (
          <img
            src={n.image}
            alt={n.title}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <>
            <PictureOutlined />
            <span
              style={{
                position: 'absolute',
                bottom: 8,
                fontSize: 9,
                letterSpacing: '0.18em',
                color: '#262A36',
                fontWeight: 700,
              }}
            >
              NFT
            </span>
          </>
        )}
        {n.standard === 'ERC-1155' && n.amount && parseInt(n.amount, 10) > 1 && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              padding: '2px 7px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              fontSize: 10,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            ×{n.amount}
          </div>
        )}
      </div>
      <div style={{ padding: '8px 10px 10px' }}>
        <div
          style={{
            fontSize: 11,
            color: '#9CA3AF',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {n.name}
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: '#FFFFFF',
            letterSpacing: '-0.005em',
            marginTop: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {n.title.startsWith('#') ? n.title : `#${n.tokenId}`}
        </div>
        <div
          className="arc-row"
          style={{
            justifyContent: 'space-between',
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid #15171E',
          }}
        >
          <span style={{ fontSize: 10, color: '#5A5F6E', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
            Floor
          </span>
          <span style={{ fontSize: 11, color: '#5A5F6E' }}>—</span>
        </div>
      </div>
    </div>
  );
};

export const NftGrid: React.FC<{ address: string }> = ({ address }) => {
  const [items, setItems] = useState<Nft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    let mounted = true;
    setLoading(true);
    api.getNfts(address)
      .then((r: any) => { if (mounted) setItems(r || []); })
      .catch(() => mounted && setItems([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [address]);

  if (loading) return <BrandLoader label="Loading collectibles" />;

  if (!items.length) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
        <Empty
          imageStyle={{ height: 48, opacity: 0.4 }}
          description={
            <div style={{ color: '#9CA3AF', fontSize: 13, marginTop: 6 }}>
              No collectibles yet
              <div style={{ color: '#5A5F6E', fontSize: 11, marginTop: 4 }}>
                NFTs you own on Arc will appear here
              </div>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {items.map((n, i) => <NftCard key={`${n.contract}-${n.tokenId}-${i}`} n={n} />)}
    </div>
  );
};
