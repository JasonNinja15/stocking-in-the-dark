# Porting Stocking In The Dark to Roblox

A plan for rebuilding the game in Roblox so it looks, sounds and plays the same as the browser version.

## The short version

- **Gameplay** ports one-to-one. The browser game is already host-authoritative: one machine runs the world (`05-sim.js`, `05b-sim2.js`) and everyone else draws snapshots of it. A Roblox server is exactly that host. The simulation becomes server Luau and the drawing code becomes client Luau.
- **Shapes and textures** come across exactly. Every model is built from boxes and cylinders in code, and every texture is drawn on a canvas. We export them from the running browser game rather than rebuilding them by hand.
- **Sound** comes across exactly too, but as recordings. The browser game synthesizes every sound live. Roblox can only play uploaded audio files, so we record each sound out of the game and upload it.
- **The look gets very close but not pixel-exact.** Roblox doesn't allow custom shaders. The black ink outlines, the colour grade and film grain, and the scare distortion all come from one full-screen shader in `07-main.js`. In Roblox, each of those has to be rebuilt from what the engine offers. The table under step 3 says what matches and what is an approximation.

## 1. Project layout

Use Rojo, so the Luau lives in git next to the JS version, and use Studio for the world and assets.

```
roblox/
  default.project.json
  src/
    shared/      Config.luau (constants from 01-core.js), Slots.luau, Bays.luau, Pathfind.luau (the A* grid)
    server/      Sim.luau (05-sim), Sim2.luau (05b-sim2), Monsters/*.luau (one module per monster),
                 Shop.luau, Save.luau, Net.luau (snapshots → attributes/remotes)
    client/      Player.luau (07-main local player), Camera.luau, Hud.luau, Shop.luau, Spectate.luau,
                 Views/*.luau (box, monster, truck, forklift sync), Audio.luau, Post.luau
  assets/        exported meshes, textures, sounds (step 2)
```

The JS splits along the same seam: everything that runs only `if(NET.host)` goes to `server/`, and everything in `07*.js` goes to `client/`.

## 2. Get the assets out of the browser game

Do all of this from a small export page in the repo that loads the game's own model code, so nothing is redrawn by eye.

1. **Meshes.** Build each model with its existing function (`makeWorker`, `makeMimic`, `makeBlind`, `makeHunch`, `makeForklift`, trucks, racks and so on). Export it with three.js `GLTFExporter` to `.glb`, then bring that into Studio with the 3D Importer. The importer keeps the part hierarchy, so the pivots the animations use (`legs`, `arms`, `head`, `limbs[].sh/.el`) arrive as named MeshParts. They are the same pivots in the same places.
2. **The static warehouse.** Export the merged statics (the output of `flushStatics`) the same way. Then turn the collision boxes in `COL` into invisible, anchored, `CanCollide` parts with a short Luau script, so collisions match exactly and don't depend on mesh hulls.
3. **Textures.** Every `ctex(...)` canvas (cardboard, concrete, worn paint, hazard stripes, labels, signs, `TEX.lskin`) saves as a PNG with `canvas.toDataURL`. Upload each one as an image asset and apply it with `SurfaceAppearance` (ColorMap only), or with `Texture` instances on the box faces.
4. **Sounds.** Each `SFX.*` function and each loop (`hum`, `breath`, `whisper`, `growl`, `engine`, `beep` and the rest) is WebAudio graph code. Run each one through an `OfflineAudioContext`, write it out as a WAV, convert it to OGG and upload it. Record the loops 8–12 s long with a crossfade so they loop seamlessly. Make several takes of anything randomised (footsteps, creaks, scare stingers), and pick one at random in Roblox the same way the JS randomises.

## 3. Rendering: matching the look

| Browser technique | Roblox equivalent | How close |
|---|---|---|
| `MeshToonMaterial` with a three-step gradient map | `SmoothPlastic` with no specular, plus a dark `SurfaceAppearance` so lighting falls off hard; set `Lighting.Technology = Future` | Close. Roblox shading is smooth rather than banded, so add a slight banding in the textures and keep ambient very low. |
| Depth-based black ink outlines (post shader) | Inverted-hull outlines: a slightly scaled, back-face-only black copy of each mesh. Roblox can't cull front faces, so make the hull in Blender with flipped normals before import. `Highlight` only for the few things that must outline through walls (the thermal scanner). | Visually the same at the distances the game uses. Fade the outlines with distance, as the shader does, by swapping hull transparency in a client loop. |
| `FogExp2(0x030305, 0.052)` | `Atmosphere` (Density about 0.45, Color and Decay near black) plus `Lighting.FogEnd` about 26 | Close. Tune it side by side with the browser at the same camera position. |
| Flashlight `SpotLight` with shadows | `SpotLight` with `Shadows = true` on a part attached to the camera (Future lighting gives spotlight shadows). Angle 25° normally and 30° with the better flashlight, matching `litByP`. | Matches. |
| Lamp pools, flares, freezer and basement room lights | `PointLight` / `SpotLight`, with the same flicker code driven by `RunService.RenderStepped` | Matches. |
| Colour grade, tone curve, chromatic aberration, grain, vignette | `ColorCorrectionEffect` for the grade and contrast, plus a full-screen `ImageLabel` of animated grain and vignette (a 4-frame sprite sheet) | The grade and vignette match. The chromatic aberration (stronger when hurt or afraid) can't be done properly; fake it with a red/blue offset vignette flash on hits. |
| Fear wobble, hurt and flash overlays | `BlurEffect` pulses, plus `Frame` overlays tweened the same way `ME.hurt` / `ME.flash` decay | Close. |
| Dust motes in the flashlight beam (point shader) | A `ParticleEmitter` in a cone part on the flashlight, `LightEmission` 1, lit only inside the beam | Close. |

