import browser from 'webextension-polyfill';

const KEY = 'arc:permissions';

export type Permission = {
  origin: string;
  accounts: string[]; // lowercase
  grantedAt: number;
  name?: string;
  icon?: string;
};

export async function readAll(): Promise<Record<string, Permission>> {
  const data = await browser.storage.local.get(KEY);
  return data[KEY] || {};
}

async function writeAll(p: Record<string, Permission>): Promise<void> {
  await browser.storage.local.set({ [KEY]: p });
}

export async function get(origin: string): Promise<Permission | undefined> {
  const all = await readAll();
  return all[origin];
}

export async function grant(origin: string, accounts: string[], meta?: { name?: string; icon?: string }): Promise<void> {
  const all = await readAll();
  all[origin] = {
    origin,
    accounts: accounts.map((a) => a.toLowerCase()),
    grantedAt: Date.now(),
    ...meta,
  };
  await writeAll(all);
}

export async function revoke(origin: string): Promise<void> {
  const all = await readAll();
  delete all[origin];
  await writeAll(all);
}

export async function listConnected(): Promise<Permission[]> {
  return Object.values(await readAll());
}
