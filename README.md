# Otterly Wallet

Friendly self-custodial Chrome extension wallet for the [Arc Network](https://docs.arc.io) — Circle's EVM L1 where **USDC is the native gas token**. Premium minimalist dark UI, slim approval popups, instant finality.

> **Status:** v0.1.0 — Arc Testnet. Mainnet config drops in when Arc mainnet ships.

---

## Download

| Source | How |
|---|---|
| **GitHub Releases** (recommended for now) | Grab `otterly-wallet.zip` from the [Releases page](../../releases/latest). |
| **Chrome Web Store** | _Coming soon_ — listing under review. |
| **Build from source** | See [Develop](#develop) below. |

### Install the ZIP in Chrome

1. Download `otterly-wallet.zip` from the latest release and unzip it.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** → select the unzipped folder.
5. Pin the Otterly icon to your toolbar.

Works in any Chromium browser (Chrome, Brave, Edge, Arc, Opera).

---

## Highlights

- **Self-custodial** — keys live encrypted in `chrome.storage.local` via AES-GCM (`@metamask/browser-passworder`).
- **Arc-native** — chain `5042002`, USDC gas, instant finality (<1s), legacy `gasPrice` (no EIP-1559 base fee).
- **EIP-1193 provider** — injects `window.ethereum` + `window.arc`; announces via EIP-6963 so it coexists with other injected wallets.
- **HD + private-key import** — multiple accounts per HD root (BIP39 / `m/44'/60'/0'/0/i`).
- **Approval popups** — Connect, SignTx, `personal_sign`, `signTypedData_v4`. Slim 360×640 window, anchored top-right of the focused display.
- **Auto-lock** — idle timer (configurable).
- **Minimalist UI** — antd v5 dark theme, Arc-blue accent, Inter + JetBrains Mono.

---

## First run

1. Click the Otterly icon.
2. **Create wallet** — record the 12-word seed phrase, confirm 3 random words, set a password (≥ 8 chars).
3. Or **Import** — paste an existing seed phrase or private key.

## Get testnet USDC

Use Circle's official faucet: <https://faucet.circle.com> (pick Arc Testnet). Native USDC balance appears on the Dashboard within ~15 s.

---

## Develop

```sh
npm install
npm run build       # production → dist/
npm run dev         # watch mode for active development
npm run zip         # build + package dist/ → otterly-wallet.zip
```

Then load `dist/` (or unzip and load) via `chrome://extensions` → Load unpacked.

## Project layout

```
src/
  manifest.json                    # MV3
  background/                      # Service worker
    keyring/                       # HD + simple, AES-GCM vault
    rpc/                           # ethers v5 provider, fees, tokens, history, NFTs
    providerController.ts          # EIP-1193 dApp method router
    internalController.ts          # popup ↔ background RPC
    notification.ts                # opens approval popup, queues approvals
    permissions.ts                 # per-origin connected accounts
    session.ts                     # idle / auto-lock
  content-script/                  # injects inpage.js + relays
  inpage/                          # window.ethereum + window.arc + EIP-6963 announce
  ui/
    popup/                         # 360×600 popup (Dashboard, Send, Receive, History, Settings, …)
    approval/                      # 360×640 approval window (Connect/SignTx/SignMessage/SignTypedData)
    shared/                        # theme, antd config, redux store, utils, rpc client
  constants/                       # chain + IPC method enums
  assets/                          # otter mascot SVG + generated icon-{16,32,48,128}.png
scripts/
  gen_icons.py                     # rasterizes otter SVG → squircle PNGs
```

## Chain config

| Field | Value |
|---|---|
| Network | Arc Testnet |
| Chain ID | `5042002` (`0x4cef52`) |
| RPC | `https://rpc.testnet.arc.network` + Blockdaemon / dRPC / QuickNode fallbacks |
| Native | USDC (18 dec for gas math; 6 dec ERC-20 mirror at `0x3600…0000`) |
| EURC | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` (6 dec) |
| Explorer | <https://testnet.arcscan.app> |
| Faucet | <https://faucet.circle.com> |
| CCTP domain | 26 |
| Gateway wallet | `0x0077777d7EBA4688BDeF3E311b846F25870A19B9` |

## EVM differences handled

- Gas fees displayed in **USDC**, not ETH.
- Legacy `eth_gasPrice`; transactions sent as `type: 0`.
- Treated as instant on first inclusion (no confirmation counter).
- `wallet_switchEthereumChain` / `wallet_addEthereumChain` accept only Arc — `chainId` parsed via `BigInt(input)` so hex/decimal both work.
- EIP-6963 announce so Otterly coexists with other injected wallets.

## Security notes

- Password never leaves the service worker.
- Vault is decrypted only on `unlock`; wiped from memory on `lock` and on idle.
- Mnemonic / private key export requires re-entering the password.
- Always inspect the approval popup before confirming — verify origin, recipient, value, and calldata.

## Out of scope (v1)

- Swap & Bridge tabs (CCTP `TokenMessengerV2` + `GatewayMinter` constants are wired; UI buttons stubbed).
- Hardware wallets (Ledger via WebHID), WalletConnect v2.
- Address book.
- Mainnet (Arc mainnet not live as of 2026-05).

## License

MIT — see [LICENSE](LICENSE).
