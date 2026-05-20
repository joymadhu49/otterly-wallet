import { ethers } from 'ethers';
import { callWithFallback } from './arcProvider';

export async function getGasPrice(): Promise<ethers.BigNumber> {
  return callWithFallback((p) => p.getGasPrice());
}

export async function estimateGas(tx: ethers.providers.TransactionRequest): Promise<ethers.BigNumber> {
  return callWithFallback((p) => p.estimateGas(tx));
}

export type GasEstimate = {
  gasLimit: ethers.BigNumber;
  gasPrice: ethers.BigNumber;
  totalFee: ethers.BigNumber;
};

export async function estimateGasAndFee(tx: ethers.providers.TransactionRequest): Promise<GasEstimate> {
  const [gasLimit, gasPrice] = await Promise.all([estimateGas(tx), getGasPrice()]);
  return { gasLimit, gasPrice, totalFee: gasLimit.mul(gasPrice) };
}
