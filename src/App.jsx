import React, { useState, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { 
  CubeCamera, 
  OrbitControls, 
  PerspectiveCamera, 
} from '@react-three/drei'
import './App.css'
import { EquirectangularReflectionMapping, LinearFilter, PMREMGenerator, DataTexture } from 'three'
import "react-sweet-progress/lib/style.css"
import Worker from './workers/RGBEWorker.js?worker'

// ---------------------------------------------------
// Demo of using THREE.js in React-Three-Fiber context
// ---------------------------------------------------

// -------
// CONFIGS
// -------

const cameraDist = 600
const cameraAngle = 180
const mirrorSphereSize = 200
const hdrFile = 'fouriesburg_mountain_midday_1k.hdr'
const hdrFile4k = 'fouriesburg_mountain_midday_4k.hdr'

// ------
// CONSTS
// ------

const cameraAngleRad = cameraAngle*Math.PI/180
const cameraPos = [cameraDist*Math.cos(cameraAngleRad), cameraDist*Math.sin(cameraAngleRad), 0]

// ---------------
// Cubemap Loading
// ---------------


const loadCubemapTexture = (setCubemapTexture) => {
  // load the HDR maps using a worker thread
  const worker = new Worker()
  
  let fileName = '../../cubemaps/' + hdrFile
  
  // request worker load
  worker.postMessage(fileName)

  let loadedFlag = false

  // respond to load
  worker.onmessage = (message) => {
      console.log(message)
      let hdrMap = new DataTexture(new Uint16Array(message.data[0]), message.data[1], message.data[2], 1023, 1016, 300, 1001, 1001, 1006, 1006, 1, 'srgb-linear')
      hdrMap.flipY = true
      hdrMap.mapping = EquirectangularReflectionMapping
      hdrMap.minFilter = LinearFilter
      hdrMap.magFilter = LinearFilter
      hdrMap.needsUpdate = true
  
      // update texture in array
      setCubemapTexture(hdrMap)

      if (!loadedFlag) {
        loadedFlag = true
        fileName = '../../cubemaps/' + hdrFile4k
        worker.postMessage(fileName)
      }
  }

}

// --------
// Elements
// --------
  
const SelectedEnvironment = ({cubemapTexture}) => {
  // Environment
  
  const { gl, scene } = useThree() // Get renderer and scene data

  // Load HDR
  const pmremGen = new PMREMGenerator( gl ) 
  pmremGen.compileEquirectangularShader()

  // modify textures for cubemap
  let texture = pmremGen.fromEquirectangular( cubemapTexture ).texture
  
  // set texture to environment and background
  scene.environment = texture
  scene.background = texture
  
  return null

}  

const MirrorSphere = () => {
  // Central mirror-surfaced sphere

  return (
    <CubeCamera>
      {(texture) => (
        <mesh scale={[mirrorSphereSize,mirrorSphereSize,mirrorSphereSize]}>
          <sphereGeometry args={[0.7071]}/>
          <meshStandardMaterial envMap={texture} roughness={0.0} metalness={1}/>
        </mesh>
      )}
    </CubeCamera>
  )
}


// -----
// SCENE
// -----

const Scene = ({cubemapTexture}) => {
  // Env, obj, camera
  if (cubemapTexture) {
    return (
      <Canvas>
        <SelectedEnvironment cubemapTexture={cubemapTexture}/>
        <MirrorSphere/>
        <OrbitControls
          maxPolarAngle={Math.PI/2}
          enableZoom={false}
        />
        <PerspectiveCamera
          makeDefault
          position={cameraPos}/>
      </Canvas>
    )
  } else {
    return null
  }
}

// ---
// APP
// ---

const App = () => {
  // set up placeholder texture array
  const [cubemapTexture, setCubemapTexture] = useState(() => {
    return undefined
  })

  // loading
  useEffect(() => {
    // load 1k texture only on the first render, 2k texture only when selected, and only once
    loadCubemapTexture(setCubemapTexture)
  }, [])

  return (
    <>
      <Scene cubemapTexture={cubemapTexture}/>
    </>
  )
}

export default App