Rendering tasks:
- Set the camera FOV to the player's setting (default 75) and use the same eye height as the browser camera. Scale the world at 1 game metre = 3.57 studs (Roblox's standard conversion), and scale the character rig to the worker's height, so doorways, racks and trailers read the same.
- Build a custom first-person rig. Set `CameraType = Scriptable`, keep the default character for physics and replication, and hide it locally. Then add a viewmodel with the flashlight, carried box and jerry can, which the JS draws in `VM`.

## 4. Gameplay code: the port order

Port in this order. After each step something is playable, so it can be compared against the browser version.

1. **Core and world.** Constants, `SLOTS`, `BAYS`, `LAMPS`, the collision grid and `astar`. Plain data, a direct translation.
2. **Players and boxes.** Pick, place, drop and kick, shelves, the carry upgrade, the forklift. Players act through `RemoteEvent`s that carry the same `{a:'pick', b:id}` messages `doAct` sends today, and the server validates them with the same distance checks as `act()`.
3. **Trucks and the shift clock.** `trucksUpdate`, quota and pace radio, overtime, `endNight`, `startNight`.
4. **Monsters, one module per `MON_UPD` entry.** Each `xxxUpdate(m, dt)` becomes `Monster.update(m, dt)` on the server. Their state lives in plain tables on the server, and the client sees the fields in the snapshot (`ty, x, y, z, ry, a, k, v, f, tg`). Replicate that as attributes on one `Folder` per monster, or batch it into one `UnreliableRemoteEvent` at 15 Hz, as the JS host does now. The client keeps the JS `syncMonsters` animation code: lerping, the pose for each `a` state, sounds.
5. **Additions.** Cold storage, conveyor, forklift pallets, basement and elevator, generator and outages, Bay C. Their `ADDG` groups become Models parented to `ServerStorage` and moved into `Workspace` when bought.
6. **Shop, voting, saving.**
   - The shop UI is a `ScreenGui` built from the same `SHOP` / `ADDS` tables.
   - Voting uses the same "more than half" rule as `shopVoteCheck`.
   - **The save moves from `localStorage` to a `DataStore`.** Key it by the host's UserId for private servers, or by a party id from the lobby. Delete it on game over, exactly as `gameOver` does.
7. **Spectating.** The third-person orbit camera from `specTarget` / `camFree`, using `Workspace:Raycast` for the pull-in when a wall is in the way.

Translating the JS to Luau:
- Arrays become 1-based. Keep ids as numbers and look them up in tables keyed by id rather than by position.
- `Math.hypot` becomes `math.sqrt(dx*dx+dz*dz)` (or `Vector3.Magnitude`), and `rand(a,b)` becomes `Random:NextNumber(a,b)`.
- Events (`emit`) become one `RemoteEvent` `"Ev"` that fires the same small tables to all clients or to one. `onEvent2` ports almost line for line.

## 5. Multiplayer differences to plan for

- **Rooms.** Replace PeerJS room codes with a Roblox lobby place that teleports the crew together (`TeleportService:TeleportAsync` with a reserved server), so a crew of up to four lands in one server. Solo play is a reserved server with one player.
- **Difficulty** is chosen in the lobby by the party leader and passed in the teleport data.
- **Movement** uses Roblox's own replication, which is smoother than the 20 Hz `me` messages. The forklift becomes a server-owned `VehicleSeat` model with network ownership given to its driver, as the JS lets the driver's client move it.
- **Hidden tabs.** The browser host keeps running in a worker when the tab is hidden. That concern disappears, because Roblox servers always run.

## 6. Checking it matches

- **Screenshot pairs.** Use the existing `GS.shot()` hook to take reference shots from fixed camera spots: dock, each aisle, freezer, basement, each monster at 3 m and 8 m. Take the same shots in Studio from the same positions, and tune fog, lights and outlines until they line up side by side.
- **Timing tables.** Pull every number that defines feel into `Config.luau` with the same names: walk 3.05, run 5.3, stamina 21/s, every monster's speeds and damages, every timer. Compare them against the JS with a script that greps both, so nothing drifts.
- **Behaviour tests.** The scripted tests used on the browser build (spectator, shredder, blind one, forklift, saves, votes) become TestEZ specs that run in Studio.

## 7. Effort

| Part | Rough size |
|---|---|
| Asset export page and Studio import (meshes, textures, sounds) | 3–4 days |
| Rendering setup and look-matching passes | 4–6 days |
| Core gameplay (steps 1–3) | 5–7 days |
| Thirteen monsters | 6–9 days |
| Additions, items, shop, saves, voting, spectating | 5–7 days |
| Lobby, teleporting, DataStore, polish and the side-by-side checks | 4–6 days |
| **Total** | **about 5–7 weeks for one developer** |

The riskiest part is the look, specifically the outlines and the toon banding. Do a one-week spike first: the dock and one aisle, the worker and the sleeper, flashlight and fog. Compare it with the browser version before committing to the rest.
