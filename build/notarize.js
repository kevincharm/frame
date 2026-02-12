const fs = require('fs')
const { execFileSync } = require('child_process')
const path = require('path')
const electronNotarize = require('@electron/notarize')

module.exports = async function (params) {
  if (process.platform !== 'darwin') return // Only notarize the app on macOS
  const appleId = process.env.APPLE_ID
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD
  const teamId = process.env.APPLE_TEAM_ID
  const hasNotarizeAuth = appleId && appleIdPassword && teamId

  if (!hasNotarizeAuth) {
    console.log('Skipping notarization: APPLE_ID / APPLE_APP_SPECIFIC_PASSWORD / APPLE_TEAM_ID are not set')
    return
  }

  const appId = 'sh.frame.flux.app' // Same appId in electron-builder
  const appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`)
  if (!fs.existsSync(appPath)) throw new Error(`Cannot find application at: ${appPath}`)

  console.log(`Notarizing ${appId} found at ${appPath}`)

  try {
    await electronNotarize.notarize({
      tool: 'notarytool',
      appBundleId: appId,
      appPath: appPath,
      appleId,
      appleIdPassword,
      teamId
    })

    // verify signed and notarized application
    execFileSync(
      'spctl',
      ['--assess', '--type', 'execute', '--verbose', '--ignore-cache', '--no-cache', appPath],
      {}
    )

    console.log(`Successfully notarized ${appId}`)
  } catch (error) {
    console.error(error)
    throw error
  }
}
