import React, { useMemo } from 'react';

// Deterministic blocky avatar (OKX-style) from address
export const PixelAvatar: React.FC<{ address?: string; size?: number }> = ({ address = '', size = 44 }) => {
  const cells = useMemo(() => {
    const h = address.replace(/^0x/, '').toLowerCase().padEnd(40, '0');
    const n = 5; // 5x5 symmetric
    const half = Math.ceil(n / 2);
    const grid: string[][] = [];
    // pick palette from hash
    const hueA = parseInt(h.slice(0, 4), 16) % 360;
    const hueB = (hueA + 40 + (parseInt(h.slice(4, 8), 16) % 80)) % 360;
    const palette = [
      `hsl(${hueA} 70% 55%)`,
      `hsl(${hueB} 75% 50%)`,
      `hsl(${(hueA + 200) % 360} 60% 45%)`,
      '#11131A',
    ];
    let idx = 8;
    for (let y = 0; y < n; y++) {
      const row: string[] = [];
      for (let x = 0; x < half; x++) {
        const v = parseInt(h.charAt(idx++ % h.length), 16);
        row.push(palette[v % palette.length]);
      }
      // mirror
      const full = [...row];
      for (let x = half - 2; x >= 0; x--) full.push(row[x]);
      grid.push(full);
    }
    return grid;
  }, [address]);

  const cell = size / cells.length;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {cells.flatMap((row, y) =>
        row.map((c, x) => (
          <div key={`${x}-${y}`} style={{ background: c, width: cell, height: cell }} />
        )),
      )}
    </div>
  );
};
