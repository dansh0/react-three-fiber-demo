import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import './App.css'

function App() {
  return (
    <>
      <Canvas>
        <mesh>
          <boxGeometry/>
          <meshBasicMaterial/>
        </mesh>
      </Canvas>
    </>
  )
}

export default App
