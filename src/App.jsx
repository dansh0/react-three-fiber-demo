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

const loadCubemapTextures = (setCubemapTextures, setProgress) => {
  // load the HDR maps using a worker thread
  const worker = new Worker()
  
  // load images recursively, updating state for each
  loadNextCubeMap(0, setCubemapTextures, setProgress, false, worker)
  
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
        // load next in this set
        loadNextCubeMap(index+1, setCubemapTextures, setProgress, highRes, worker)
      } else if (!highRes && (index + 1) == fileList.length){
        // start higher resolution loading
        loadNextCubeMap(0, setCubemapTextures, setProgress, true, worker)
      } else {
        // done!
        console.log('Loading Complete!')
      }

    } else if (message.data[0] == 'progress') {
      //update progress
      let progressPercent = message.data[1]
      if (!highRes) {
        let progress = parseInt(progressStep * (index + progressPercent)) // loaded textures + percent of current load
        setProgress(prevProgress => (prevProgress<progress) ? progress : prevProgress) // don't allow backtracking
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
    
    // set texture to environment and background
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


const Shape = ({index, thetaDelta }) => {
  // One of many shape objs
  const ref = useRef()
  let time = Date.now()
  let pace = 1000*2*Math.PI //~30 second per revolution
  let theta = time/pace + index*thetaDelta
  let rotX = 2 + Math.random()*5
  let rotY = 2 + Math.random()*5

  // Animate!
  useFrame((state, delta) => {
    // animate
    ref.current.rotation.x += delta/rotX
    ref.current.rotation.y += delta/rotY
    theta = Date.now()/pace + index*thetaDelta
    ref.current.position.x = radius*Math.cos(theta)
    ref.current.position.z = radius*Math.sin(theta)
  })

  return (
    <mesh ref={ref} scale={[partSize,partSize,partSize]}>
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
        createElement(Shape, {index:count, thetaDelta:2*Math.PI/numShapes})
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

const ProgressBar = ({progress}) => {

  // Show progress bar when loading textures
  if (progress < 100) {
      return (
        <div className="loading">
          <Progress percent={progress} status="active"/>
          <a>Loading Cubemaps</a>
        </div>
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
  const [cubemapTextures, setCubemapTextures] = useState(() => {
    return loadPlaceholderTextures()
  })

  // loading and loading state
  const [progress, setProgress] = useState(0.0)
  useEffect(() => {
    // load 1k textures only on the first render, 2k textures only when selected, and only once
    loadCubemapTextures(setCubemapTextures, setProgress)
  }, [])

  return (
    <>
      <ProgressBar progress={progress}/>
      <Scene cubemapTextures={cubemapTextures} progress={progress}/>
      <Leva collapsed/>
    </>
  )
}

export default App
