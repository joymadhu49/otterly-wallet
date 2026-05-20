import { ethers } from 'ethers';
import { ARC_TESTNET } from '../../constants/chain';

let providerCache: ethers.providers.JsonRpcProvider | null = null;
let activeUrlIdx = 0;

export function getProvider(): ethers.providers.JsonRpcProvider {
  if (providerCache) return providerCache;
  providerCache = new ethers.providers.StaticJsonRpcProvider(
    ARC_TESTNET.rpcUrls[activeUrlIdx],
    {
      name: ARC_TESTNET.name,
      chainId: ARC_TESTNET.chainId,
    },
  );
  return providerCache;
}

export async function callWithFallback<T>(fn: (p: ethers.providers.JsonRpcProvider) => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < ARC_TESTNET.rpcUrls.length; i++) {
    try {
      return await fn(getProvider());
    } catch (e) {
      lastErr = e;
      activeUrlIdx = (activeUrlIdx + 1) % ARC_TESTNET.rpcUrls.length;
      providerCache = null;
    }
  }
  throw lastErr;
}

export async function rawRpc(method: string, params: unknown[]): Promise<unknown> {
  return callWithFallback((p) => p.send(method, params as any));
}
