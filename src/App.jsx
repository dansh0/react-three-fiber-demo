import React, { useRef, createElement, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  RoundedBox, 
  Torus, 
  Cone,
  TorusKnot, 
  Dodecahedron, 
  CubeCamera, 
  OrbitControls, 
  PerspectiveCamera, 
  Stats
} from '@react-three/drei'
import './App.css'
import { useControls, Leva } from 'leva'
import { EquirectangularReflectionMapping, LinearFilter, PMREMGenerator, DataTexture } from 'three'
import { Progress } from 'react-sweet-progress'
import "react-sweet-progress/lib/style.css"
import Worker from './workers/RGBEWorker.js?worker'

// ---------------------------------------------------
// Demo of using THREE.js in React-Three-Fiber context
// ---------------------------------------------------

// -------
// CONFIGS
// -------

const cameraDist = 600
const cameraAngle = 15
const partSize = 100
const radius = 250
const mirrorSphereSize = 150
const colorPalette = [
  '#edc951',
  '#eb6841',
  '#cc2a36',
  '#4f372d',
  '#00a0b0'
]
const cubemapList = [
  'fouriesburg_mountain_midday_1k.hdr',
  'blocky_photo_studio_1k.hdr',
  'snowy_forest_1k.hdr',
  'hayloft_1k.hdr',
  'industrial_sunset_puresky_1k.hdr',
  // 'brown_photostudio_01_1k.hdr',
  // 'emmarentia_1k.hdr',
  // 'studio_small_06_1k.hdr',
]

const cubemapList2k = [
  'fouriesburg_mountain_midday_2k.hdr',
  'blocky_photo_studio_2k.hdr',
  'snowy_forest_2k.hdr',
  'hayloft_2k.hdr',
  'industrial_sunset_puresky_2k.hdr',
  // 'brown_photostudio_01_2k.hdr',
  // 'emmarentia_2k.hdr',
  // 'studio_small_06_2k.hdr',
]


// ------
// CONSTS
// ------

const cameraAngleRad = cameraAngle*Math.PI/180
const cameraPos = [cameraDist*Math.cos(cameraAngleRad), cameraDist*Math.sin(cameraAngleRad), 0]
const objTypes = [
  {shape: RoundedBox, args:{}},
  {shape: Cone, args:{args:[0.7071, 1, 64]}},
  {shape: Torus, args:{args:[0.5, 0.3, 24, 96]}},
  {shape: TorusKnot, args:{args:[0.5, 0.2, 124, 32]}},
  {shape: Dodecahedron, args:{args:[0.7071]}},
]

// ---------------
// Cubemap Loading
// ---------------

const loadPlaceholderTextures = () => {
  // sets up array of placeholder textures to later be updated
  const preloadedTextures = []
  
  // load placeholders
  for (let iMap=0; iMap<cubemapList.length; iMap++) {
    preloadedTextures.push( undefined )
  }

  return preloadedTextures
}

const loadCubemapTextures = (setCubemapTextures, setProgress, highRes=false) => {
  // load the HDR maps
  const worker = new Worker()
  
  // load images recursively, updating state for each
  loadNextCubeMap(0, setCubemapTextures, setProgress, highRes, worker)
  
}

const loadNextCubeMap = (index, setCubemapTextures, setProgress, highRes, worker) => {
  // load next texture
  
  // progess per texture
  let progressStep = 100*(1.0/cubemapList.length)
  
  // choose high or low res
  let fileList = (highRes) ? cubemapList2k : cubemapList
  
  // load
  let fileName;
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    fileName = '../../cubemaps/' + fileList[index]
  } else {
    fileName = 'https://shores.design/r3f/cubemaps/' + fileList[index]
  }
  
  // request worker load
  worker.postMessage(fileName)

  // respond to load
  worker.onmessage = (message) => {
    if (message.data[0] == 'hdrData') {
      let hdrMap = new DataTexture(new Uint16Array(message.data[1]), message.data[2], message.data[3], 1023, 1016, 300, 1001, 1001, 1006, 1006, 1, 'srgb-linear')
      hdrMap.flipY = true
      hdrMap.mapping = EquirectangularReflectionMapping
      hdrMap.minFilter = LinearFilter
      hdrMap.magFilter = LinearFilter
      hdrMap.needsUpdate = true
  
      // update texture in array
      setCubemapTextures(prevTex => prevTex.map((tex, i) => {
        return ((i==index) ? hdrMap : tex)
      }))
    
      // start next load
      if ((index + 1) < fileList.length) {
        loadNextCubeMap(index+1, setCubemapTextures, setProgress, highRes, worker)
      } else {
        // done!
      }

    } else if (message.data[0] == 'progress') {
      //update progress
      let progress = message.data[1]
      if (!highRes) {
        setProgress(parseInt(progressStep * (index + progress)))
      }

    } else if (message.data[0] == 'error') {
      // report error
      let error = message.data[1]
      console.error(error)
    
    } else {
      // unknown message channel
      console.warn('Unknown Worker Message Channel')
      console.warn(message.data[0])
      console.warn(message.data[1])
    }
  }

}

