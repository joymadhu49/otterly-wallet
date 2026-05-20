import { ethers } from 'ethers';
import { callWithFallback } from './arcProvider';
import { ARC_TESTNET, KNOWN_TOKENS } from '../../constants/chain';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

export type TokenBalance = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string; // raw bn string
  isNative: boolean;
};

export async function getNativeBalance(address: string): Promise<TokenBalance> {
  const bal = await callWithFallback((p) => p.getBalance(address));
  return {
    address: 'native',
    symbol: ARC_TESTNET.nativeCurrency.symbol,
    name: ARC_TESTNET.nativeCurrency.name,
    decimals: ARC_TESTNET.nativeCurrency.decimals,
    balance: bal.toString(),
    isNative: true,
  };
}

export async function getErc20Balance(tokenAddress: string, account: string): Promise<TokenBalance> {
  const known = KNOWN_TOKENS.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase());
  return callWithFallback(async (p) => {
    const c = new ethers.Contract(tokenAddress, ERC20_ABI, p);
    const [bal, decimals, symbol, name] = await Promise.all([
      c.balanceOf(account),
      known?.decimals !== undefined ? Promise.resolve(known.decimals) : c.decimals(),
      known?.symbol ? Promise.resolve(known.symbol) : c.symbol(),
      known?.name ? Promise.resolve(known.name) : c.name(),
    ]);
    return {
      address: ethers.utils.getAddress(tokenAddress),
      symbol,
      name,
      decimals,
      balance: bal.toString(),
      isNative: false,
    };
  });
}

export async function getAllBalances(account: string, extraTokens: string[] = []): Promise<TokenBalance[]> {
  const native = await getNativeBalance(account);
  const tokens = [
    ...KNOWN_TOKENS.filter((t) => !t.isNativeMirror).map((t) => t.address),
    ...extraTokens,
  ];
  const erc = await Promise.all(tokens.map((t) => getErc20Balance(t, account).catch(() => null)));
  return [native, ...(erc.filter(Boolean) as TokenBalance[])];
}

export function encodeErc20Transfer(to: string, amount: ethers.BigNumber): string {
  const iface = new ethers.utils.Interface(ERC20_ABI);
  return iface.encodeFunctionData('transfer', [to, amount]);
}
