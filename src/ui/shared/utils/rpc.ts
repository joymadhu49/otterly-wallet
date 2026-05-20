import browser from 'webextension-polyfill';
import { INTERNAL_METHODS } from '../../../constants/messages';

let nextId = 1;

export async function call<T = any>(method: string, params: any = {}): Promise<T> {
  const id = nextId++;
  const res: any = await browser.runtime.sendMessage({ type: 'arc:internal', id, method, params });
  if (!res) throw new Error('No response from background');
  if (res.error) {
    const err: any = new Error(res.error.message);
    err.code = res.error.code;
    err.data = res.error.data;
    throw err;
  }
  return res.result as T;
}

export const api = {
  getState: () => call(INTERNAL_METHODS.GET_STATE),
  createVault: (mnemonic: string, password: string) =>
    call(INTERNAL_METHODS.CREATE_VAULT, { mnemonic, password }),
  importMnemonic: (mnemonic: string, password: string) =>
    call(INTERNAL_METHODS.IMPORT_MNEMONIC, { mnemonic, password }),
  importPrivkey: (privkey: string, password: string) =>
    call(INTERNAL_METHODS.IMPORT_PRIVKEY, { privkey, password }),
  unlock: (password: string) => call(INTERNAL_METHODS.UNLOCK, { password }),
  lock: () => call(INTERNAL_METHODS.LOCK),
  addAccount: () => call(INTERNAL_METHODS.ADD_ACCOUNT),
  selectAccount: (address: string) => call(INTERNAL_METHODS.SELECT_ACCOUNT, { address }),
  renameAccount: (address: string, name: string) =>
    call(INTERNAL_METHODS.RENAME_ACCOUNT, { address, name }),
  exportPrivkey: (address: string, password: string) =>
    call<string>(INTERNAL_METHODS.EXPORT_PRIVKEY, { address, password }),
  exportMnemonic: (password: string) =>
    call<string>(INTERNAL_METHODS.EXPORT_MNEMONIC, { password }),
  getBalances: (address: string, extraTokens: string[] = []) =>
    call(INTERNAL_METHODS.GET_BALANCE, { address, extraTokens }),
  getGasPrice: () => call<string>(INTERNAL_METHODS.GET_GAS_PRICE),
  sendTx: (params: {
    from: string;
    to: string;
    value: string;
    data?: string;
    tokenAddress?: string;
    decimals?: number;
  }) => call<string>(INTERNAL_METHODS.SEND_TX, params),
  txHistory: (address: string) => call(INTERNAL_METHODS.GET_TX_HISTORY, { address }),
  getNfts: (address: string) => call(INTERNAL_METHODS.GET_NFTS, { address }),
  pendingApprovals: () => call(INTERNAL_METHODS.GET_PENDING_APPROVALS),
  resolveApproval: (id: string, result: any) =>
    call(INTERNAL_METHODS.RESOLVE_APPROVAL, { id, result }),
  rejectApproval: (id: string, code?: number, message?: string) =>
    call(INTERNAL_METHODS.REJECT_APPROVAL, { id, code, message }),
  connectedSites: () => call(INTERNAL_METHODS.GET_CONNECTED_SITES),
  disconnectSite: (origin: string) =>
    call(INTERNAL_METHODS.DISCONNECT_SITE, { origin }),
  setSettings: (s: any) => call('arc_setSettings', s),
};
