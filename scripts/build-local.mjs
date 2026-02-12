import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createRequire } from 'module'

const isWindows = process.platform === 'win32'
const require = createRequire(import.meta.url)
const baseConfig = require('../build/electron-builder-standard.js')
const localArch = process.arch === 'arm64' ? 'arm64' : 'x64'

const localConfig = {
  ...baseConfig,
  mac: {
    ...baseConfig.mac,
    target: { target: 'default', arch: [localArch] },
    identity: null,
    sign: null,
    strictVerify: false,
    hardenedRuntime: false,
    notarize: false
  }
}

const tempConfigDir = fs.mkdtempSync(path.join(os.tmpdir(), 'frame-build-local-'))
const tempConfigPath = path.join(tempConfigDir, 'electron-builder-local.json')
fs.writeFileSync(tempConfigPath, JSON.stringify(localConfig, null, 2))

const args = ['exec', 'electron-builder', `--config=${tempConfigPath}`, '--mac', `--${localArch}`]
const env = { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' }

const child = spawn('pnpm', args, { stdio: 'inherit', shell: isWindows, env })

child.once('close', (exitCode) => {
  process.exit(exitCode || 0)
})

child.once('error', (err) => {
  console.error('Failed to run local build', err)
  process.exit(1)
})
