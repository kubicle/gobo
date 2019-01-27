# gobo
## 0.7.0
- New API getMarkAt, getLabelAt, getStyleAt.
- New marks: triangles "A" and "V", and cross "X"
## 0.6.0
- New API changeLook and more rendering options.
## 0.5.1
- Fix: in rare cases (long inaction in browser?) main canvas had its context / text alignment reset.
## 0.5.0
- New method resize (call render again to get new image).
- Background & stone patterns use pixelRatio too (faster prepare + coherent look).
## 0.4.2
- patternSeed is used for patterns and colors so color is independent from board size.
## 0.4.1
- Ignores "pixelRatio" < 1 (pass a smaller withPx if you wanted a smaller canvas).
## 0.4.0
- Minimized "gobo.js" attaches to window.gobo (not "window.h") by default
- New option "patternSeed". Redraw using same seed gives same rendering.
- New option "pixelRatio". Pass window.devicePixelRatio if > 1.
- Fix: mark's line width now proportional to stone size.
- Brand new Tests & Samples page
