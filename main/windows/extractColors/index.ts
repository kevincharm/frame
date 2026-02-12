import log from 'electron-log'
import { PNG } from 'pngjs'
import { BrowserWindow, BrowserView } from 'electron'

import { createViewInstance } from '../window'

function mode(array: string[]) {
  if (array.length === 0) return ''
  const modeMap: Record<string, number> = {}
  let maxEl = array[0]
  let maxCount = 1
  for (let i = 0; i < array.length; i++) {
    const el = array[i]
    if (!modeMap[el]) {
      modeMap[el] = 1
    } else {
      modeMap[el]++
    }
    if (modeMap[el] > maxCount) {
      maxEl = el
      maxCount = modeMap[el]
    }
  }
  return maxEl
}

async function pixelColor(image: Electron.NativeImage) {
  const png = PNG.sync.read(image.toPNG())
  const colors = []
  const width = png.width
  const height = Math.min(37, png.height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      colors.push(`${png.data[idx]}, ${png.data[idx + 1]}, ${png.data[idx + 2]}`)
    }
  }

  const selectedColor = mode(colors) || '0, 0, 0'
  const colorArray = selectedColor.split(', ')

  return {
    background: `rgb(${colorArray.join(', ')})`,
    backgroundShade: `rgb(${colorArray.map((v) => Math.max(parseInt(v) - 5, 0)).join(', ')})`,
    backgroundLight: `rgb(${colorArray.map((v) => Math.min(parseInt(v) + 50, 255)).join(', ')})`,
    text: textColor(...(colorArray.map((a) => parseInt(a)) as [number, number, number]))
  }
}

async function getColor(view: BrowserView) {
  const image = await view.webContents.capturePage()
  return pixelColor(image)
}

function textColor(r: number, g: number, b: number) {
  // http://alienryderflex.com/hsp.html
  return Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b)) > 127.5 ? 'black' : 'white'
}

function extractSession(l: string) {
  const url = new URL(l)
  const session = url.searchParams.get('session') || ''
  const ens = url.port === '8421' ? url.hostname.replace('.localhost', '') || '' : ''
  return { session, ens }
}

async function extractColors(url: string, ens: string) {
  let window: BrowserWindow | null = new BrowserWindow({
    x: 0,
    y: 0,
    width: 800,
    height: 800,
    show: false,
    focusable: false,
    frame: false,
    titleBarStyle: 'hidden',
    paintWhenInitiallyHidden: true,
    webPreferences: {
      contextIsolation: true,
      webviewTag: false,
      sandbox: true,
      defaultEncoding: 'utf-8',
      nodeIntegration: false,
      scrollBounce: true,
      navigateOnDragDrop: false,
      disableBlinkFeatures: 'Auxclick',
      backgroundThrottling: false,
      offscreen: true
    }
  })

  let view: BrowserView | null = createViewInstance(ens, { offscreen: true })

  view.webContents.session.webRequest.onBeforeSendHeaders((details, cb) => {
    if (!details || !details.frame) return cb({ cancel: true }) // Reject the request

    // Block any dapp requests to Frame during color extraction
    if (details.url.includes('127.0.0.1:1248') || details.url.includes('localhost:1248')) {
      return cb({ cancel: true })
    }

    return cb({ requestHeaders: details.requestHeaders }) // Leave untouched
  })

  window.addBrowserView(view)
  view.setBounds({ x: 0, y: 0, width: 800, height: 800 })

  const { session } = extractSession(url)

  try {
    await view.webContents.session.cookies.set({
      url: url,
      name: '__frameSession',
      value: session
    })

    await view.webContents.loadURL(url)

    const color = await getColor(view)

    return color
  } catch (e) {
    log.error(`error extracting colors for ${ens}`, e)
  } finally {
    if (view) {
      const webcontents = view.webContents as any
      webcontents.destroy()

      view = null
    }

    if (window) {
      window.destroy()
      window = null
    }
  }
}

export default extractColors
