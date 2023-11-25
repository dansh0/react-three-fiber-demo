import React, { useRef, useState, createElement } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Sphere, Cone, Torus, TorusKnot, Dodecahedron, OrthographicCamera, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import './App.css'

// CONFIGS
const cameraDist = 500
const colorPalette = [
  '#edc951',
  '#eb6841',
  '#cc2a36',
  '#4f372d',
  '#00a0b0'
]
const objTypes = [
  {shape: RoundedBox, args:{}},
  {shape: Sphere, args:{args:[0.7071]}},
  {shape: Dodecahedron, args:{args:[0.7071]}},
  {shape: Torus, args:{args:[0.5, 0.3]}},
  {shape: TorusKnot, args:{args:[0.5, 0.2]}},
]
const radius = 200

// CONSTS
const thetaRad = (90-35.264)*Math.PI/180
const cameraPos = [cameraDist*Math.sin(thetaRad)*Math.cos(Math.PI/4),cameraDist*Math.cos(thetaRad),cameraDist*Math.sin(thetaRad)*Math.sin(Math.PI/4)]

const Material = ({color}) => {
  // material for objs
  return (
    <meshStandardMaterial 
      color={color} 
      transparent={true} 
      opacity={1.0}/>
  )
}

const Item = ({index, thetaStart, size, color }) => {
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
    <mesh position={position} ref={ref} scale={[100,100,100]}>
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
      <directionalLight intensity={1.0} position={[0,1000,0]}/>
      <ambientLight intensity={0.2}/>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-100,0]}>
        <planeGeometry args={[10000,10000]}/>
        <meshBasicMaterial color={'#222222'}/>
      </mesh>
      {objTypes.map((shape, count) =>
        createElement(Item, {index:count, thetaStart:count*2*Math.PI/objTypes.length})
      )}
      <OrbitControls/>
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
