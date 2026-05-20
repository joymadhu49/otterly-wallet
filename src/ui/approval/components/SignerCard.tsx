import React from 'react';
import { shortAddr } from '../../shared/utils/format';

// Inline tiny pixel avatar (deterministic)
const PixelAvatar: React.FC<{ address: string; size?: number }> = ({ address, size = 28 }) => {
  const h = address.replace(/^0x/, '').toLowerCase().padEnd(40, '0');
  const n = 5;
  const half = Math.ceil(n / 2);
  const hueA = parseInt(h.slice(0, 4), 16) % 360;
  const hueB = (hueA + 60 + (parseInt(h.slice(4, 8), 16) % 80)) % 360;
  const palette = [
    `hsl(${hueA} 70% 55%)`,
    `hsl(${hueB} 75% 50%)`,
    `hsl(${(hueA + 200) % 360} 60% 45%)`,
    '#11131A',
  ];
  let idx = 8;
  const cells: string[][] = [];
  for (let y = 0; y < n; y++) {
    const row: string[] = [];
    for (let x = 0; x < half; x++) {
      const v = parseInt(h.charAt(idx++ % h.length), 16);
      row.push(palette[v % palette.length]);
    }
    const full = [...row];
    for (let x = half - 2; x >= 0; x--) full.push(row[x]);
    cells.push(full);
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 8,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: `repeat(${n}, 1fr)`,
        flexShrink: 0,
      }}
    >
      {cells.flatMap((row, y) => row.map((c, x) => (
        <div key={`${x}-${y}`} style={{ background: c }} />
      )))}
    </div>
  );
};

export const SignerCard: React.FC<{ address: string; label?: string }> = ({ address, label = 'Signer' }) => (
  <div
    className="arc-row"
    style={{
      background: '#11131A',
      border: '1px solid #1B1E27',
      borderRadius: 12,
      padding: '10px 12px',
      gap: 10,
    }}
  >
    <PixelAvatar address={address} size={28} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: '#5A5F6E', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div className="arc-mono" style={{ fontSize: 12, color: '#fff', marginTop: 1 }}>{shortAddr(address, 6)}</div>
    </div>
  </div>
);
