import { spawn } from 'child_process'
import waitOn from 'wait-on'
import runBundler from './bundler.mjs'

const isWindows = process.platform === 'win32'
const packageManager = process.env.npm_config_user_agent?.includes('pnpm') ? 'pnpm' : 'npm'

async function waitForTask(taskName) {
  return new Promise((resolve, reject) => {
    const ps = spawn(packageManager, ['run', taskName], { stdio: 'inherit', shell: isWindows })

    ps.once('close', (exitCode) =>
      exitCode === 0 ? resolve() : reject(`${taskName} failed with exit code: ${exitCode}`)
    )

    ps.once('error', (err) => console.error(`Error executing task ${taskName}`, err))
  })
}

async function prepareEnvironment() {
  await waitForTask('bundle:bridge')
  await waitForTask('compile')
}

async function launchDevServer() {
  const { server, host } = await runBundler()

  await waitOn({
    resources: [`${host}/tray/index.dev.html`],
    validateStatus: (status) => status === 200
  })

  return { shutdown: () => server.unsubscribe() }
}

function launchFrame({ shutdown }) {
  const appProcess = spawn(packageManager, ['run', 'launch:dev'], { stdio: 'inherit', shell: isWindows })

  appProcess.once('exit', () => {
    console.log('Frame exited')
    shutdown()
  })
}

async function run() {
  await prepareEnvironment()
  const server = await launchDevServer()

  launchFrame(server)
}

run()
