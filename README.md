<h2 align="center">
  <br>
  <img src="/asset/png/FrameLogo512.png?raw=true" alt="Frame" width="150" />
  <br>
  <br>
  F R A M E
  <br>
  <br>
</h2>
<h3 align="center">System-wide Web3 for macOS, Windows and Linux :tada:</h3>
<br>
<h5 align="center">
  <a href="#features">Features</a> ⁃
  <a href="#installation">Installation</a> ⁃
  <a href="#usage">Usage</a> ⁃
  <a href="#related">Related</a>
</h5>
<br>

<img src="/asset/png/FrameExample0-6-3.png?raw=true" />

Frame is a web3 platform that creates a secure system-wide interface to your chains and accounts. Now any browser, command-line, or native application has the ability to access web3.

### Features

- **First-class Hardware Signer Support**
  - Use your GridPlus, Ledger and Trezor accounts with any dapp!
- **Extensive Software Signer Support**
  - Use a mnemonic phrase, keystore.json or standalone private keys to create and backup accounts!
- **Permissions**
  - You'll always have full control of which dapps have permission to access Frame and can monitor with full transparency what requests are being made to the network.
- **Omnichain Routing**
  - With Frame's Omnichain routing dapps can seamlessly use multiple chains at the same time, enabling truly multichain experiences.
- **Transaction Decoding**
  - By utilizing verified contract ABIs, transaction calldata can be decoded into concise and informative summaries, allowing you to sign transactions with confidence.
- **Set your own connections to Ethereum and IPFS**
  - Never be locked into using a centralized gateway
- **Menu Bar Support**
  - Frame stays out of the way and sits quietly in your menu bar until needed
- **Cross Platform**
  - MacOS, Windows and Linux!

### Talks

- [Frame at Aracon](https://www.youtube.com/watch?v=wlZWLiy2GD0)

### Installation

#### Downloads

- [Production Releases](https://github.com/floating/frame/releases)
- [Canary Releases](https://github.com/frame-labs/frame-canary/releases)

#### Arch Linux

If you use an arch-based distro, you can use an AUR Helper like [yay](https://github.com/Jguer/yay) to install Frame by running `yay -S frame-eth` or for the development version: `yay -S frame-eth-dev`.

#### Run Source

**On Ubuntu:** Run `sudo apt-get install build-essential libudev-dev`.

```bash
# Clone
› git clone https://github.com/floating/frame

# Use node v22
› nvm install 22.18.0
› nvm use 22.18.0


# Install
› pnpm run setup

# Run
› pnpm run prod
```

#### Build

```bash
› pnpm run bundle # Create bundle
› pnpm run build # Release-style multi-arch build (expects signing/notarisation setup)
› pnpm run build:local # Local unsigned single-arch macOS build
```

#### Fork Notes (Frame Flux)

- App identity for this fork is `Frame Flux` with bundle id `sh.frame.flux.app`, so it can be installed alongside the original `Frame` app.
- For day-to-day local installs on macOS, use `pnpm run build:local`.
- `pnpm run build` is the release-oriented path and may fail locally without full platform signing/notarisation credentials.

#### CI Workflows

- GitHub Actions in this fork are intentionally pruned to compile and test only.
- Release/publish workflows were removed.
- Remaining actions are pinned to immutable commit SHAs.

### Usage

#### Connect to Frame natively

Frame exposes system-wide JSON-RPC endpoints `ws://127.0.0.1:1248` and `http://127.0.0.1:1248` that you can connect to from any app. We recommend using [eth-provider](https://github.com/floating/eth-provider) to create a connection `const provider = ethProvider('frame')` as `eth-provider` will handle any connection edge cases across browsers and environments

### Frame's injected provider

Frame also has a browser extension for injecting a Frame-connected [EIP-1193](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md) provider into web apps as `window.ethereum`. This can be used to inject a connection when an app does not provide the option to connect to Frame natively.

### Related

- [Frame Chat](https://discord.gg/UH7NGqY) - Feel free to drop in and ask questions!
- [Frame Browser Extension](https://github.com/frame-labs/frame-extension) - Use Frame with any web dapp
- [eth-provider](https://github.com/floating/eth-provider) - A universal Ethereum provider
- [Restore](https://github.com/floating/restore) - A predictable and observable state container for React apps

<h2>
  <h5 align="center">
    <br>
    <a href="https://frame.sh">Website</a> ⁃
    <a href="https://medium.com/@framehq">Blog</a> ⁃
    <a href="https://twitter.com/0xFrame">Twitter</a> ⁃
    <a href="https://discord.gg/UH7NGqY">Chat</a>
  </h5>
</h2>
