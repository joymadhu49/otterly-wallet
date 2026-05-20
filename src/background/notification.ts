import browser from 'webextension-polyfill';

export type ApprovalKind = 'connect' | 'signTx' | 'signMessage' | 'signTypedData' | 'addChain' | 'switchChain' | 'watchAsset';

export type ApprovalRequest = {
  id: string;
  kind: ApprovalKind;
  origin: string;
  siteName?: string;
  siteIcon?: string;
  account?: string;
  data: any;
  createdAt: number;
};

type Pending = {
  req: ApprovalRequest;
  resolve: (result: any) => void;
  reject: (err: { code: number; message: string }) => void;
  windowId?: number;
};

const queue: Map<string, Pending> = new Map();

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function openNotificationWindow(approvalId: string): Promise<number | undefined> {
  try {
    const width = 360;
    const height = 640;
    let left: number | undefined;
    let top: number | undefined;

    // Prefer placing at the right edge of the display containing the focused browser window.
    try {
      const focused = await browser.windows.getLastFocused();
      const sys: any = (browser as any).system?.display;
      if (sys?.getInfo) {
        const displays: any[] = await sys.getInfo();
        const fx = (focused?.left ?? 0) + Math.round((focused?.width ?? 0) / 2);
        const fy = (focused?.top ?? 0) + Math.round((focused?.height ?? 0) / 2);
        const target =
          displays.find((d: any) => {
            const wa = d.workArea || d.bounds || {};
            return (
              fx >= wa.left && fx <= wa.left + wa.width &&
              fy >= wa.top && fy <= wa.top + wa.height
            );
          }) ||
          displays.find((d: any) => d.isPrimary) ||
          displays[0];
        if (target) {
          const wa = target.workArea || target.bounds;
          left = Math.max(0, Math.round(wa.left + wa.width - width - 16));
          top = Math.max(0, Math.round(wa.top + 16));
        }
      }
      if (left === undefined && focused) {
        const fw = focused.width ?? 1280;
        const fl = focused.left ?? 0;
        const ft = focused.top ?? 0;
        left = Math.max(0, Math.round(fl + fw - width - 24));
        top = Math.max(0, Math.round(ft + 88));
      }
    } catch {
      // ignore positioning failure
    }

    const win = await browser.windows.create({
      url: browser.runtime.getURL(`notification.html#/?id=${approvalId}`),
      type: 'popup',
      width,
      height,
      focused: true,
      left,
      top,
    });
    return win.id;
  } catch {
    return undefined;
  }
}

export async function requestApproval<T = any>(
  kind: ApprovalKind,
  origin: string,
  data: any,
  meta?: { siteName?: string; siteIcon?: string; account?: string },
): Promise<T> {
  const id = uid();
  const req: ApprovalRequest = {
    id,
    kind,
    origin,
    data,
    createdAt: Date.now(),
    ...meta,
  };
  const promise = new Promise<T>(async (resolve, reject) => {
    const windowId = await openNotificationWindow(id);
    queue.set(id, { req, resolve, reject, windowId });
  });
  return promise;
}

export function listPending(): ApprovalRequest[] {
  return Array.from(queue.values()).map((p) => p.req);
}

export function getPending(id: string): ApprovalRequest | undefined {
  return queue.get(id)?.req;
}

export async function resolveApproval(id: string, result: any): Promise<void> {
  const p = queue.get(id);
  if (!p) return;
  p.resolve(result);
  queue.delete(id);
  if (p.windowId !== undefined) {
    try {
      await browser.windows.remove(p.windowId);
    } catch {
      // window may be gone
    }
  }
}

export async function rejectApproval(id: string, code = 4001, message = 'User rejected'): Promise<void> {
  const p = queue.get(id);
  if (!p) return;
  p.reject({ code, message });
  queue.delete(id);
  if (p.windowId !== undefined) {
    try {
      await browser.windows.remove(p.windowId);
    } catch {
      // window may be gone
    }
  }
}

// Reject any orphaned approvals if their window closes
browser.windows.onRemoved.addListener((winId) => {
  queue.forEach((p, id) => {
    if (p.windowId === winId) {
      p.reject({ code: 4001, message: 'User closed approval window' });
      queue.delete(id);
    }
  });
});
