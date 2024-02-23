# React-Three-Fiber Demo

## Simplified Branch

I made this branch to focus on the optimizations of LQIP (Low Quality Image Placeholder) and Web Workers to provide a fast and smooth HDRI image loading experience for the skybox and cubemaps.

To run yourself, use the following:
```
npm install
npm run dev
```

Here is this difference between low and high resolution scenes
![](https://github.com/dansh0/react-three-fiber-demo/blob/simplified/public/lowRes.png)

![](https://github.com/dansh0/react-three-fiber-demo/blob/simplified/public/highRes.png)


## Main Branch README

Wanted to try some things out with R3F and drei

![](https://github.com/dansh0/react-three-fiber-demo/blob/main/public/screenshot.png)

Overall I'm not rushing to leave vanilla javascript for my three.js work, but I am impressed with the drei library particularly. R3F and drei are clearly trying to streamline the development time for new three.js programs. This is clear in how little code is needed to achieve this demo.

Cubemaps from Poly Haven

Links:
- [react-three-fiber](https://github.com/pmndrs/react-three-fiber)
- [drei](https://github.com/pmndrs/drei)
- [polyhaven](https://polyhaven.com/hdris)

## Live Demo

Run this code here:

[LIVE DEMO](https://shores.design/index.php/react-three-fiber-demo/)

## Optimizations

### Preview Cubemap Loading

I returned to this code to optimize a few aspects of it. The original cubemaps were slow to load, considering they were 2k cubemap files at around 6Mb each. I changed these to 1k but I also wanted a cleaner user experience. To do this I added a loading screen while the lower resolution 1k cubemap HDRIs loaded, display the 1k variants, then load the 2k (or 4k!) higher resolution textures. This means that when the demo is interactable, all files will be properly loaded, and it should be quicker for slower internet.

### Web Worker for Cubemap Loading

Another improvement to the cubemap HDRI loading is to offload the work to a web worker, simply a different thread that can interact with the main one. The worker is only told what .hdr file to load and it is completed in the separate thread. Once completed, a message containing the serialized data can be returned to the main thread to place in the cubeMapTextures state array. This prevents stuttering and freezing during loading, giving the user a cleaner experience with the demo
