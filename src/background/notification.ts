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

async function getDisplays(): Promise<any[]> {
  const c: any = (globalThis as any).chrome;
  const sys = c?.system?.display;
  if (!sys?.getInfo) return [];
  // chrome.system.display.getInfo uses callback in older Chromium / Linux builds;
  // promisify so the same code path works everywhere.
  return new Promise<any[]>((resolve) => {
    try {
      const maybePromise = sys.getInfo((info: any[]) => resolve(info || []));
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then((info: any[]) => resolve(info || [])).catch(() => resolve([]));
      }
    } catch {
      resolve([]);
    }
  });
}

function clampPosition(
  left: number,
  top: number,
  width: number,
  height: number,
  bounds: { left: number; top: number; width: number; height: number },
): { left: number; top: number } {
  const maxLeft = bounds.left + bounds.width - width;
  const maxTop = bounds.top + bounds.height - height;
  return {
    left: Math.max(bounds.left, Math.min(Math.round(left), Math.round(maxLeft))),
    top: Math.max(bounds.top, Math.min(Math.round(top), Math.round(maxTop))),
  };
}

function detectPlatform(): { isLinux: boolean; isWayland: boolean } {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  const isLinux = /Linux/i.test(ua) && !/Android/i.test(ua);
  // Wayland is not reported in UA. We treat all Linux as potentially Wayland
  // (Fedora, recent Ubuntu, openSUSE all default to Wayland) and skip the
  // positioning effort on Linux entirely — it's a no-op on Wayland and on X11
  // most WMs ignore it anyway.
  const isWayland = isLinux;
  return { isLinux, isWayland };
}

export async function openNotificationWindow(approvalId: string): Promise<number | undefined> {
  const { isLinux, isWayland } = detectPlatform();

  // Chrome's windows.create `height` is the OUTER bound. On Linux, the WM
  // (GNOME/Mutter, KDE/KWin) draws a ~37px native title bar inside that bound,
  // shrinking the content area. Bump height so 100vh content (Sign/Reject
  // footer) stays fully visible.
  const width = 360;
  // Linux native title bar (~37px on GNOME/KDE) is drawn INSIDE the bounds passed
  // to windows.create — bump just enough so 100vh content (footer) stays visible.
  const height = isLinux ? 678 : 640;
  let left: number | undefined;
  let top: number | undefined;
  let clampBounds: { left: number; top: number; width: number; height: number } | undefined;

  try {
    const focused = await browser.windows.getLastFocused().catch(() => undefined);
    // On Wayland (Fedora, modern Ubuntu, etc.), the compositor protocol forbids
    // clients from positioning their own windows — `left`/`top` passed to
    // windows.create / windows.update are silently ignored. Skip the work.
    // Ref: https://crbug.com/1140949
    const displays = isWayland ? [] : await getDisplays();

    if (displays.length > 0) {
      const fx = (focused?.left ?? 0) + Math.round((focused?.width ?? 0) / 2);
      const fy = (focused?.top ?? 0) + Math.round((focused?.height ?? 0) / 2);
      const target =
        displays.find((d: any) => {
          const wa = d.workArea || d.bounds;
          if (!wa) return false;
          return (
            fx >= wa.left && fx <= wa.left + wa.width &&
            fy >= wa.top && fy <= wa.top + wa.height
          );
        }) ||
        displays.find((d: any) => d.isPrimary) ||
        displays[0];

      const wa = target?.workArea || target?.bounds;
      if (wa && Number.isFinite(wa.left) && Number.isFinite(wa.top)) {
        clampBounds = { left: wa.left, top: wa.top, width: wa.width, height: wa.height };
        const desiredLeft = wa.left + wa.width - width - 16;
        const desiredTop = wa.top + 16;
        const clamped = clampPosition(desiredLeft, desiredTop, width, height, clampBounds);
        left = clamped.left;
        top = clamped.top;
      }
    }

    // Fall back to placement relative to focused browser window when display info unavailable.
    if (left === undefined && !isWayland && focused && Number.isFinite(focused.left) && Number.isFinite(focused.top)) {
      const fw = focused.width ?? 1280;
      const fh = focused.height ?? 800;
      const fl = focused.left ?? 0;
      const ft = focused.top ?? 0;
      const desiredLeft = fl + fw - width - 24;
      const desiredTop = ft + 88;
      const fallbackBounds = { left: fl, top: ft, width: fw, height: fh };
      const clamped = clampPosition(desiredLeft, desiredTop, width, height, fallbackBounds);
      left = clamped.left;
      top = clamped.top;
    }
  } catch {
    // positioning best-effort
  }

  const baseOpts: any = {
    url: browser.runtime.getURL(`notification.html#/?id=${approvalId}`),
    type: 'popup',
    width,
    height,
    focused: true,
  };

  // First try with computed position. Linux WMs sometimes reject out-of-range
  // coordinates with "Invalid value for bounds"; retry without coords if so.
  let winId: number | undefined;
  try {
    if (left !== undefined && top !== undefined) {
      const win = await browser.windows.create({ ...baseOpts, left, top });
      winId = win.id;
    } else {
      const win = await browser.windows.create(baseOpts);
      winId = win.id;
    }
  } catch (err) {
    console.warn('[otterly] popup positioned create failed, retrying without bounds:', err);
    try {
      const win = await browser.windows.create(baseOpts);
      winId = win.id;
    } catch (err2) {
      console.error('[otterly] popup create failed:', err2);
      return undefined;
    }
  }

  // On Linux/X11, many WMs (mutter, kwin) ignore initial left/top in windows.create
  // and place the popup wherever they please. A follow-up windows.update reliably
  // moves the window to our requested bounds after the WM has done its initial placement.
  if (winId !== undefined && left !== undefined && top !== undefined) {
    const updateBounds = { left, top, width, height };
    const apply = () => {
      browser.windows.update(winId!, updateBounds).catch((e) => {
        console.warn('[otterly] popup windows.update failed:', e);
      });
    };
    apply();
    // Some WMs swallow the first update if it arrives before the window is realized;
    // re-apply once more after a short delay as a safety net.
    setTimeout(apply, 120);
  }

  return winId;
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
    if (windowId === undefined) {
      reject({ code: -32603, message: 'Otterly could not open the approval window' });
      return;
    }
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
