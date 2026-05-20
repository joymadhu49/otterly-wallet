import EventEmitter from 'eventemitter3';

const ARC_CHAIN_ID = '0x' + (5042002).toString(16); // '0x4cef52'

type Pending = { resolve: (v: any) => void; reject: (e: any) => void };

class ArcProvider extends EventEmitter {
  isArc = true;
  isMetaMask = false; // some dApps gate features on this; toggle if compat needed
  chainId = ARC_CHAIN_ID;
  networkVersion = '5042002';
  selectedAddress: string | null = null;
  _accounts: string[] = [];

  private nextId = 1;
  private pending = new Map<number, Pending>();

  constructor() {
    super();
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      const msg = event.data;
      if (!msg || msg.target !== 'arc-inpage') return;
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.response?.error) {
        const err: any = new Error(msg.response.error.message);
        err.code = msg.response.error.code;
        err.data = msg.response.error.data;
        p.reject(err);
      } else {
        p.resolve(msg.response.result);
      }
    });
  }

  isConnected(): boolean {
    return true;
  }

  async request(args: { method: string; params?: any[] | Record<string, any> }): Promise<any> {
    if (!args || typeof args.method !== 'string') {
      const err: any = new Error('Invalid request');
      err.code = -32600;
      throw err;
    }
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      window.postMessage({
        target: 'arc-content',
        id,
        method: args.method,
        params: Array.isArray(args.params) ? args.params : args.params ? [args.params] : [],
      }, '*');
    }).then((result: any) => {
      if (args.method === 'eth_requestAccounts' || args.method === 'eth_accounts') {
        this._accounts = result || [];
        const newSelected = (this._accounts[0] || null);
        if (newSelected !== this.selectedAddress) {
          this.selectedAddress = newSelected;
          this.emit('accountsChanged', this._accounts);
        }
      }
      return result;
    });
  }

  // Legacy compat
  enable(): Promise<string[]> {
    return this.request({ method: 'eth_requestAccounts' });
  }

  send(method: any, params?: any): any {
    if (typeof method === 'string') {
      return this.request({ method, params });
    }
    return this.sendAsync(method, params);
  }

  sendAsync(payload: any, callback: (err: any, res?: any) => void): void {
    this.request({ method: payload.method, params: payload.params })
      .then((result) => callback(null, { id: payload.id, jsonrpc: '2.0', result }))
      .catch((err) => callback(err));
  }
}

const provider = new ArcProvider();

// Expose
(window as any).arc = provider;
if (!(window as any).ethereum) {
  (window as any).ethereum = provider;
} else {
  // Coexist: announce via EIP-6963
}

