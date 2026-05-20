import { ethers } from 'ethers';
import { keyringService } from './keyring/keyringService';
import { ARC_TESTNET } from '../constants/chain';
import { INTERNAL_METHODS } from '../constants/messages';
import { getAllBalances, getErc20Balance, encodeErc20Transfer } from './rpc/tokens';
import { callWithFallback } from './rpc/arcProvider';
import { estimateGasAndFee, getGasPrice } from './rpc/fees';
import { getHistoryFor, refreshPending, recordTx } from './rpc/history';
import { fetchNfts } from './rpc/nfts';
import * as perms from './permissions';
import { listPending, resolveApproval, rejectApproval } from './notification';
import { getSettings, setSettings } from './session';

export async function handleInternal(method: string, params: any = {}): Promise<any> {
  switch (method) {
    case INTERNAL_METHODS.GET_STATE: {
      const hasVault = await keyringService.hasVault();
      const locked = keyringService.isLocked();
      const accounts = locked ? [] : keyringService.listAccounts();
      const selected = locked ? undefined : await keyringService.getSelectedAddress();
      const settings = await getSettings();
      return {
        hasVault,
        locked,
        accounts,
        selectedAddress: selected,
        chain: ARC_TESTNET,
        settings,
      };
    }

    case INTERNAL_METHODS.CREATE_VAULT: {
      const { mnemonic, password } = params;
      return keyringService.createVault(mnemonic || '', password);
    }

    case INTERNAL_METHODS.IMPORT_MNEMONIC: {
      const { mnemonic, password } = params;
      return keyringService.createVault(mnemonic, password);
    }

    case INTERNAL_METHODS.IMPORT_PRIVKEY: {
      const { privkey, password } = params;
      return keyringService.importPrivkey(privkey, password);
    }

    case INTERNAL_METHODS.UNLOCK: {
      await keyringService.unlock(params.password);
      return true;
    }

    case INTERNAL_METHODS.LOCK: {
      await keyringService.lock();
      return true;
    }

    case INTERNAL_METHODS.ADD_ACCOUNT: {
      return keyringService.addHdAccount();
    }

    case INTERNAL_METHODS.SELECT_ACCOUNT: {
      await keyringService.setSelectedAddress(params.address);
      return true;
    }

    case INTERNAL_METHODS.RENAME_ACCOUNT: {
      await keyringService.renameAccount(params.address, params.name);
      return true;
    }

    case INTERNAL_METHODS.EXPORT_PRIVKEY: {
      return keyringService.exportPrivkey(params.address, params.password);
    }

    case INTERNAL_METHODS.EXPORT_MNEMONIC: {
      return keyringService.exportMnemonic(params.password);
    }

    case INTERNAL_METHODS.GET_BALANCE: {
      return getAllBalances(params.address, params.extraTokens || []);
    }

    case INTERNAL_METHODS.GET_TOKEN_BALANCES: {
      const out = await Promise.all(
        (params.tokens as string[]).map((t) =>
          getErc20Balance(t, params.address).catch(() => null),
        ),
      );
      return out.filter(Boolean);
    }

    case INTERNAL_METHODS.GET_GAS_PRICE: {
      const gp = await getGasPrice();
      return gp.toString();
    }

    case INTERNAL_METHODS.SEND_TX: {
      const { from, to, value, data, tokenAddress, decimals } = params;
      if (keyringService.isLocked()) throw new Error('Locked');
      let txData = data || '0x';
      let txTo = to;
      let txValue = ethers.BigNumber.from(0);

      if (tokenAddress) {
        const amount = ethers.utils.parseUnits(value, decimals);
        txData = encodeErc20Transfer(to, amount);
        txTo = tokenAddress;
      } else {
        txValue = ethers.utils.parseUnits(value, ARC_TESTNET.nativeCurrency.decimals);
      }

      const tx: ethers.providers.TransactionRequest = {
        from,
        to: txTo,
        value: txValue,
        data: txData,
        chainId: ARC_TESTNET.chainId,
        type: 0,
      };

      const { gasLimit, gasPrice } = await estimateGasAndFee(tx);
      tx.gasLimit = gasLimit;
      tx.gasPrice = gasPrice;
      tx.nonce = await callWithFallback((p) => p.getTransactionCount(from, 'pending'));

      const signed = await keyringService.signTransaction(from, tx);
      const sent = await callWithFallback((p) => p.sendTransaction(signed));

      await recordTx(from, {
        hash: sent.hash,
        from,
        to: txTo,
        value: txValue.toString(),
        data: txData,
        chainId: ARC_TESTNET.chainId,
        status: 'pending',
        timestamp: Date.now(),
        label: tokenAddress ? 'ERC-20 transfer' : 'USDC send',
      });

      return sent.hash;
    }

    case INTERNAL_METHODS.GET_TX_HISTORY: {
      await refreshPending(params.address);
      return getHistoryFor(params.address);
    }

    case INTERNAL_METHODS.GET_NFTS: {
      return fetchNfts(params.address);
    }

    case INTERNAL_METHODS.GET_PENDING_APPROVALS: {
      return listPending();
    }

    case INTERNAL_METHODS.RESOLVE_APPROVAL: {
      await resolveApproval(params.id, params.result);
      return true;
    }

    case INTERNAL_METHODS.REJECT_APPROVAL: {
      await rejectApproval(params.id, params.code, params.message);
      return true;
    }

    case INTERNAL_METHODS.GET_CONNECTED_SITES: {
      return perms.listConnected();
    }

    case INTERNAL_METHODS.DISCONNECT_SITE: {
      await perms.revoke(params.origin);
      return true;
    }

    case 'arc_setSettings':
      return setSettings(params);

    default:
      throw new Error(`Unknown internal method ${method}`);
  }
}
