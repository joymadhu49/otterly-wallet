import { ethers } from 'ethers';
import { ARC_TESTNET } from '../../../constants/chain';

export function shortAddr(addr?: string, chars = 4): string {
  if (!addr) return '';
  return `${addr.slice(0, 2 + chars)}…${addr.slice(-chars)}`;
}

export function formatUnits(raw: string | ethers.BigNumber, decimals: number, displayDp = 4): string {
  try {
    const bn = ethers.BigNumber.from(raw);
    const full = ethers.utils.formatUnits(bn, decimals);
    const [int, frac = ''] = full.split('.');
    if (!displayDp) return int;
    const trimmed = frac.slice(0, displayDp).replace(/0+$/, '');
    return trimmed ? `${int}.${trimmed}` : int;
  } catch {
    return '0';
  }
}

export function formatNative(raw: string | ethers.BigNumber, dp = 4): string {
  return formatUnits(raw, ARC_TESTNET.nativeCurrency.decimals, dp);
}

export function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function explorerTx(hash: string): string {
  return `${ARC_TESTNET.explorer}/tx/${hash}`;
}

export function explorerAddr(addr: string): string {
  return `${ARC_TESTNET.explorer}/address/${addr}`;
}

export function copy(text: string): boolean {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      return true;
    }
  } catch {
    /* fall through */
  }
  return fallbackCopy(text);
}

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// Render a deterministic gradient avatar from address
export function addrGradient(addr: string): string {
  if (!addr) return 'linear-gradient(135deg, #00D26A, #2D72FF)';
  const a = parseInt(addr.slice(2, 8), 16);
  const b = parseInt(addr.slice(8, 14), 16);
  const h1 = a % 360;
  const h2 = (b % 360 + 60) % 360;
  return `linear-gradient(135deg, hsl(${h1} 70% 55%) 0%, hsl(${h2} 70% 45%) 100%)`;
}
