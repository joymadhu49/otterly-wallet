export const PORT_NAMES = {
  POPUP: 'arc:popup',
  CONTENT: 'arc:content',
  NOTIFICATION: 'arc:notification',
} as const;

export type RpcRequest = {
  id: string | number;
  method: string;
  params?: unknown[];
  origin?: string;
};

export type RpcResponse =
  | { id: string | number; result: unknown }
  | { id: string | number; error: { code: number; message: string; data?: unknown } };

export const INTERNAL_METHODS = {
  GET_STATE: 'arc_getState',
  CREATE_VAULT: 'arc_createVault',
  IMPORT_MNEMONIC: 'arc_importMnemonic',
  IMPORT_PRIVKEY: 'arc_importPrivkey',
  UNLOCK: 'arc_unlock',
  LOCK: 'arc_lock',
  ADD_ACCOUNT: 'arc_addAccount',
  SELECT_ACCOUNT: 'arc_selectAccount',
  RENAME_ACCOUNT: 'arc_renameAccount',
  EXPORT_PRIVKEY: 'arc_exportPrivkey',
  EXPORT_MNEMONIC: 'arc_exportMnemonic',
  GET_BALANCE: 'arc_getBalance',
  GET_TOKEN_BALANCES: 'arc_getTokenBalances',
  GET_GAS_PRICE: 'arc_getGasPrice',
  SEND_TX: 'arc_sendTx',
  GET_TX_HISTORY: 'arc_getTxHistory',
  GET_NFTS: 'arc_getNfts',
  GET_PENDING_APPROVALS: 'arc_getPendingApprovals',
  RESOLVE_APPROVAL: 'arc_resolveApproval',
  REJECT_APPROVAL: 'arc_rejectApproval',
  GET_CONNECTED_SITES: 'arc_getConnectedSites',
  DISCONNECT_SITE: 'arc_disconnectSite',
} as const;
