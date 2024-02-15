# React-Three-Fiber Demo

Wanted to try some things out with R3F and drei

![](https://github.com/dansh0/react-three-fiber-demo/blob/main/public/screenshot.png)

Overall I'm not rushing to leave vanilla javascript for my three.js work, but I am impressed with the drei library particularly. R3F and drei are clearly trying to streamline the development time for new three.js programs. This is clear in how little code is needed to achieve this demo.

Cubemaps from Poly Haven

Links:
- [react-three-fiber](https://github.com/pmndrs/react-three-fiber)
- [drei](https://github.com/pmndrs/drei)
- [polyhaven](https://polyhaven.com/hdris)

### Optimizations

I returned to this code to optimize a few aspects of it. The original cubemaps were slow to load, considering they were 2k cubemap files at around 6Mb each. I changed these to 1k but I also wanted a cleaner user experience. To do this I added a loading screen, and allowed for high-resolution (2k) files to be used with a click and additional load wait. This means that when the demo is interactable, all files will be properly loaded, and it should be quicker for slower internet.