import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

// global loader
const loader = new RGBELoader()

onmessage = (message) => {
    let fileName = message.data

    loader.load(fileName, hdrMap => {
        postMessage([hdrMap.source.data.data.buffer, hdrMap.source.data.width, hdrMap.source.data.height])
    })
}   
