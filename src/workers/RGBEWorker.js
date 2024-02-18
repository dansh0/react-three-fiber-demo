import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

// global loader
const loader = new RGBELoader()

onmessage = (message) => {
    let fileName = message.data

    loader.load(fileName, hdrMap => {
        postMessage(['hdrData', hdrMap.source.data.data.buffer, hdrMap.source.data.width, hdrMap.source.data.height])
    }, progress => {
        postMessage(['progress', progress.loaded/progress.total])
    }, error => {
        postMessage(['error', error])
    })
}   