// --------
// Elements
// --------
  
const SelectedEnvironment = ({cubemapTextures, progress}) => {
  // Environment with GUI selector
  let {cubemap} = useControls({'cubemap': {
    value: 0,
    min: 0,
    max: cubemapList.length-1,
    step: 1,
  }})
  
  const { gl, scene } = useThree() // Get renderer and scene data

  if (progress>99) {
    // Load HDR
    const pmremGen = new PMREMGenerator( gl ) 
    pmremGen.compileEquirectangularShader()
  
    // convert the HDR map to a texture
    let hdrMap = cubemapTextures[cubemap]
  
    // modify textures for cubemap
    let texture = pmremGen.fromEquirectangular( hdrMap ).texture
    // hdrMap.mapping = EquirectangularReflectionMapping
    // hdrMap.minFilter = LinearFilter
    // hdrMap.magFilter = LinearFilter
    // hdrMap.needsUpdate = true
    
    // set texture to scene and background
    scene.environment = texture
    scene.background = texture
  } else {
    scene.background = undefined
  }

  return null

}  


const Material = ({color}) => {
  // Material for objs

  return (
    <meshStandardMaterial 
      color={color} 
      reflectivity={0.9}
      roughness={0}
      metalness={1}
    />
  )
}


const Shape = ({index, thetaStart }) => {
  // One of many shape objs
  const ref = useRef()
  let theta = thetaStart
  let position = [radius*Math.cos(theta), 0, radius*Math.sin(theta)]
  let rotX = 2 + Math.random()*5
  let rotY = 2 + Math.random()*5
  console.log('here!')

  // Animate!
  useFrame((state, delta) => {
    // animate
    ref.current.rotation.x += delta/rotX
    ref.current.rotation.y += delta/rotY
    theta += delta/5
    ref.current.position.x = radius*Math.cos(theta)
    ref.current.position.z = radius*Math.sin(theta)
  })

  return (
    <mesh position={position} ref={ref} scale={[partSize,partSize,partSize]}>
      {createElement(
        objTypes[index].shape,
        objTypes[index].args,
        createElement(Material, {color:colorPalette[index]})
      )}
    </mesh>
  )
}


const Shapes = () => {
  // The collection of shapes (orbiting)
  let {numShapes} = useControls({'numShapes': {
    value: 5,
    min: 0,
    max: 5,
    step: 1,
  }})

  return (
    <>
    {objTypes.slice(0,numShapes).map((shape, count) =>
        createElement(Shape, {index:count, thetaStart:count*2*Math.PI/numShapes})
      )}
    </>
  )
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

const Scene = ({cubemapTextures, progress}) => {
  // Env, obj, camera
  if (progress > 99) {
    return (
      <Canvas>
        <SelectedEnvironment cubemapTextures={cubemapTextures} progress={progress}/>
        <Shapes/>
        <MirrorSphere/>
        <OrbitControls
          maxPolarAngle={Math.PI/2}
          enableZoom={false}
        />
        <PerspectiveCamera
          makeDefault
          position={cameraPos}/>
        {/* <Stats className="stats"/> */}
      </Canvas>
    )
  } else {
    return null
  }
}

// --------
// Progress
// --------

const ProgressBar = ({progress, highRes}) => {

  // Show progress bar when loading textures
  if (progress < 100) {
    if (!highRes) {
      return (
        <div className="loading">
        <Progress percent={progress} status="active"/>
        <a>Loading Cubemaps</a>
      </div>
      )
    } else {
      return (
        <div className="loading">
          <Progress percent={progress} status="active"/>
          <a>Loading High Resolution Cubemaps</a>
        </div>
      )
    } 
  } else {
    return null
  }
}


// ---
// APP
// ---

const App = () => {
  // set up placeholder texture array
  const [cubemapTextures, setCubemapTextures] = useState(() => {
    return loadPlaceholderTextures()
  })

  // controls for high res or not
  let {highRes} = useControls({'highRes': false})

  // loading and loading state
  const [progress, setProgress] = useState(0.0)
  const [loaded1k, setLoaded1k] = useState(false)
  const [loaded2k, setLoaded2k] = useState(false)
  useEffect(() => {
    // load 1k textures only on the first render, 2k textures only when selected, and only once
    if (!loaded1k || (!loaded2k && highRes)) {
      // setProgress(0)
      loadCubemapTextures(setCubemapTextures, setProgress, highRes)
      if (highRes) { setLoaded2k(true) }
      else { setLoaded1k(true) }
    }

    // if unclicking highRes, refresh window to return to 1k textures (hacky but need to unload textures and kill load process)
    if (loaded1k && !highRes) {
      window.location.reload()
    }
  }, [highRes])

  return (
    <>
      <ProgressBar progress={progress} highRes={highRes}/>
      <Scene cubemapTextures={cubemapTextures} progress={progress}/>
      <Leva collapsed/>
    </>
  )
}

export default App
