const Web3 = require('web3')
const {
  createWeb3,
  closeWeb3,
  ensureWeb3Connection,
  waitForTransactionHash,
  withTimeout
} = require('./helpers')

test('Send Transaction', async () => {
  const web3 = createWeb3()

  try {
    await ensureWeb3Connection(web3)
    const accounts = await withTimeout(
      web3.eth.getAccounts(),
      'Timed out while requesting accounts from Frame'
    )

    const hash = await withTimeout(
      waitForTransactionHash(
        web3.eth.sendTransaction({
          value: Web3.utils.toHex(Math.round(1000000000000000 * Math.random())),
          to: '0x030e6af4985f111c265ee3a279e5a9f6aa124fd5',
          from: accounts[0]
        })
      ),
      'Timed out waiting for transaction hash from Frame'
    )

    expect(hash).toBeTruthy()
  } finally {
    closeWeb3(web3)
  }
})

test('sign_personal and ecRecover', async () => {
  const web3 = createWeb3()
  const message = 'Frame Test'

  try {
    await ensureWeb3Connection(web3)
    const accounts = await withTimeout(
      web3.eth.getAccounts(),
      'Timed out while requesting accounts from Frame'
    )

    const signed = await withTimeout(
      web3.eth.personal.sign(message, accounts[0]),
      'Timed out while signing personal message'
    )

    const result = await withTimeout(
      web3.eth.personal.ecRecover(message, signed),
      'Timed out while recovering signer address'
    )

    expect(result.toLowerCase()).toBe(accounts[0].toLowerCase())
    console.log(JSON.stringify({ address: accounts[0], msg: message, sig: signed, version: '2' }))
  } finally {
    closeWeb3(web3)
  }
})

test('eth_sign and ecRecover', async () => {
  const web3 = createWeb3()
  const message = 'Frame Test'

  try {
    await ensureWeb3Connection(web3)
    const accounts = await withTimeout(
      web3.eth.getAccounts(),
      'Timed out while requesting accounts from Frame'
    )

    const signed = await withTimeout(web3.eth.sign(message, accounts[0]), 'Timed out while signing message')

    const result = await withTimeout(
      web3.eth.personal.ecRecover(message, signed),
      'Timed out while recovering signer address'
    )

    expect(result.toLowerCase()).toBe(accounts[0].toLowerCase())
    console.log(JSON.stringify({ address: accounts[0], msg: message, sig: signed, version: '2' }))
  } finally {
    closeWeb3(web3)
  }
})
