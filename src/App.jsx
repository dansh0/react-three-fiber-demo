import React, { useRef, createElement, useEffect } from 'react'
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
  Environment,
  useEnvironment
} from '@react-three/drei'
import './App.css'
import { useControls, Leva } from 'leva'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { HDRCubeTextureLoader } from 'three/addons/loaders/HDRCubeTextureLoader.js';
import { EquirectangularReflectionMapping, LinearFilter, PMREMGenerator, Texture } from 'three'

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
  'brown_photostudio_01_1k.hdr',
  'emmarentia_1k.hdr',
  'studio_small_06_1k.hdr',
]

const cubemapList2k = [
  'fouriesburg_mountain_midday_2k.hdr',
  'blocky_photo_studio_2k.hdr',
  'snowy_forest_2k.hdr',
  'hayloft_2k.hdr',
  'industrial_sunset_puresky_2k.hdr',
  'brown_photostudio_01_2k.hdr',
  'emmarentia_2k.hdr',
  'studio_small_06_2k.hdr',
]


// ------
// CONSTS
// ------

const cameraAngleRad = cameraAngle*Math.PI/180
const cameraPos = [cameraDist*Math.cos(cameraAngleRad), cameraDist*Math.sin(cameraAngleRad), 0]
const objTypes = [
  {shape: RoundedBox, args:{}},
  {shape: Cone, args:{args:[0.7071]}},
  {shape: Torus, args:{args:[0.5, 0.3]}},
  {shape: TorusKnot, args:{args:[0.5, 0.2]}},
  {shape: Dodecahedron, args:{args:[0.7071]}},
]

// // ---------------
// // Cubemap Loading
// // ---------------

const preloaded1kTextures = []
const preloaded2kTextures = []
let loaded = []
let loaded2k = []

// load placeholders
for (let iMap=0; iMap<cubemapList.length; iMap++) {
  preloaded1kTextures.push( new Texture() )
  preloaded2kTextures.push( new Texture() )
  loaded.push( false )
  loaded2k.push( false )
}

// load the HDR maps
const loader = new RGBELoader()
let fullyLoaded = false
let loadedNum = 0
cubemapList.forEach((file, count) => {
  loader.load('./cubemaps/' + file, hdrMap => {
    preloaded1kTextures[count] = hdrMap
    loaded[count] = true
    loadedNum++
    // mark loaded complete when all have loaded
    fullyLoaded = (loadedNum == cubemapList.length)
  })
});

let fullyLoaded2k = false
let loadedNum2k = 0
cubemapList2k.forEach((file, count) => {
  loader.load('./cubemaps/' + file, hdrMap => {
    preloaded2kTextures[count] = hdrMap
    loaded2k[count] = true
    loadedNum2k++
    // mark loaded complete when all have loaded
    fullyLoaded2k = (loadedNum2k == cubemapList2k.length)
  })
});

// Function to keep checking loaded status until it is complete (for element rendering)
const checkLoaded = (exitFunc, cubemap, flagArray, time) => {
  // keep checking for texture load until it loads
  if (!flagArray[cubemap]) {
    setTimeout(() => { checkLoaded(exitFunc, cubemap, flagArray, time) }, time)
  } else {
    exitFunc()
  }
}

// --------
// Elements
// --------
  
const SelectedEnvironment = () => {
  // Environment with GUI selector
  let {cubemap} = useControls({'cubemap': {
    value: 0,
    min: 0,
    max: cubemapList.length-1,
    step: 1,
  }})

  // Load HDR
  let loadedTexture = undefined
  const { gl, scene } = useThree() // Get renderer and scene data
  const pmremGen = new PMREMGenerator( gl ) 
  pmremGen.compileEquirectangularShader()

  useEffect(() => {
    const convertToTexture = () => {
      // convert the HDR map to a texture
      let hdrMap = preloaded1kTextures[cubemap]
      let texture = pmremGen.fromEquirectangular( hdrMap ).texture
      hdrMap.mapping = EquirectangularReflectionMapping
      hdrMap.minFilter = LinearFilter
      hdrMap.magFilter = LinearFilter
      hdrMap.needsUpdate = true
      
      // load env from low res
      scene.environment = texture

      // load background from high-res if possible
      if (loaded2k[cubemap]) {
        let hdrMap2k = preloaded2kTextures[cubemap]
        let texture2k = pmremGen.fromEquirectangular( hdrMap2k ).texture
        hdrMap2k.mapping = EquirectangularReflectionMapping
        hdrMap2k.minFilter = LinearFilter
        hdrMap2k.magFilter = LinearFilter
        hdrMap2k.needsUpdate = true
        scene.background = texture2k
      } else {
        scene.background = texture
      }
    }

    // check if textures are loaded
    checkLoaded(convertToTexture, cubemap, loaded, 100)

    // check for high res textures loaded
    checkLoaded(convertToTexture, cubemap, loaded2k, 500)

  }, [scene, pmremGen])

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


const Shape = ({index, thetaStart, texture }) => {
  // One of many shape objs
  const ref = useRef()
  let theta = thetaStart
  let position = [radius*Math.cos(theta), 0, radius*Math.sin(theta)]
  let rotX = 2 + Math.random()*5
  let rotY = 2 + Math.random()*5

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
        createElement(Material, {color:colorPalette[index], texture:texture})
      )}
    </mesh>
  )
}


const Shapes = (texture) => {
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
        createElement(Shape, {index:count, thetaStart:count*2*Math.PI/numShapes, texture:texture})
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

const Scene = () => {
  // Env, obj, camera
  if (true) {
    return (
      <>
        <SelectedEnvironment/>
        <Shapes/>
        <MirrorSphere/>
        <OrbitControls
          maxPolarAngle={Math.PI/2}
          enableZoom={false}
        />
        <PerspectiveCamera
          makeDefault
          position={cameraPos}/>
      </>
    )
  } else {
    return null
  }
}


// ---
// APP
// ---

const App = () => {
  
  return (
    <>
      <Canvas>
        <Scene/>
      </Canvas>
      <Leva collapsed/>
    </>
  )
}

export default App
