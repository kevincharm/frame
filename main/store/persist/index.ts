import path from 'path'
import electron from 'electron'
import Conf, { Options } from 'conf'

import migrations from '../migrate'

type PersistOpts<T extends Record<string, any>> = Options<T>

class PersistStore extends Conf {
  private blockUpdates = false
  private updates: Record<string, any> | null = {}

  constructor(options?: PersistOpts<any>) {
    options = { configFileMode: 0o600, configName: 'config', ...options }
    let defaultCwd = __dirname
    // In tests and restricted environments electron.app.getPath can be undefined/non-string.
    const appDataPath = electron?.app?.getPath?.('appData')
    if (typeof appDataPath === 'string' && appDataPath.length > 0) {
      // Keep fork state isolated from upstream Frame.
      defaultCwd = path.join(appDataPath, 'frame-flux')
    }
    if (options.cwd) {
      options.cwd = path.isAbsolute(options.cwd) ? options.cwd : path.join(defaultCwd, options.cwd)
    } else {
      options.cwd = defaultCwd
    }
    electron.app.on('quit', () => this.writeUpdates())
    super(options)
    setInterval(() => this.writeUpdates(), 30 * 1000)
  }

  writeUpdates() {
    if (this.blockUpdates) return

    const updates = { ...this.updates }
    this.updates = null
    if (Object.keys(updates || {}).length > 0) super.set(updates)
  }

  queue(path: string, value: any) {
    path = `main.__.${migrations.latest}.${path}`
    this.updates = this.updates || {}
    delete this.updates[path] // maintain entry order
    this.updates[path] = JSON.parse(JSON.stringify(value))
  }

  set(path: any, value?: unknown) {
    if (this.blockUpdates) return
    path = `main.__.${migrations.latest}.${path}`
    super.set(path, value)
  }

  clear() {
    this.blockUpdates = true
    super.clear()
  }
}

export default new PersistStore()
