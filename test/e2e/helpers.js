const Web3 = require('web3')
const provider = require('eth-provider')

const WS_URL = process.env.FRAME_E2E_WS_URL || 'ws://localhost:1248'
const CONNECT_TIMEOUT_MS = Number(process.env.FRAME_E2E_CONNECT_TIMEOUT_MS || 5000)

const withTimeout = (promise, timeoutMessage, timeoutMs = CONNECT_TIMEOUT_MS) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)

    promise
      .then((result) => {
        clearTimeout(timeout)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timeout)
        reject(error)
      })
  })

const createWeb3 = () =>
  new Web3(
    new Web3.providers.WebsocketProvider(WS_URL, {
      reconnect: { auto: false }
    })
  )

const closeWeb3 = (web3) => {
  const wsProvider = web3?.currentProvider
  if (!wsProvider) return

  if (typeof wsProvider.disconnect === 'function') {
    wsProvider.disconnect(1000, 'e2e teardown')
    return
  }

  if (typeof wsProvider.connection?.close === 'function') {
    wsProvider.connection.close()
  }
}

const ensureWeb3Connection = async (web3) => {
  await withTimeout(web3.eth.getChainId(), `Could not connect to Frame websocket at ${WS_URL}`)
}

const waitForTransactionHash = (promiEvent) =>
  new Promise((resolve, reject) => {
    promiEvent.once('transactionHash', resolve).once('error', reject)
  })

const createFrame = (options = {}) => provider('frame', options)

const closeFrame = (frame) => {
  if (frame && typeof frame.close === 'function') frame.close()
}

const ensureFrameConnection = async (frame) => {
  await withTimeout(frame.request({ method: 'eth_chainId' }), 'Could not connect to Frame provider')
}

module.exports = {
  closeFrame,
  closeWeb3,
  createFrame,
  createWeb3,
  ensureFrameConnection,
  ensureWeb3Connection,
  waitForTransactionHash,
  withTimeout
}
