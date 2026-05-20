import { ethers } from 'ethers';
import { keyringService } from './keyring/keyringService';
import { ARC_TESTNET } from '../constants/chain';
import { callWithFallback, rawRpc } from './rpc/arcProvider';
import { estimateGas, getGasPrice } from './rpc/fees';
import { recordTx } from './rpc/history';
import * as perms from './permissions';
import { requestApproval } from './notification';
import { touchActivity } from './session';

type Ctx = { origin: string; tabId?: number };

export class JsonRpcError extends Error {
  code: number;
  data?: unknown;
  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

const PASSTHROUGH = new Set([
  'eth_blockNumber',
  'eth_call',
  'eth_estimateGas',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByNumber',
  'eth_getBlockByHash',
  'eth_getCode',
  'eth_getLogs',
  'eth_getStorageAt',
  'eth_getTransactionByHash',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_sendRawTransaction',
  'net_version',
  'web3_clientVersion',
]);

async function ensureUnlocked(): Promise<void> {
  if (keyringService.isLocked()) {
    throw new JsonRpcError(4100, 'Wallet is locked. Open Otterly to unlock.');
  }
}

async function ensureConnected(origin: string): Promise<string[]> {
  const p = await perms.get(origin);
  if (!p || !p.accounts.length) {
    throw new JsonRpcError(4100, 'Not connected. Call eth_requestAccounts first.');
  }
  return p.accounts;
}

export async function handle(method: string, params: any[] = [], ctx: Ctx): Promise<any> {
  touchActivity();

  switch (method) {
    case 'eth_chainId':
      return ARC_TESTNET.chainIdHex;
    case 'net_version':
      return String(ARC_TESTNET.chainId);

    case 'eth_accounts': {
      const p = await perms.get(ctx.origin);
      return p?.accounts || [];
    }

    case 'eth_requestAccounts': {
      const existing = await perms.get(ctx.origin);
      if (existing && existing.accounts.length) {
        return existing.accounts;
      }
      const accounts = keyringService.listAccounts();
      if (!accounts.length || keyringService.isLocked()) {
        // open unlock/onboarding via approval popup
        const result = await requestApproval<string[]>('connect', ctx.origin, { needsUnlock: true });
        await perms.grant(ctx.origin, result);
        return result;
      }
      const result = await requestApproval<string[]>('connect', ctx.origin, {
        accounts: accounts.map((a) => a.address),
      });
      await perms.grant(ctx.origin, result);
      return result;
    }

    case 'wallet_addEthereumChain':
    case 'wallet_switchEthereumChain': {
      const raw = params[0]?.chainId ?? params[0];
      const requested = normalizeChainId(raw);
      if (requested !== null && requested === BigInt(ARC_TESTNET.chainId)) {
        return null;
      }
      throw new JsonRpcError(
        4901,
        `Otterly currently supports only Arc Testnet (chainId ${ARC_TESTNET.chainId} / ${ARC_TESTNET.chainIdHex}).`,
      );
    }

    case 'wallet_watchAsset': {
      const accepted = await requestApproval<boolean>('watchAsset', ctx.origin, params[0]);
      return accepted;
    }

    case 'personal_sign': {
      await ensureUnlocked();
      const accounts = await ensureConnected(ctx.origin);
      const [msgHex, from] = params;
      const addr = (from || accounts[0]).toLowerCase();
      if (!accounts.includes(addr)) {
        throw new JsonRpcError(4100, 'Account not authorized for this site');
      }
      const message = ethers.utils.isBytesLike(msgHex)
        ? ethers.utils.arrayify(msgHex)
        : msgHex;
      await requestApproval<boolean>('signMessage', ctx.origin, { message: msgHex, address: addr });
      return keyringService.signMessage(addr, message);
    }

    case 'eth_signTypedData_v4': {
      await ensureUnlocked();
      const accounts = await ensureConnected(ctx.origin);
      const [from, payloadRaw] = params;
      const addr = from.toLowerCase();
      if (!accounts.includes(addr)) {
        throw new JsonRpcError(4100, 'Account not authorized for this site');
      }
      const payload = typeof payloadRaw === 'string' ? JSON.parse(payloadRaw) : payloadRaw;
      await requestApproval<boolean>('signTypedData', ctx.origin, { payload, address: addr });
      const { domain, types, message, primaryType } = payload;
      const filteredTypes = { ...types };
      delete filteredTypes.EIP712Domain;
      return keyringService.signTypedData(addr, domain, filteredTypes, message);
    }

    case 'eth_sendTransaction': {
      await ensureUnlocked();
      const accounts = await ensureConnected(ctx.origin);
      const txParams = params[0] || {};
      const from = (txParams.from || accounts[0]).toLowerCase();
      if (!accounts.includes(from)) {
        throw new JsonRpcError(4100, 'Account not authorized');
      }

      const tx: ethers.providers.TransactionRequest = {
        to: txParams.to,
        from,
        value: txParams.value ? ethers.BigNumber.from(txParams.value) : undefined,
        data: txParams.data || '0x',
        gasLimit: txParams.gas ? ethers.BigNumber.from(txParams.gas) : undefined,
        gasPrice: txParams.gasPrice ? ethers.BigNumber.from(txParams.gasPrice) : undefined,
        nonce: txParams.nonce ? Number(txParams.nonce) : undefined,
        chainId: ARC_TESTNET.chainId,
        type: 0,
      };

      if (!tx.gasLimit) {
        try { tx.gasLimit = await estimateGas(tx); } catch { tx.gasLimit = ethers.BigNumber.from(150000); }
      }
      if (!tx.gasPrice) {
        try { tx.gasPrice = await getGasPrice(); } catch { tx.gasPrice = ethers.BigNumber.from(0); }
      }
      if (tx.nonce === undefined) {
        tx.nonce = await callWithFallback((p) => p.getTransactionCount(from, 'pending'));
      }

      await requestApproval<boolean>('signTx', ctx.origin, { tx: serializeTxForUi(tx) });

      const signed = await keyringService.signTransaction(from, tx);
      const sent = await callWithFallback((p) => p.sendTransaction(signed));
      await recordTx(from, {
        hash: sent.hash,
        from,
        to: tx.to || '0x',
        value: (tx.value || ethers.BigNumber.from(0)).toString(),
        data: (tx.data as string) || '0x',
        chainId: ARC_TESTNET.chainId,
        status: 'pending',
        timestamp: Date.now(),
        origin: ctx.origin,
      });
      return sent.hash;
    }

    default:
      if (PASSTHROUGH.has(method)) {
        return rawRpc(method, params);
      }
      throw new JsonRpcError(-32601, `Method ${method} not supported`);
  }
}

function normalizeChainId(input: unknown): bigint | null {
  if (input === null || input === undefined) return null;
  try {
    if (typeof input === 'bigint') return input;
    if (typeof input === 'number') return BigInt(input);
    if (typeof input === 'string') {
      const s = input.trim();
      if (!s) return null;
      return BigInt(s); // BigInt accepts both decimal and 0x-prefixed strings
    }
  } catch {
    return null;
  }
  return null;
}

function serializeTxForUi(tx: ethers.providers.TransactionRequest) {
  return {
    to: tx.to,
    from: tx.from,
    value: tx.value ? ethers.BigNumber.from(tx.value).toString() : '0',
    data: tx.data,
    gasLimit: tx.gasLimit ? ethers.BigNumber.from(tx.gasLimit).toString() : '0',
    gasPrice: tx.gasPrice ? ethers.BigNumber.from(tx.gasPrice).toString() : '0',
    nonce: tx.nonce,
    chainId: tx.chainId,
  };
}
