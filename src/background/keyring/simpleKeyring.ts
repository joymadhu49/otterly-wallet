import { ethers } from 'ethers';

export type SimpleAccount = {
  type: 'simple';
  address: string;
  name: string;
};

export class SimpleKeyring {
  private privkeys: Map<string, string> = new Map();
  private names: Map<string, string> = new Map();

  constructor(privkeys: string[] = [], names: Record<string, string> = {}) {
    privkeys.forEach((pk) => this.addPrivkey(pk));
    Object.entries(names).forEach(([addr, name]) => this.names.set(addr.toLowerCase(), name));
  }

  addPrivkey(pk: string): SimpleAccount {
    const clean = pk.startsWith('0x') ? pk : `0x${pk}`;
    const wallet = new ethers.Wallet(clean);
    const key = wallet.address.toLowerCase();
    if (!this.privkeys.has(key)) {
      this.privkeys.set(key, clean);
      const count = this.privkeys.size;
      this.names.set(key, `Arc Keep ${count}`);
    }
    return {
      type: 'simple',
      address: wallet.address,
      name: this.names.get(key) || 'Arc Keep',
    };
  }

  walletByAddress(address: string): ethers.Wallet | undefined {
    const pk = this.privkeys.get(address.toLowerCase());
    if (!pk) return undefined;
    return new ethers.Wallet(pk);
  }

  listAccounts(): SimpleAccount[] {
    return Array.from(this.privkeys.keys()).map((addr) => ({
      type: 'simple',
      address: ethers.utils.getAddress(addr),
      name: this.names.get(addr) || 'Arc Keep',
    }));
  }

  rename(address: string, name: string) {
    this.names.set(address.toLowerCase(), name);
  }

  exportPrivkey(address: string): string | undefined {
    return this.privkeys.get(address.toLowerCase());
  }

  serialize() {
    return {
      type: 'simple' as const,
      privkeys: Array.from(this.privkeys.values()),
      names: Object.fromEntries(this.names.entries()),
    };
  }

  static deserialize(data: ReturnType<SimpleKeyring['serialize']>): SimpleKeyring {
    return new SimpleKeyring(data.privkeys, data.names);
  }
}
