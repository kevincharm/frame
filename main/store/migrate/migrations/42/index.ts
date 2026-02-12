import log from 'electron-log'

import { v38StateSchema } from '../38/schema'

const SCROLL_MAINNET_CHAIN_ID = 534352
const OFFICIAL_SCROLL_RPC = 'https://rpc.scroll.io'
const LEGACY_SCROLL_RPC = 'https://mainnet-rpc.scroll.io'

function scrollMainnet() {
  const chain = {
    id: SCROLL_MAINNET_CHAIN_ID,
    type: 'ethereum',
    layer: 'rollup',
    isTestnet: false,
    name: 'Scroll',
    explorer: 'https://scrollscan.com',
    gas: {
      price: {
        selected: 'standard',
        levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
      }
    },
    connection: {
      primary: {
        on: true,
        current: 'custom',
        status: 'loading',
        connected: false,
        type: '',
        network: '',
        custom: 'https://rpc.scroll.io'
      },
      secondary: {
        on: false,
        current: 'custom',
        status: 'loading',
        connected: false,
        type: '',
        network: '',
        custom: ''
      }
    },
    on: false
  } as const

  const metadata = {
    blockHeight: 0,
    gas: {
      fees: {},
      price: {
        selected: 'standard',
        levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
      }
    },
    nativeCurrency: {
      symbol: 'ETH',
      usd: {
        price: 0,
        change24hr: 0
      },
      icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
      name: 'Ether',
      decimals: 18
    },
    icon: 'https://scroll.io/_next/static/media/Scroll_Logomark.13ce0216.png',
    primaryColor: 'accent3' // Generic
  } as const

  return { chain, metadata }
}

const migrate = (initial: unknown) => {
  try {
    const state = v38StateSchema.parse(initial)
    const { chain: scrollMainnetChain, metadata: scrollMainnetMetadata } = scrollMainnet()
    const existingChain = state.main.networks.ethereum[SCROLL_MAINNET_CHAIN_ID]
    const existingMetadata = state.main.networksMeta.ethereum[SCROLL_MAINNET_CHAIN_ID]
    const existingMetadataObj =
      existingMetadata && typeof existingMetadata === 'object'
        ? (existingMetadata as Record<string, any>)
        : {}
    const existingNativeCurrency =
      existingMetadataObj.nativeCurrency && typeof existingMetadataObj.nativeCurrency === 'object'
        ? existingMetadataObj.nativeCurrency
        : {}

    if (!existingChain) {
      state.main.networks.ethereum[SCROLL_MAINNET_CHAIN_ID] = scrollMainnetChain
    } else {
      const existingPrimaryConnection = existingChain.connection?.primary || {}
      const existingCustomRpc = existingPrimaryConnection.custom
      const shouldApplyOfficialRpc =
        existingPrimaryConnection.current === 'custom' &&
        (!existingCustomRpc || existingCustomRpc === LEGACY_SCROLL_RPC)

      state.main.networks.ethereum[SCROLL_MAINNET_CHAIN_ID] = {
        ...scrollMainnetChain,
        ...existingChain,
        id: scrollMainnetChain.id,
        type: scrollMainnetChain.type,
        layer: scrollMainnetChain.layer,
        isTestnet: scrollMainnetChain.isTestnet,
        name: scrollMainnetChain.name,
        explorer: scrollMainnetChain.explorer,
        connection: {
          ...scrollMainnetChain.connection,
          ...existingChain.connection,
          primary: {
            ...scrollMainnetChain.connection.primary,
            ...existingChain.connection?.primary,
            custom: shouldApplyOfficialRpc ? OFFICIAL_SCROLL_RPC : existingChain.connection?.primary?.custom
          },
          secondary: {
            ...scrollMainnetChain.connection.secondary,
            ...existingChain.connection?.secondary
          }
        }
      }
    }

    state.main.networksMeta.ethereum[SCROLL_MAINNET_CHAIN_ID] = {
      ...scrollMainnetMetadata,
      ...existingMetadataObj,
      icon: scrollMainnetMetadata.icon,
      primaryColor: scrollMainnetMetadata.primaryColor,
      nativeCurrency: {
        ...scrollMainnetMetadata.nativeCurrency,
        ...existingNativeCurrency,
        symbol: scrollMainnetMetadata.nativeCurrency.symbol,
        name: scrollMainnetMetadata.nativeCurrency.name,
        decimals: scrollMainnetMetadata.nativeCurrency.decimals,
        icon: existingNativeCurrency.icon || scrollMainnetMetadata.nativeCurrency.icon
      }
    }

    return state
  } catch (e) {
    log.error('Migration 42: could not parse state', e)
  }

  return initial
}

export default {
  version: 42,
  migrate
}
