import migration from '../../../../../main/store/migrate/migrations/42'
import { createState } from '../setup'

let state

beforeEach(() => {
  state = createState(migration.version - 1)
})

it('should have migration version 42', () => {
  const { version } = migration
  expect(version).toBe(42)
})

it('adds Scroll mainnet when missing', () => {
  const updatedState = migration.migrate(state)
  const scroll = updatedState.main.networks.ethereum[534352]

  expect(scroll).toMatchObject({
    id: 534352,
    type: 'ethereum',
    layer: 'rollup',
    isTestnet: false,
    name: 'Scroll',
    explorer: 'https://scrollscan.com',
    connection: {
      primary: {
        on: true,
        current: 'custom',
        custom: 'https://rpc.scroll.io'
      },
      secondary: {
        on: false,
        current: 'custom',
        custom: ''
      }
    },
    on: false
  })
})

it('adds Scroll metadata when missing', () => {
  const updatedState = migration.migrate(state)
  const scrollMeta = updatedState.main.networksMeta.ethereum[534352]

  expect(scrollMeta).toMatchObject({
    blockHeight: 0,
    nativeCurrency: {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880'
    },
    icon: 'https://scroll.io/_next/static/media/Scroll_Logomark.13ce0216.png',
    primaryColor: 'accent3'
  })
})

it('normalises existing Scroll chain metadata and keeps custom RPC', () => {
  state.main.networks.ethereum[534352] = {
    id: 534352,
    type: 'ethereum',
    layer: 'rollup',
    isTestnet: false,
    name: 'My Scroll',
    explorer: 'https://example.com',
    connection: {
      primary: { on: false, current: 'custom', custom: 'https://custom-rpc.example' },
      secondary: { on: false, current: 'custom', custom: '' }
    },
    on: true
  }

  state.main.networksMeta.ethereum[534352] = {
    icon: '',
    nativeCurrency: {
      symbol: 'SCRL',
      icon: ''
    }
  }

  const updatedState = migration.migrate(state)

  expect(updatedState.main.networks.ethereum[534352].name).toBe('Scroll')
  expect(updatedState.main.networks.ethereum[534352].explorer).toBe('https://scrollscan.com')
  expect(updatedState.main.networks.ethereum[534352].connection.primary.custom).toBe(
    'https://custom-rpc.example'
  )
  expect(updatedState.main.networksMeta.ethereum[534352].nativeCurrency.symbol).toBe('ETH')
  expect(updatedState.main.networksMeta.ethereum[534352].nativeCurrency.icon).toBe(
    'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880'
  )
  expect(updatedState.main.networksMeta.ethereum[534352].icon).toBe(
    'https://scroll.io/_next/static/media/Scroll_Logomark.13ce0216.png'
  )
})

it('updates legacy Scroll RPC to the official endpoint', () => {
  state.main.networks.ethereum[534352] = {
    id: 534352,
    type: 'ethereum',
    layer: 'rollup',
    isTestnet: false,
    name: 'Scroll',
    explorer: 'https://scrollscan.com',
    connection: {
      primary: { on: true, current: 'custom', custom: 'https://mainnet-rpc.scroll.io' },
      secondary: { on: false, current: 'custom', custom: '' }
    },
    on: false
  }

  const updatedState = migration.migrate(state)

  expect(updatedState.main.networks.ethereum[534352].connection.primary.custom).toBe('https://rpc.scroll.io')
})
