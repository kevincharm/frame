const { createFrame, closeFrame, ensureFrameConnection, withTimeout } = require('./helpers')

jest.mock('../../main/store/persist')

let frame

beforeEach(async () => {
  frame = createFrame({ origin: 'frame.test' })
  await ensureFrameConnection(frame)
  await withTimeout(
    frame.request({ method: 'eth_accounts', params: [] }),
    'Timed out while requesting accounts from Frame'
  )
})

afterEach(() => {
  if (!frame) return
  frame.removeAllListeners('chainChanged')
  closeFrame(frame)
})

it(
  'should be able to change the chain for a given origin',
  async () => {
    const [chains, currentChainId] = await Promise.all([
      frame.request({ method: 'wallet_getEthereumChains' }),
      frame.request({ method: 'eth_chainId' })
    ])

    const targetChain = chains.find((c) => c.chainId !== parseInt(currentChainId))

    if (!targetChain) throw new Error('no available chains to switch to!')

    await withTimeout(
      new Promise((resolve, reject) => {
        frame.once('chainChanged', async (updatedChainId) => {
          try {
            expect(parseInt(updatedChainId)).toBe(targetChain.chainId)

            const chainId = await frame.request({ method: 'eth_chainId' })
            expect(parseInt(chainId)).toBe(targetChain.chainId)
            resolve()
          } catch (e) {
            reject(e)
          }
        })

        frame.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChain.chainId }]
        })
      }),
      'Timed out waiting for chainChanged event'
    )
  },
  5 * 1000
)
