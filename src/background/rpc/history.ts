import browser from 'webextension-polyfill';
import { ethers } from 'ethers';
import { callWithFallback } from './arcProvider';
import { ARC_TESTNET } from '../../constants/chain';

const HISTORY_KEY = 'arc:history';

export type TxDirection = 'in' | 'out' | 'self';

export type TokenMove = {
  tokenAddress: string;
  symbol: string;
  decimals: number;
  value: string; // raw bn string
  from: string;
  to: string;
  direction: TxDirection;
};

export type TxRecord = {
  hash: string;
  from: string;
  to: string;
  value: string;          // native value raw
  data: string;
  chainId: number;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;       // ms
  blockNumber?: number;
  origin?: string;
  label?: string;
  method?: string;
  direction?: TxDirection; // primary direction (native or first transfer)
  // primary token (the most relevant one for display)
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  tokenTransfers?: TokenMove[];
  feeRaw?: string;         // network fee in native wei
};

export async function readHistory(): Promise<Record<string, TxRecord[]>> {
  const data = await browser.storage.local.get(HISTORY_KEY);
  return data[HISTORY_KEY] || {};
}

async function writeHistory(h: Record<string, TxRecord[]>): Promise<void> {
  await browser.storage.local.set({ [HISTORY_KEY]: h });
}

export async function recordTx(account: string, rec: TxRecord): Promise<void> {
  const h = await readHistory();
  const key = account.toLowerCase();
  if (!rec.direction) {
    rec.direction = rec.from.toLowerCase() === key
      ? (rec.to?.toLowerCase() === key ? 'self' : 'out')
      : 'in';
  }
  h[key] = [rec, ...(h[key] || []).filter((r) => r.hash !== rec.hash)].slice(0, 200);
  await writeHistory(h);
}

export async function getHistoryFor(account: string): Promise<TxRecord[]> {
  const h = await readHistory();
  return h[account.toLowerCase()] || [];
}

async function refreshPendingLocal(account: string): Promise<void> {
  const list = await getHistoryFor(account);
  const pending = list.filter((r) => r.status === 'pending');
  if (!pending.length) return;
  await Promise.all(pending.map(async (r) => {
    try {
      const receipt = await callWithFallback((p) => p.getTransactionReceipt(r.hash));
      if (receipt) {
        r.status = receipt.status === 1 ? 'confirmed' : 'failed';
        r.blockNumber = receipt.blockNumber;
      }
    } catch { /* leave pending */ }
  }));
  const h = await readHistory();
  const key = account.toLowerCase();
  const map = new Map((h[key] || []).map((r) => [r.hash, r] as const));
  pending.forEach((r) => map.set(r.hash, r));
  h[key] = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  await writeHistory(h);
}

function dirFor(me: string, from?: string, to?: string): TxDirection {
  const m = me.toLowerCase();
  const f = (from || '').toLowerCase();
  const t = (to || '').toLowerCase();
  if (f === m && t === m) return 'self';
  if (f === m) return 'out';
  return 'in';
}

