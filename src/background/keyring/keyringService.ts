import { ethers } from 'ethers';
import * as passworder from '@metamask/browser-passworder';
import browser from 'webextension-polyfill';
import { HdKeyring, HdAccount } from './hdKeyring';
import { SimpleKeyring, SimpleAccount } from './simpleKeyring';

const VAULT_KEY = 'arc:vault';
const META_KEY = 'arc:meta';
const SESSION_KEY = 'arc:session';

export type Account = (HdAccount | SimpleAccount) & { keyringId: number };

type VaultPayload = {
  keyrings: (
    | ReturnType<HdKeyring['serialize']>
    | ReturnType<SimpleKeyring['serialize']>
  )[];
};

type Meta = {
  selectedAddress?: string;
  hasVault: boolean;
};

export class KeyringService {
  private keyrings: (HdKeyring | SimpleKeyring)[] = [];
  private password: string | null = null;
  private locked = true;

  async init(): Promise<void> {
    const meta = await this.getMeta();
    this.locked = true;
    // Try restoring unlocked session if browser.storage.session exists
    try {
      const session = (browser.storage as any).session;
      if (session) {
        const data = await session.get(SESSION_KEY);
        const pw = data[SESSION_KEY];
        if (pw && meta.hasVault) {
          await this.unlock(pw);
        }
      }
    } catch {
      // session unavailable
    }
  }

  // --- meta ---
  private async getMeta(): Promise<Meta> {
    const data = await browser.storage.local.get(META_KEY);
    return data[META_KEY] || { hasVault: false };
  }

  private async setMeta(meta: Meta) {
    await browser.storage.local.set({ [META_KEY]: meta });
  }

  // --- vault ---
  private async loadVault(): Promise<string | null> {
    const data = await browser.storage.local.get(VAULT_KEY);
    return data[VAULT_KEY] || null;
  }

  private async saveVault(password: string): Promise<void> {
    const payload: VaultPayload = {
      keyrings: this.keyrings.map((k) => k.serialize() as any),
    };
    const encrypted = await passworder.encrypt(password, payload);
    await browser.storage.local.set({ [VAULT_KEY]: encrypted });
    const selected = await this.getSelectedAddress();
    await this.setMeta({ hasVault: true, selectedAddress: selected });
    try {
      const session = (browser.storage as any).session;
      if (session) await session.set({ [SESSION_KEY]: password });
    } catch {
      // ignore
    }
  }

  // --- lifecycle ---
  hasVault(): Promise<boolean> {
    return this.loadVault().then((v) => !!v);
  }

  isLocked(): boolean {
    return this.locked;
  }

  async createVault(mnemonic: string, password: string): Promise<Account[]> {
    const phrase = mnemonic.trim() || ethers.utils.entropyToMnemonic(ethers.utils.randomBytes(16));
    if (!ethers.utils.isValidMnemonic(phrase)) {
      throw new Error('Invalid mnemonic');
    }
    this.keyrings = [new HdKeyring(phrase, [0])];
    this.password = password;
    this.locked = false;
    const accs = this.listAccounts();
    await this.setSelectedAddress(accs[0].address);
    await this.saveVault(password);
    return accs;
  }

  async importPrivkey(pk: string, password: string): Promise<Account> {
    if (this.locked && !(await this.hasVault())) {
      // first-ever wallet via privkey only
      this.keyrings = [new SimpleKeyring([pk])];
      this.password = password;
      this.locked = false;
      await this.saveVault(password);
    } else {
      if (this.locked) throw new Error('Wallet is locked');
      let simple = this.keyrings.find((k) => k instanceof SimpleKeyring) as SimpleKeyring | undefined;
      if (!simple) {
        simple = new SimpleKeyring();
        this.keyrings.push(simple);
      }
      simple.addPrivkey(pk);
      await this.saveVault(this.password!);
    }
    const accs = this.listAccounts();
    const last = accs[accs.length - 1];
    await this.setSelectedAddress(last.address);
    return last;
  }

