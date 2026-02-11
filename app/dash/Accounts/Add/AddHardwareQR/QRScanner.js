import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { URDecoder, UREncoder } from '@ngraveio/bc-ur'
import link from '../../../../../resources/link'

function formatCameraOption(device, index) {
  const fallbackLabel = `Camera ${index + 1}`
  const label = (device.label || '').trim()
  return {
    id: device.deviceId,
    label: label || fallbackLabel
  }
}

function pickDefaultCamera(cameras) {
  const preferredCamera = cameras.find((camera) => /back|rear|environment/i.test(camera.label))
  return preferredCamera || cameras[0]
}

function getStoredCameraPreference() {
  return new Promise((resolve) => {
    link.rpc('getQRCameraPreference', (err, cameraId) => {
      if (err) return resolve('')
      resolve(cameraId || '')
    })
  })
}

function setStoredCameraPreference(cameraId) {
  link.rpc('setQRCameraPreference', cameraId, () => {})
}

function QRScanner({
  onScan,
  onError,
  onCancel,
  title = 'Scan device sync QR code',
  instructions = 'Open your hardware wallet and display the account sync QR code',
  externalError = null
}) {
  const videoRef = useRef(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isAnimated, setIsAnimated] = useState(false)
  const [availableCameras, setAvailableCameras] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [isStartingCamera, setIsStartingCamera] = useState(false)

  const readerRef = useRef(null)
  const controlsRef = useRef(null)
  const urDecoderRef = useRef(null)
  const lastCompletedScanRef = useRef({ payload: '', timestamp: 0 })
  const mountedRef = useRef(false)
  const scanSessionRef = useRef(0)

  const stopScanning = () => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
  }

  const resetDecoderState = () => {
    urDecoderRef.current = new URDecoder()
    setProgress(0)
    setIsAnimated(false)
  }

  const handleURPart = (urPart) => {
    if (!urDecoderRef.current) {
      urDecoderRef.current = new URDecoder()
    }

    try {
      urDecoderRef.current.receivePart(urPart)

      const progressValue = urDecoderRef.current.getProgress()
      setProgress(Math.round(progressValue * 100))

      // Check if this is an animated QR
      if (urDecoderRef.current.expectedPartCount() > 1) {
        setIsAnimated(true)
      }

      if (urDecoderRef.current.isComplete()) {
        const ur = urDecoderRef.current.resultUR()
        // Re-encode the complete UR to a single-part string (handles multi-frame QRs)
        const encoder = new UREncoder(ur, Infinity)
        const completeURString = encoder.nextPart()

        const now = Date.now()
        const lastScan = lastCompletedScanRef.current
        const isDuplicateScan = lastScan.payload === completeURString && now - lastScan.timestamp < 1500
        if (isDuplicateScan) return

        lastCompletedScanRef.current = { payload: completeURString, timestamp: now }
        onScan(completeURString)
        stopScanning()
      }
    } catch (_err) {
      // If this part fails, it might be from a different QR code.
      // Reset the decoder and continue scanning.
      resetDecoderState()
    }
  }

  const handleQRResult = (text) => {
    const now = Date.now()
    const lastScan = lastCompletedScanRef.current
    const isDuplicateScan = lastScan.payload === text && now - lastScan.timestamp < 1500
    if (isDuplicateScan) return

    // Check if this is a UR-encoded QR code
    if (text.toLowerCase().startsWith('ur:')) {
      handleURPart(text)
    } else {
      // Non-UR data, pass through directly
      lastCompletedScanRef.current = { payload: text, timestamp: now }
      onScan(text)
      stopScanning()
    }
  }

  const startScanningWithDevice = async (deviceId) => {
    if (!deviceId || !readerRef.current || !videoRef.current) return

    const sessionId = ++scanSessionRef.current
    setIsStartingCamera(true)
    setError(null)
    resetDecoderState()
    stopScanning()

    try {
      const controls = await readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, _err) => {
          if (!mountedRef.current) return

          if (result) {
            handleQRResult(result.getText())
          }
        }
      )

      if (!mountedRef.current || sessionId !== scanSessionRef.current) {
        controls.stop()
        return
      }

      controlsRef.current = controls
    } catch (err) {
      if (mountedRef.current && sessionId === scanSessionRef.current) {
        const message = err.message || 'Failed to access camera'
        setError(message)
        onError(message)
      }
    } finally {
      if (mountedRef.current && sessionId === scanSessionRef.current) {
        setIsStartingCamera(false)
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true

    // Reset duplicate detection on mount to prevent stale state from previous scans
    lastCompletedScanRef.current = { payload: '', timestamp: 0 }

    const initialiseScanner = async () => {
      try {
        // Request camera permission first (required on macOS)
        const permissionResult = await new Promise((resolve) => {
          link.rpc('requestCameraAccess', (err, result) => {
            if (err) {
              resolve({ granted: false, error: err })
            } else {
              resolve(result)
            }
          })
        })
        console.info('[QRScanner] Camera permission result', permissionResult)

        if (!permissionResult.granted) {
          throw new Error(
            'Camera access denied. Please enable camera access in System Preferences > Privacy & Security > Camera.'
          )
        }

        // Initialize the ZXing reader
        readerRef.current = new BrowserMultiFormatReader()

        // Initialize UR decoder for animated QR codes
        urDecoderRef.current = new URDecoder()

        // Get available cameras
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        console.info(
          '[QRScanner] Detected video input devices',
          devices.map((device, index) => ({
            index,
            deviceId: device.deviceId,
            label: device.label
          }))
        )

        if (devices.length === 0) {
          throw new Error('No camera found')
        }

        const cameraOptions = devices.map(formatCameraOption)
        const storedCameraId = await getStoredCameraPreference()
        const defaultCamera =
          cameraOptions.find((camera) => camera.id === storedCameraId) || pickDefaultCamera(cameraOptions)
        setAvailableCameras(cameraOptions)
        setSelectedCameraId(defaultCamera.id)
        await startScanningWithDevice(defaultCamera.id)
      } catch (err) {
        if (mountedRef.current) {
          setError(err.message || 'Failed to access camera')
          onError(err.message || 'Failed to access camera')
        }
      }
    }

    initialiseScanner()

    return () => {
      mountedRef.current = false
      scanSessionRef.current += 1
      // Reset duplicate detection on unmount
      lastCompletedScanRef.current = { payload: '', timestamp: 0 }
      stopScanning()
      if (readerRef.current) {
        readerRef.current = null
      }
    }
  }, [onScan, onError])

  const handleCameraChange = async (event) => {
    const nextCameraId = event.target.value
    if (!nextCameraId || nextCameraId === selectedCameraId) return

    setSelectedCameraId(nextCameraId)
    setStoredCameraPreference(nextCameraId)
    await startScanningWithDevice(nextCameraId)
  }

  const handleCancel = () => {
    scanSessionRef.current += 1
    stopScanning()
    if (readerRef.current) {
      readerRef.current = null
    }
    onCancel()
  }

  return (
    <div className='qrScannerContainer'>
      <div className='qrScannerTitle'>{isAnimated ? `Scanning animated QR... ${progress}%` : title}</div>

      {availableCameras.length > 0 && (
        <div className='qrScannerCameraPicker'>
          <div className='qrScannerCameraLabel'>Camera</div>
          <div className='qrScannerCameraSelectWrap'>
            <select
              className='qrScannerCameraSelect'
              value={selectedCameraId}
              onChange={handleCameraChange}
              disabled={isStartingCamera}
            >
              {availableCameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className='qrScannerVideo'>
        <video ref={videoRef} style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }} />
      </div>

      {isStartingCamera && <div className='qrScannerCameraStatus'>Switching camera...</div>}

      {isAnimated && (
        <div className='qrScannerProgress'>
          <div className='qrScannerProgressBar' style={{ width: `${progress}%` }} />
        </div>
      )}

      {(error || externalError) && <div className='qrScannerError'>{error || externalError}</div>}

      <div className='qrScannerInstructions'>{instructions}</div>

      <div className='addAccountItemOptionSubmit' onMouseDown={handleCancel}>
        Cancel
      </div>
    </div>
  )
}

export default QRScanner
