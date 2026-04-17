import { Canvas, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { Suspense, useRef, useEffect, useState, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import './STLViewer.css'

// Converts {azimuth, polar, zoom} to [x, y, z] camera position
function angleToPosition(angle) {
  const az = angle?.azimuth ?? 0.4
  const po = angle?.polar ?? 1.05
  const zm = angle?.zoom ?? 3.5
  return [
    zm * Math.sin(po) * Math.sin(az),
    zm * Math.cos(po),
    zm * Math.sin(po) * Math.cos(az),
  ]
}

// Auto-normalizes the STL geometry to a 2-unit bounding box, centered at origin
function STLMesh({ url, color = '#c8b89a' }) {
  const geom = useLoader(STLLoader, url)

  const normalized = useMemo(() => {
    const g = geom.clone()
    g.computeBoundingBox()
    const box = g.boundingBox
    const center = new THREE.Vector3()
    box.getCenter(center)
    g.translate(-center.x, -center.y, -center.z)

    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    if (maxDim > 0) {
      const s = 2 / maxDim
      g.scale(s, s, s)
    }
    g.computeVertexNormals()
    return g
  }, [geom])

  return (
    <mesh geometry={normalized}>
      <meshStandardMaterial color={color} roughness={0.65} metalness={0.05} />
    </mesh>
  )
}

// Signals parent when STL has loaded (renders inside Suspense)
function LoadSignal({ onLoad }) {
  useEffect(() => { onLoad() }, [onLoad])
  return null
}

// Resets camera to the initial angle when resetTrigger changes
function CameraReset({ angle, orbitRef, resetTrigger, onAngleChange }) {
  const { camera } = useThree()

  useEffect(() => {
    if (!resetTrigger) return
    const [x, y, z] = angleToPosition(angle)
    camera.position.set(x, y, z)
    camera.lookAt(0, 0, 0)
    if (orbitRef?.current) {
      orbitRef.current.target.set(0, 0, 0)
      orbitRef.current.update()
    }
    if (onAngleChange) {
      onAngleChange({
        azimuth: angle?.azimuth ?? 0.4,
        polar: angle?.polar ?? 1.05,
        zoom: angle?.zoom ?? 3.5,
      })
    }
  }, [resetTrigger])

  return null
}

// Sets camera after OrbitControls mounts, respecting the saved angle
function CameraInit({ angle, orbitRef }) {
  const { camera } = useThree()
  const done = useRef(false)

  useEffect(() => {
    if (done.current || !angle) return
    done.current = true
    const [x, y, z] = angleToPosition(angle)
    camera.position.set(x, y, z)
    camera.lookAt(0, 0, 0)
    if (orbitRef?.current) {
      orbitRef.current.update()
    }
  }, [camera, angle, orbitRef])

  return null
}

// ── Main component ──────────────────────────────────────────────────────────
// Props:
//   url            — STL file public URL
//   interactive    — enable full OrbitControls with zoom (detail page)
//   cameraAngle    — {azimuth, polar, zoom} saved angle (thumbnail / initial angle)
//   onAngleChange  — (angle) callback while user rotates (admin picker)
//   height         — CSS height of the wrapper
export default function STLViewer({
  url,
  interactive = false,
  cameraAngle = null,
  onAngleChange = null,
  height = 300,
}) {
  const orbitRef = useRef()
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const [resetTrigger, setResetTrigger] = useState(0)

  const handleReset = useCallback(() => setResetTrigger(t => t + 1), [])

  const initialPos = useMemo(() => angleToPosition(cameraAngle), []) // intentionally omit dep: set once

  const controlsEnabled = interactive || !!onAngleChange

  function handleOrbitChange() {
    if (!orbitRef.current || !onAngleChange) return
    const ctrl = orbitRef.current
    onAngleChange({
      azimuth: ctrl.getAzimuthalAngle(),
      polar: ctrl.getPolarAngle(),
      zoom: ctrl.object.position.distanceTo(ctrl.target),
    })
  }

  function handleZoom(direction) {
    if (!orbitRef.current) return
    const ctrl = orbitRef.current
    if (direction === 'in') ctrl.dollyIn(1.25)
    else ctrl.dollyOut(1.25)
    ctrl.update()
    handleOrbitChange()
  }

  if (errored) {
    return <div className="stl-error">Modelo 3D indisponível</div>
  }

  return (
    <div className="stl-viewer-wrap" style={{ height }}>
      {!loaded && (
        <div className="stl-loading">
          <div className="stl-spinner" />
          <span>Carregando 3D...</span>
        </div>
      )}

      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: initialPos, fov: 45 }}
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[5, 8, 4]} intensity={1.3} />
        <directionalLight position={[-4, -4, -4]} intensity={0.25} />

        <Suspense fallback={null}>
          <STLMesh url={url} />
          <LoadSignal onLoad={() => setLoaded(true)} />
          {cameraAngle && <CameraInit angle={cameraAngle} orbitRef={orbitRef} />}
          <CameraReset angle={cameraAngle} orbitRef={orbitRef} resetTrigger={resetTrigger} onAngleChange={onAngleChange} />
        </Suspense>

        {controlsEnabled && (
          <OrbitControls
            ref={orbitRef}
            enableZoom={interactive || !!onAngleChange}
            enablePan={true}
            minDistance={1}
            maxDistance={12}
            onChange={handleOrbitChange}
          />
        )}
      </Canvas>

      {controlsEnabled && loaded && (
        <button className="stl-reset-btn" onClick={handleReset} title="Resetar posição">⌂</button>
      )}

      {!!onAngleChange && loaded && (
        <div className="stl-zoom-controls">
          <button className="stl-zoom-btn" onClick={() => handleZoom('in')} title="Zoom in">+</button>
          <button className="stl-zoom-btn" onClick={() => handleZoom('out')} title="Zoom out">−</button>
        </div>
      )}
    </div>
  )
}
