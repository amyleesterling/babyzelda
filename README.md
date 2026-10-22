# Baby Zelda

A gentle, original unicorn quest adventure for little explorers, inspired by the joy of exploring Zelda. No enemies, timers, losing, purchases, or accounts.

**Play:** https://amyleesterling.github.io/babyzelda/

Help Clover with a carrot picnic, repair the rainbow bridge, find fireflies for Doodle the dragon, and collect the kindness crown. Then keep exploring.

## Controls

- Arrow keys or WASD to move; Space or E to talk/use magic.
- Tap or click the grass to walk there. Crossing the river automatically routes through the repaired bridge.
- On-screen direction buttons and a large Magic button work on touch screens.
- The music-note button toggles spoken hints and chimes. The hint’s note button repeats the current instruction.
- Grown-up settings offer sparkle colors and a confirmed progress reset.

Progress saves automatically in this browser on this device. Speech uses the browser’s available English voice; voice availability varies by browser/device. The game remains playable with sound off.

## Local development and tests

No build or installation is required. Serve this folder with a static HTTP server:

```sh
python -m http.server 4174 --bind 127.0.0.1
node --check game.mjs
node --test tests/*.test.mjs
```

**Always use `http://127.0.0.1:4174/?silent=1` for automated/browser tests.** This mode blocks both speech and audio synthesis, including the repeat-hint button. Do not test speech audibly on Amy’s computer.

The GitHub Actions workflow tests and publishes the game to GitHub Pages on pushes to `main`. Set Pages’ build source to GitHub Actions. Only game files and assets are deployed.

## Artwork

The player is Coco’s original rainbow unicorn from [Coco’s Pooping Unicorn](https://github.com/amyleesterling/cocos-pooping-unicorn-game), reused with Amy’s permission. `assets/coco-unicorn.png` is a lightweight transparent sprite atlas with one idle and four walking poses, rendered from `assets/coco-unicorn.glb` using that project’s rig. The full 20 MB 3D model and Three.js are not downloaded during gameplay. The woodland world and friends are drawn locally with Canvas; there are no external asset requests or analytics.

This is a family-made original adventure, unaffiliated with Nintendo.
