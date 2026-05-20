import browser from 'webextension-polyfill';
import { keyringService } from './keyring/keyringService';
import { handle as handleDapp, JsonRpcError } from './providerController';
import { handleInternal } from './internalController';
import { bindAutolock, rearmAutolock } from './session';

(async () => {
  await keyringService.init();
  await rearmAutolock();
  bindAutolock();
})();

type RpcMsg = {
  type: 'arc:rpc' | 'arc:internal';
  id: string | number;
  method: string;
  params?: any;
  origin?: string;
};

browser.runtime.onMessage.addListener(async (msg: any, sender) => {
  if (!msg || typeof msg !== 'object') return;
  const message = msg as RpcMsg;

  try {
    if (message.type === 'arc:rpc') {
      const origin = sender.url ? new URL(sender.url).origin : (message.origin || 'unknown');
      const result = await handleDapp(message.method, message.params || [], {
        origin,
        tabId: sender.tab?.id,
      });
      return { id: message.id, result };
    }
    if (message.type === 'arc:internal') {
      const result = await handleInternal(message.method, message.params || {});
      return { id: message.id, result };
    }
  } catch (e: any) {
    const code = e instanceof JsonRpcError ? e.code : e?.code || -32603;
    return {
      id: message.id,
      error: { code, message: e?.message || String(e), data: e?.data },
    };
  }
});

// Notify content scripts on lock/unlock or chain change (placeholder)
export {};
