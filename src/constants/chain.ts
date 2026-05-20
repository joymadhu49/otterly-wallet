const CHAIN_ID = 5042002;

export const ARC_TESTNET = {
  name: 'Arc Testnet',
  chainId: CHAIN_ID,
  chainIdHex: '0x' + CHAIN_ID.toString(16),
  rpcUrls: [
    'https://rpc.testnet.arc.network',
    'https://rpc.blockdaemon.testnet.arc.network',
    'https://rpc.drpc.testnet.arc.network',
    'https://rpc.quicknode.testnet.arc.network',
  ],
  wssUrls: [
    'wss://rpc.testnet.arc.network',
  ],
  explorer: 'https://testnet.arcscan.app',
  apiBase: 'https://testnet.arcscan.app/api',
  nativeCurrency: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 18,
    displayDecimals: 6,
  },
  faucet: 'https://faucet.circle.com',
} as const;

export const KNOWN_TOKENS = [
  {
    address: '0x3600000000000000000000000000000000000000',
    symbol: 'USDC',
    name: 'USD Coin (ERC-20 mirror)',
    decimals: 6,
    isNativeMirror: true,
  },
  {
    address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    symbol: 'EURC',
    name: 'Euro Coin',
    decimals: 6,
    isNativeMirror: false,
  },
] as const;

export const CCTP = {
  domain: 26,
  tokenMessengerV2: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
  messageTransmitterV2: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275',
  tokenMinterV2: '0xb43db544E2c27092c107639Ad201b3dEfAbcF192',
  messageV2: '0xbaC0179bB358A8936169a63408C8481D582390C4',
} as const;

export const GATEWAY = {
  domain: 26,
  wallet: '0x0077777d7EBA4688BDeF3E311b846F25870A19B9',
  minter: '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B',
} as const;

export const HD_PATH = "m/44'/60'/0'/0";

export const DEFAULT_AUTOLOCK_MIN = 30;
