import React, { useRef, useState, createElement } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  RoundedBox, 
  Sphere, 
  Torus, 
  TorusKnot, 
  Dodecahedron, 
  CubeCamera, 
  MeshTransmissionMaterial, 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Box,
  MeshReflectorMaterial
} from '@react-three/drei'
// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import './App.css'
import { BackSide } from 'three'

// CONFIGS
const cameraDist = 600
const cameraAngle = 15
const partSize = 100
const colorPalette = [
  '#edc951',
  '#eb6841',
  '#cc2a36',
  '#4f372d',
  '#00a0b0'
]
const radius = 250

// CONSTS
// const thetaRad = (90-35.264)*Math.PI/180
// const cameraPos = [cameraRadius*Math.sin(thetaRad)*Math.cos(Math.PI/4),cameraRadius*Math.cos(thetaRad),cameraRadius*Math.sin(thetaRad)*Math.sin(Math.PI/4)]
// const cameraRadius = cameraDist/2
const cameraAngleRad = cameraAngle*Math.PI/180
const cameraPos = [cameraDist*Math.cos(cameraAngleRad), cameraDist*Math.sin(cameraAngleRad), 0]
const cubemapList = [
  'emmarentia_2k.hdr',
  'fouriesburg_mountain_midday_2k.hdr',
  'industrial_sunset_puresky_2k.hdr',
  'studio_small_06_1k.hdr'
]

const Material = ({color}) => {
  // material for objs
  return (
    <meshStandardMaterial 
    color={color} 
    transparent={true} 
    opacity={1.0}/>
    // <MeshTransmissionMaterial color={color}/>
    )
  }
  
const MirrorSphere = () => {
  let mirrorSphereSize = 150
  return (
    <CubeCamera>
      {(texture) => (
        <mesh scale={[mirrorSphereSize,mirrorSphereSize,mirrorSphereSize]}>
          <sphereGeometry args={[0.7071]}/>
          <meshStandardMaterial envMap={texture} roughness={0.05} metalness={1}/>
        </mesh>
      )}
    </CubeCamera>
  )
}

const TransmissionGem = (color) => {
  return (
    <CubeCamera>
      {(texture) => (
        <Dodecahedron args={[0.7071]}>
          <MeshTransmissionMaterial transmission={0.3} background={texture} roughness={0.5} color={'#cc2a36'}/>
        </Dodecahedron>
      )}
    </CubeCamera>
  )
}

const objTypes = [
  {shape: RoundedBox, args:{}},
  {shape: Sphere, args:{args:[0.7071]}},
  // {shape: MirrorSphere, args:{}},
  // {shape: Dodecahedron, args:{args:[0.7071]}},
  {shape: TransmissionGem, args:{}},
  {shape: Torus, args:{args:[0.5, 0.3]}},
  {shape: TorusKnot, args:{args:[0.5, 0.2]}},
]

const Item = ({index, thetaStart }) => {
  // one of many shape objs
  const ref = useRef()
  let theta = thetaStart
  let position = [radius*Math.cos(theta), 0, radius*Math.sin(theta)]
  let rotX = 2 + Math.random()*5
  let rotY = 2 + Math.random()*5

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

const Scene = () => {
  return (
    <>
      <directionalLight intensity={1.5} position={[750,1000,500]}/>
      <ambientLight intensity={0.7}/>
      <Environment files={cubemapList[1]} path="../src/assets/cubemaps/" background/>
      {objTypes.map((shape, count) =>
        createElement(Item, {index:count, thetaStart:count*2*Math.PI/objTypes.length})
      )}
      <MirrorSphere/>
      {/* <CubeCamera position={[0,-150,0]}>
        {(texture) => (
          <Box args={[750,50,750]} position={[0,-150,0]}>
            <meshStandardMaterial envMap={texture} roughness={0.00} metalness={1}/>
          </Box>
        )}
      </CubeCamera> */}
      {/* <Box args={[750,50,750]} position={[0,-150,0]}> */}
      <mesh position={[0,-125,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[1000,1000]}/>
        <MeshReflectorMaterial
            blur={[1000,1000]}
            resolution={1024}
            mixBlur={0.8}
            mixStrength={1}
            roughness={0.6}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#333333"
            metalness={0.5}
          />
      </mesh>  
      
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
      <Canvas style={{ background: "#222222" }}>
        <Scene/>
      </Canvas>
    </>
  )
}

export default App
