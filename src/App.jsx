import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { CameraControls, AccumulativeShadows, RandomizedLight, PresentationControls, Grid, RoundedBox } from '@react-three/drei'
import './App.css'

const radius = 2.0
const Cube = ({thetaStart, size, color }) => {
  const ref = useRef()
  let theta = thetaStart
  let position = [radius*Math.cos(theta), 1, radius*Math.sin(theta)]
  let rotX = 2 + Math.random()*5
  let rotY = 2 + Math.random()*5
  useFrame((state, delta) => {
    ref.current.rotation.x += delta/rotX
    ref.current.rotation.y += delta/rotY
    theta += delta/5
    ref.current.position.x = radius*Math.cos(theta)
    ref.current.position.z = radius*Math.sin(theta)
  })

  return (
    <mesh position={position} ref={ref} scale={size}>
      <RoundedBox castShadow >
        <meshPhysicalMaterial color={color}/>
      </RoundedBox>
    </mesh>
  )
}

const Floor = () => {
  return (
    <mesh scale={[1000,1000,1000]} rotation={[-Math.PI/2, 0, 0]}>
      <planeGeometry/>
      <meshStandardMaterial color={"white"}/>
    </mesh>
  )
}


const App = () => {
  return (
    <>
      <Canvas shadows style={{ background: "darkgrey" }} camera={{ position: [5, 0, 5], fov: 35 }}>
        {/* <Stage intensity={0.5} preset="rembrandt" shadows={{ type: 'accumulative', color: 'darkgrey', colorBlend: 2, opacity: 1 }} adjustCamera={1} environment="city"> */}
        <directionalLight position={[0,3,3]} castShadow={true}/>
        <ambientLight intensity={[0.2]} />
        {/* <fog/> */}
        {/* <Floor receiveShadow/>/ */}
        {/* <Grid/> */}
        {/* <PresentationControls> */}
        <Cube castShadow thetaStart={0} size={[1,1,1]} color={"Orange"} />
        <Cube castShadow thetaStart={Math.PI/3*1} size={[1,1,1]} color={"Red"} />
        <Cube castShadow thetaStart={Math.PI/3*2} size={[1,1,1]} color={"Blue"} />
        <Cube castShadow thetaStart={Math.PI/3*3} size={[1,1,1]} color={"Green"} />
        <Cube castShadow thetaStart={Math.PI/3*4} size={[1,1,1]} color={"Purple"} />
        <Cube castShadow thetaStart={Math.PI/3*5} size={[1,1,1]} color={"Grey"} />
        {/* </PresentationControls> */}
        {/* <AccumulativeShadows temporal frames={100} color="grey" colorBlend={2} toneMapped={true} alphaTest={0.75} opacity={2} scale={12}>
          <RandomizedLight intensity={Math.PI} amount={8} radius={4} ambient={0.5} position={[5, 5, -10]} bias={0.001} />
        </AccumulativeShadows> */}
        <CameraControls makeDefault/>
      </Canvas>
    </>
  )
}

export default App