// EIP-6963: announce provider
const info = {
  uuid: 'otterly-wallet-' + Math.random().toString(36).slice(2),
  name: 'Otterly Wallet',
  icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjNkNCMkZGIi8+PHN0b3Agb2Zmc2V0PSIwLjU1IiBzdG9wLWNvbG9yPSIjNEQ4RUU5Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMUM0RUM0Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNy4yIiBmaWxsPSJ1cmwoI2cpIi8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNSA1KSBzY2FsZSgwLjIyKSIgZmlsbD0iI2ZmZiI+PHBhdGggZD0ibTk3LjcgNTMuOGMtMC42LTQuMy0xLjEtOC42LTEuNy0xMy40LTAuNC0yLjYtMS01LjEtMS44LTguNCAxLjQtMS40IDIuOC0zIDMuNi01LjIgMS41LTQuMiAwLjktOC40LTEuOS0xMS44LTIuMS0yLjQtNC45LTQuMS04LjItNC4zLTIuNy0wLjItNS4yIDAuNS03LjkgMi4zLTMuMS0yLjItNi41LTQuMS0xMC4yLTUuNC01LjItMS44LTEwLTIuOC0xNy43LTMuMS03LjgtMC4xLTE0LjcgMC42LTIxLjIgMy0zLjIgMS4yLTYuNyAyLjktMTAuNSA1LjUtMi4xLTEuMy00LjQtMi4yLTcuMS0yLjItNC4zLTAuMS04LjUgMi41LTEwLjMgNi4zLTEuOSA0LTEuMiA5LjQgMS40IDEyLjVsMS45IDIuM3YwLjFjLTEgMy0xLjcgNi41LTIuMSAxMC41cy0wLjkgOC40LTEuNiAxMy4xYy0wLjQgMi40LTAuNyA2LTAuNiA5LjMgMC4yIDMuNiAwLjcgNyAyLjkgMTEuNCAxLjYgMi45IDMuOCA1LjkgNyA4LjQgMi41IDIuMSA1LjYgNCA5LjcgNS42IDQuNSAxLjggMTEuMiAzLjcgMTkuMyA0LjYgMyAwLjMgNi4yIDAuNSA5LjYgMC41czcuMS0wLjEgMTAuOC0wLjVjNS40LTAuNSAxMS4yLTEuNCAxNi4zLTMuMiA0LjktMS44IDkuNS00IDEzLjItNy42IDMuMy0zLjEgNS43LTcuMSA3LjEtMTEuMyAxLjgtNiAxLTExLjkgMC0xOXptLTEwLTM5LjRjMi44IDAuMiA1LjUgMi4xIDYuNyA0LjggMC45IDIuNCAwLjggNi4yLTEuNyA4LjlsLTAuMSAwLjJjLTItNC4xLTUtOC43LTkuNi0xMi43IDEuNS0wLjkgMy4zLTEuMiA0LjctMS4yem0tODEuOCA0LjhjMS4yLTIuOCA0LjEtNC44IDcuNC00LjggMS4yIDAgMi43IDAuNCAzLjggMS4xLTMuNiAzLjEtNy4yIDcuOS05LjUgMTIuOS0yLjQtMi40LTMtNi40LTEuNy05LjJ6bTg3LjIgNTQuOWMtMC43IDEuNS0xLjYgMy0zLjIgNS0xLjYgMS44LTMuNiAzLjYtNi4zIDUuMi00LjMgMi43LTEwLjIgNC44LTE4LjUgNi40LTQuNiAwLjctOS42IDEuMi0xNC45IDEuMy01LjggMC0xMS44LTAuNC0xNy43LTEuNS0zLjMtMC42LTYuNC0xLjUtOS40LTIuNi0yLjctMS01LjMtMi4zLTguNi00LjUtMy42LTIuNy02LjUtNi4yLTgtMTAuNS0xLjQtNC4yLTEuOC04LjgtMS0xMy45IDAuOC01LjQgMS40LTEwLjQgMi0xNi4xIDEuMi0xMCA1LjktMTguMSAxMi44LTI0LjIgMi44LTIuNSA2LjMtNC44IDEwLjItNi42IDQuNC0xLjkgOC45LTMuMyAxNi40LTQgNy42LTAuMiAxMy42IDAuNCAxOC4yIDEuNyA1LjkgMS43IDEwLjggNC4yIDE0LjkgNy43IDQuNyA0IDguNCA5LjEgMTAuNiAxNS4xIDEgMi44IDEuNyA1LjkgMi4xIDkuNSAwLjcgNi4zIDEuMiAxMS41IDEuOSAxNi4zIDAuOSA2LjYgMC4zIDExLjctMS41IDE1Ljd6Ii8+PHBhdGggZD0ibTUwIDQ3Yy0yIDAtNS45IDAuNS01LjkgMi44IDAgMS43IDEuOSA0LjggNS44IDQuOCAzLjggMC4xIDUuOC0yLjcgNS45LTQuNyAwLTItMi43LTIuOS01LjgtMi45eiIvPjxwYXRoIGQ9Im0zMS4xIDM5LjdjLTIuNy0wLjEtNS42IDItNS42IDVzMi4zIDUgNC44IDVjMi44IDAuMSA1LjUtMS44IDUuNS01LjEgMC0yLjctMi4yLTQuOC00LjctNC45em0xLjUgNC42Yy0yLTAuMi0yLTMuMiAwLTMgMS45IDAuMiAyLjEgMyAwIDN6Ii8+PHBhdGggZD0ibTY5LjYgMzkuN2MtMyAwLTUuNCAyLjQtNS40IDUuMiAwIDIuMiAxLjkgNC44IDUgNC44IDMuNCAwIDUuMy0yLjMgNS4zLTUgMC0yLjYtMi01LTQuOS01em0xLjcgNC42Yy0xLjktMC4yLTIuMi0yLjktMC4xLTMgMiAwIDIuMyAzIDAuMSAzeiIvPjxwYXRoIGQ9Im0yMy43IDUxLjFjLTMuMy0wLjUtOC41IDAuNi04LjUgNC4yIDAuMSAyLjEgMy4zIDMuOCA1LjUgMy45IDMuNiAwLjQgNy43LTEuNSA3LjYtNC4xLTAuMS0xLjctMi4zLTMuNi00LjYtNHptLTIuMSA2LjljLTEuNyAwLTUuMS0wLjktNS4xLTIuNy0wLjEtMS43IDMuMS0zLjEgNS41LTMgMi4xIDAuMSA1IDEuMiA1IDMgMCAxLTEuOSAyLjYtNS40IDIuN3oiLz48cGF0aCBkPSJtNzguMyA1MWMtMi45IDAtNi42IDEuNi02LjYgNC4zIDAgMS44IDIuNCAzLjggNS43IDQgMy41IDAuMiA3LjMtMS4zIDcuNC0zLjkgMC4xLTIuNC0yLjktNC40LTYuNS00LjR6bS0wLjEgN2MtMS44IDAtNS4yLTAuOS01LjItMi43IDAtMS43IDIuOS0zLjEgNS4yLTMuMXM1LjMgMS40IDUuMyAzLjFjMCAxLTEuOSAyLjctNS4zIDIuN3oiLz48L2c+PC9zdmc+',
  rdns: 'app.otterly.wallet',
};

const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
  detail: Object.freeze({ info, provider }),
}));
window.addEventListener('eip6963:requestProvider', announce);
announce();

// Initial chain announce
window.dispatchEvent(new Event('ethereum#initialized'));

export {};
