import React, { useRef, useState, createElement } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  RoundedBox, 
  Torus, 
  Cone,
  TorusKnot, 
  Dodecahedron, 
  CubeCamera, 
  MeshTransmissionMaterial, 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  useEnvironment
} from '@react-three/drei'
// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import './App.css'
import { useControls, Leva } from 'leva'
import { MixOperation } from 'three'

// Demo of using THREE.js in React-Three-Fiber context


// CONFIGS

const cameraDist = 600
const cameraAngle = 15
const partSize = 100
const radius = 250
const colorPalette = [
  '#edc951',
  '#eb6841',
  '#cc2a36',
  '#4f372d',
  '#00a0b0'
]
const cubemapList = [
  'fouriesburg_mountain_midday_2k.hdr',
  'emmarentia_2k.hdr',
  'industrial_sunset_puresky_2k.hdr',
  'studio_small_06_1k.hdr'
]


// CONSTS

const cameraAngleRad = cameraAngle*Math.PI/180
const cameraPos = [cameraDist*Math.cos(cameraAngleRad), cameraDist*Math.sin(cameraAngleRad), 0]


// Elements
  
const MirrorSphere = () => {
  // Central mirror-surfaced sphere
  let mirrorSphereSize = 150
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

const TransmissionGem = (color) => {
  // Clear Dodecahedron
  return (
    // <CubeCamera>
    //   {(texture) => (
        <Dodecahedron args={[0.7071]}>
          <MeshTransmissionMaterial transmission={0.3} roughness={0.5} color={'#cc2a36'}/>
        </Dodecahedron>
    //   )}
    // </CubeCamera>
  )
}

const objTypes = [
  {shape: RoundedBox, args:{}},
  {shape: Cone, args:{args:[0.7071]}},
  {shape: Torus, args:{args:[0.5, 0.3]}},
  {shape: TorusKnot, args:{args:[0.5, 0.2]}},
  {shape: Dodecahedron, args:{args:[0.7071]}},
]

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

const SelectedEnvironment = () => {
  // Environment with GUI selector
  let {cubemap} = useControls({'cubemap': {
    value: 0,
    min: 0,
    max: 3,
    step: 1,
  }})
  let rgbeTexture = useEnvironment({ files:cubemapList[cubemap], path:"../src/assets/cubemaps/" })
  return (
    <>
      <Environment map={rgbeTexture} background/>
    </>
  )
}  

const Scene = () => {
  // Env, obj, camera

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
}

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