function parseTokenMoveBs(t: any, me: string): TokenMove | null {
  try {
    const ti = t.token || {};
    return {
      tokenAddress: ti.address ? ethers.utils.getAddress(ti.address) : '',
      symbol: ti.symbol || '',
      decimals: Number(ti.decimals || 18),
      value: (t.total?.value || t.value || '0').toString(),
      from: t.from?.hash || '',
      to: t.to?.hash || '',
      direction: dirFor(me, t.from?.hash, t.to?.hash),
    };
  } catch { return null; }
}

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchArcscanHistory(account: string): Promise<TxRecord[]> {
  const me = account.toLowerCase();
  const base = `${ARC_TESTNET.apiBase}/v2/addresses/${account}`;
  const [txJson, ttJson] = await Promise.all([
    fetchJson(`${base}/transactions?filter=to%20%7C%20from`),
    fetchJson(`${base}/token-transfers?type=ERC-20`),
  ]);

  const records: TxRecord[] = [];

  if (txJson?.items?.length) {
    for (const t of txJson.items as any[]) {
      const from = t.from?.hash || '';
      const to = t.to?.hash || '';
      const valueRaw = (t.value || '0').toString();
      const status: TxRecord['status'] =
        t.status === 'ok' ? 'confirmed' :
        t.status === 'error' ? 'failed' : 'pending';
      const moves: TokenMove[] = (t.token_transfers || [])
        .map((x: any) => parseTokenMoveBs(x, me))
        .filter(Boolean) as TokenMove[];

      const primaryMove = moves.find((m) => m.direction !== 'self') || moves[0];
      const direction: TxDirection = primaryMove
        ? primaryMove.direction
        : dirFor(me, from, to);

      records.push({
        hash: t.hash,
        from: from ? ethers.utils.getAddress(from) : '',
        to: to ? ethers.utils.getAddress(to) : '',
        value: valueRaw,
        data: t.raw_input || '0x',
        chainId: ARC_TESTNET.chainId,
        status,
        timestamp: t.timestamp ? new Date(t.timestamp).getTime() : Date.now(),
        blockNumber: t.block_number || t.block,
        method: t.method || (t.decoded_input?.method_call?.split('(')[0]) || undefined,
        direction,
        tokenAddress: primaryMove?.tokenAddress,
        tokenSymbol: primaryMove?.symbol,
        tokenDecimals: primaryMove?.decimals,
        tokenTransfers: moves,
        feeRaw: t.fee?.value || undefined,
      });
    }
  }

  if (ttJson?.items?.length) {
    for (const t of ttJson.items as any[]) {
      const move = parseTokenMoveBs(t, me);
      if (!move) continue;
      const hash = t.tx_hash || t.transaction_hash;
      if (!hash) continue;
      const existing = records.find((r) => r.hash === hash);
      if (existing) {
        if (!existing.tokenTransfers?.length) existing.tokenTransfers = [];
        if (!existing.tokenTransfers.find((m) => m.tokenAddress === move.tokenAddress && m.value === move.value)) {
          existing.tokenTransfers.push(move);
          if (!existing.tokenSymbol) {
            existing.tokenSymbol = move.symbol;
            existing.tokenDecimals = move.decimals;
            existing.tokenAddress = move.tokenAddress;
            existing.direction = move.direction;
          }
        }
        continue;
      }
      records.push({
        hash,
        from: move.from ? ethers.utils.getAddress(move.from) : '',
        to: move.to ? ethers.utils.getAddress(move.to) : '',
        value: '0',
        data: '0x',
        chainId: ARC_TESTNET.chainId,
        status: 'confirmed',
        timestamp: t.timestamp ? new Date(t.timestamp).getTime() : Date.now(),
        blockNumber: t.block_number,
        direction: move.direction,
        tokenAddress: move.tokenAddress,
        tokenSymbol: move.symbol,
        tokenDecimals: move.decimals,
        tokenTransfers: [move],
      });
    }
  }

  return records;
}

function dedupe(records: TxRecord[]): TxRecord[] {
  const map = new Map<string, TxRecord>();
  for (const r of records) {
    const existing = map.get(r.hash);
    if (!existing) { map.set(r.hash, r); continue; }
    const merged: TxRecord = {
      ...existing,
      ...r,
      label: r.label || existing.label,
      origin: r.origin || existing.origin,
      method: r.method || existing.method,
      tokenAddress: r.tokenAddress || existing.tokenAddress,
      tokenSymbol: r.tokenSymbol || existing.tokenSymbol,
      tokenDecimals: r.tokenDecimals ?? existing.tokenDecimals,
      tokenTransfers: (r.tokenTransfers && r.tokenTransfers.length ? r.tokenTransfers : existing.tokenTransfers),
      direction: existing.direction || r.direction,
      status:
        r.status === 'confirmed' || r.status === 'failed' ? r.status :
        existing.status === 'confirmed' || existing.status === 'failed' ? existing.status :
        r.status,
      blockNumber: r.blockNumber ?? existing.blockNumber,
      timestamp: existing.timestamp || r.timestamp,
      feeRaw: r.feeRaw || existing.feeRaw,
    };
    map.set(r.hash, merged);
  }
  return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
}

export async function refreshPending(account: string): Promise<TxRecord[]> {
  await refreshPendingLocal(account);
  const local = await getHistoryFor(account);
  const remote = await fetchArcscanHistory(account);
  const merged = dedupe([...remote, ...local]);
  const h = await readHistory();
  h[account.toLowerCase()] = merged.slice(0, 200);
  await writeHistory(h);
  return h[account.toLowerCase()];
}