  async unlock(password: string): Promise<void> {
    const vault = await this.loadVault();
    if (!vault) throw new Error('No vault');
    const payload = (await passworder.decrypt(password, vault)) as VaultPayload;
    this.keyrings = payload.keyrings.map((k) => {
      if (k.type === 'hd') return HdKeyring.deserialize(k as any);
      return SimpleKeyring.deserialize(k as any);
    });
    this.password = password;
    this.locked = false;
    try {
      const session = (browser.storage as any).session;
      if (session) await session.set({ [SESSION_KEY]: password });
    } catch {
      // ignore
    }
  }

  async lock(): Promise<void> {
    this.keyrings = [];
    this.password = null;
    this.locked = true;
    try {
      const session = (browser.storage as any).session;
      if (session) await session.remove(SESSION_KEY);
    } catch {
      // ignore
    }
  }

  // --- accounts ---
  listAccounts(): Account[] {
    const out: Account[] = [];
    this.keyrings.forEach((k, id) => {
      k.listAccounts().forEach((a) => out.push({ ...a, keyringId: id } as Account));
    });
    return out;
  }

  async addHdAccount(): Promise<Account> {
    if (this.locked) throw new Error('Locked');
    let hd = this.keyrings.find((k) => k instanceof HdKeyring) as HdKeyring | undefined;
    if (!hd) throw new Error('No HD keyring');
    const acc = hd.addAccount();
    await this.saveVault(this.password!);
    return { ...acc, keyringId: this.keyrings.indexOf(hd) } as Account;
  }

  async renameAccount(address: string, name: string): Promise<void> {
    if (this.locked) throw new Error('Locked');
    for (const k of this.keyrings) {
      if (k instanceof SimpleKeyring) {
        if (k.listAccounts().some((a) => a.address.toLowerCase() === address.toLowerCase())) {
          k.rename(address, name);
        }
      } else if (k instanceof HdKeyring) {
        const acc = k.listAccounts().find((a) => a.address.toLowerCase() === address.toLowerCase());
        if (acc) acc.name = name;
      }
    }
    await this.saveVault(this.password!);
  }

  async getSelectedAddress(): Promise<string | undefined> {
    const meta = await this.getMeta();
    if (meta.selectedAddress) return meta.selectedAddress;
    const accs = this.listAccounts();
    return accs[0]?.address;
  }

  async setSelectedAddress(address: string): Promise<void> {
    const meta = await this.getMeta();
    await this.setMeta({ ...meta, selectedAddress: address });
  }

  // --- signing ---
  private walletForAddress(address: string): ethers.Wallet {
    if (this.locked) throw new Error('Locked');
    for (const k of this.keyrings) {
      const w = k.walletByAddress(address);
      if (w) return w;
    }
    throw new Error(`No key for ${address}`);
  }

  async signTransaction(address: string, tx: ethers.providers.TransactionRequest): Promise<string> {
    const wallet = this.walletForAddress(address);
    return wallet.signTransaction(tx);
  }

  async signMessage(address: string, message: string | ethers.utils.Bytes): Promise<string> {
    const wallet = this.walletForAddress(address);
    return wallet.signMessage(message);
  }

  async signTypedData(
    address: string,
    domain: any,
    types: Record<string, ethers.TypedDataField[]>,
    value: Record<string, any>,
  ): Promise<string> {
    const wallet = this.walletForAddress(address);
    // ethers v5 _signTypedData
    return (wallet as any)._signTypedData(domain, types, value);
  }

  async exportPrivkey(address: string, password: string): Promise<string> {
    if (this.password !== password) throw new Error('Wrong password');
    for (const k of this.keyrings) {
      if (k instanceof SimpleKeyring) {
        const pk = k.exportPrivkey(address);
        if (pk) return pk;
      } else if (k instanceof HdKeyring) {
        const acc = k.listAccounts().find((a) => a.address.toLowerCase() === address.toLowerCase());
        if (acc) {
          return k.walletAt(acc.index).privateKey;
        }
      }
    }
    throw new Error('Not found');
  }

  async exportMnemonic(password: string): Promise<string> {
    if (this.password !== password) throw new Error('Wrong password');
    const hd = this.keyrings.find((k) => k instanceof HdKeyring) as HdKeyring | undefined;
    if (!hd) throw new Error('No HD keyring');
    return hd.getMnemonic();
  }
}

export const keyringService = new KeyringService();
