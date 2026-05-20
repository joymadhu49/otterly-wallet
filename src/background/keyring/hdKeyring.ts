import { ethers } from 'ethers';
import { HD_PATH } from '../../constants/chain';

export type HdAccount = {
  type: 'hd';
  address: string;
  index: number;
  name: string;
};

export class HdKeyring {
  private mnemonic: string;
  private accounts: HdAccount[] = [];

  constructor(mnemonic: string, accountIndices: number[] = [0]) {
    if (!ethers.utils.isValidMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }
    this.mnemonic = mnemonic;
    accountIndices.forEach((i) => this.addAccount(i));
  }

  addAccount(index?: number): HdAccount {
    const idx = index ?? this.accounts.length;
    if (this.accounts.find((a) => a.index === idx)) {
      return this.accounts.find((a) => a.index === idx)!;
    }
    const wallet = this.walletAt(idx);
    const account: HdAccount = {
      type: 'hd',
      address: wallet.address,
      index: idx,
      name: `Arc Vault ${idx + 1}`,
    };
    this.accounts.push(account);
    this.accounts.sort((a, b) => a.index - b.index);
    return account;
  }

  walletAt(index: number): ethers.Wallet {
    const node = ethers.utils.HDNode.fromMnemonic(this.mnemonic).derivePath(`${HD_PATH}/${index}`);
    return new ethers.Wallet(node.privateKey);
  }

  walletByAddress(address: string): ethers.Wallet | undefined {
    const acc = this.accounts.find((a) => a.address.toLowerCase() === address.toLowerCase());
    if (!acc) return undefined;
    return this.walletAt(acc.index);
  }

  listAccounts(): HdAccount[] {
    return [...this.accounts];
  }

  getMnemonic(): string {
    return this.mnemonic;
  }

  serialize() {
    return {
      type: 'hd' as const,
      mnemonic: this.mnemonic,
      accountIndices: this.accounts.map((a) => a.index),
      names: Object.fromEntries(this.accounts.map((a) => [a.index, a.name])),
    };
  }

  static deserialize(data: ReturnType<HdKeyring['serialize']>): HdKeyring {
    const k = new HdKeyring(data.mnemonic, data.accountIndices);
    if (data.names) {
      k.accounts.forEach((a) => {
        const n = data.names[a.index];
        if (n) a.name = n;
      });
    }
    return k;
  }
}
