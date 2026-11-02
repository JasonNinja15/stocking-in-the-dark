# Stocking In The Dark

A first-person, cel-shaded horror game for one to four players. You work the night shift at Dock 13: unload trucks, stack boxes on the shelves, and make quota before 6:00 AM. Something else works here too.

**Play:** https://jasonninja15.github.io/stocking-in-the-dark/ (or open `stocking-in-the-dark.html` in Chrome, Edge or Firefox). It needs an internet connection the first time, for Three.js, fonts and the multiplayer library.

## The job

- Trucks back into **Bay A** and **Bay B** every minute or so. Walk into the trailer, pick up boxes (**E**) and shelve them on any empty slot. A green outline shows where the box will go.
- Shelve the quota before 6:00 AM (each in-game hour is 50 seconds). Night 1 asks for 15 boxes and each night adds 5. Crews get a bigger quota.
- The bar under the quota shows your progress, and its white marker shows where you should be by now. It turns amber, then red, as you fall behind. The supervisor radios at 3, 4 and 5 AM if you're behind pace, and the loudspeaker announces the final hour and the last truck of the night.
- Short at 6:00 AM? You get **60 seconds of overtime**. Every light goes out, the monsters get bolder, and a last truck comes in if there's nothing left to unload. Make quota and you survive the night. Miss it and you're fired.
- A truck leaves when it's empty or after about two minutes. Any boxes still on board are lost.
- Your flashlight battery runs down. Hold **E** at the charging dock between the bays. The first-aid cabinet next to it heals you fully, twice a night.

## What's in the building

| Threat | Where | Tells | What to do |
|---|---|---|---|
| **Mimic** | Inside a box | Twitches, scratching sounds, twitches more under your light | **Q** kick suspicious boxes before you lift them. A kicked mimic runs off harmlessly. Pick one up and it bites (about 30 damage). Kicking a *fragile* box breaks it. |
| **The thing in the trailer** | Behind the blankets at the back of some trucks | Manifest says *scale reads more than the cargo weight*, claw marks on the trailer's front wall, breathing, two pairs of eye glints | It wakes when you go deep or take half the load. It freezes while your light is on it and backs off if you hold the light there. If it reaches you, your shift is over. Use the panel beside the bay door to refuse the delivery. |
| **The stalker** | The dark aisles | Whispering, heartbeat, your flashlight stutters | It moves only when no light is on it. Catch it in your beam and it shrieks and vanishes. It can't enter a working lamp's light, but it can put a lamp out if you hide under it too long. |

## Controls

| Key | Action |
|---|---|
| W A S D | Move |
| Shift | Run (uses stamina) |
| Mouse | Look |
| E / left click | Pick up, shelve, use. Hold at the charger. |
| Q / right click | Kick |
| G | Set the box down |
| F | Flashlight on/off |
| Esc | Pause (solo) / menu (crew) |

## Playing with a crew

1. One player presses **Host a Crew** and shares the five-character code.
2. Everyone else types the code and presses **Join Crew**. Up to four players.
3. The host presses **Start the shift**. People can also join a shift already in progress.

Players connect browser-to-browser over WebRTC, using the free public PeerJS server to find each other. The host's browser runs the world. If the host leaves, the room closes. It keeps running while the host's tab is in the background. If you go down, you watch your crew until the night ends, then you're back on shift.

## Settings

Mouse sensitivity, volume, field of view, graphics quality (Low turns off shadows and lowers render resolution for older laptops and Chromebooks), and an FPS counter.

## Files

- `stocking-in-the-dark.html`: the whole game in one file. This is what you play or upload.
- `src/`: the source. `shell.html` holds the page and UI; `01-core.js` to `07-main.js` hold the game (renderer and textures, world, models, audio, simulation, networking, client).
- `build.sh`: rebuilds `stocking-in-the-dark.html` from `src/`, plus a copy as `index.html` for GitHub Pages.
- `tools/serve.ps1`: a tiny local web server for testing (`powershell -File tools/serve.ps1`, then open http://localhost:8137).
