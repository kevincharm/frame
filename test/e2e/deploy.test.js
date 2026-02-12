const {
  createWeb3,
  closeWeb3,
  ensureWeb3Connection,
  waitForTransactionHash,
  withTimeout
} = require('./helpers')

test('Deploy Contract', async () => {
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
          from: accounts[0],
          data: '0x6080604052348015600f57600080fd5b50603580601d6000396000f3006080604052600080fd00a165627a7a72305820f50314badc96cf2df848b358f976e52facd1986d2f3eb5bd7b41071ac667ae480029',
          gas: '0x10cba'
        })
      ),
      'Timed out waiting for deployment transaction hash from Frame'
    )

    expect(hash).toBeTruthy()
  } finally {
    closeWeb3(web3)
  }
})
