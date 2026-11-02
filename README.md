# Stocking In The Dark

A first-person, cel-shaded horror game for one to four players. You work the night shift at Dock 13: unload trucks, stack boxes on the shelves, and make quota before 6:00 AM. Something else works here too.

**Play:** https://jasonninja15.github.io/stocking-in-the-dark/ (or open `stocking-in-the-dark.html` in Chrome, Edge or Firefox). It needs an internet connection the first time, for Three.js, fonts and the multiplayer library.

## Difficulty

Pick **Easy**, **Normal** or **Hard** on the title screen. In a crew, the host's choice applies to everyone, and the lobby shows it.

| | Easy | Normal | Hard |
|---|---|---|---|
| Quota | 70% | 100% | 130% |
| Monster damage | 60% | 100% | 135% |
| Bad luck (sleepers, crawlers, mimics, outages, jams, lamp failures, stalker visits, elevator stalls, shelf mouths, the driver, the wrong voice) | about half as often | as listed below | about 1.5 times as often |

Things that end your shift outright (the sleeper reaching you, the night manager's third write-up) do so on every difficulty.

## The job

- Trucks back into **Bay A** and **Bay B** (and **Bay C**, once it's bought) every minute or so. Walk into the trailer, pick up boxes (**E**) and shelve them on any empty slot. A green outline shows where the box will go.
- Shelve the quota before 6:00 AM (the clock moves one minute per real second, so an in-game hour is 60 seconds). On Normal, night 1 asks for 15 boxes and each night adds 5. Crews get a bigger quota.
- The bar under the quota shows your progress, and its white marker shows where you should be by now. It turns amber, then red, as you fall behind. The supervisor radios at 3, 4 and 5 AM if you're behind pace, and the loudspeaker announces the final hour and the last truck of the night.
- Short at 6:00 AM? You get **60 seconds of overtime**. Every light goes out, the monsters get bolder, and a last truck comes in if there's nothing left to unload. Make quota and you survive the night. Miss it and you're fired.
- A truck leaves when it's empty or after about two minutes. Any boxes still on board are lost.
- Your flashlight battery runs down. Hold **E** at the charging dock between the bays. The first-aid cabinet next to it heals you fully, twice a night.
- **Power outages.** From night 3 the mains can fail at a random moment, and once they do they stay dead until morning: every lamp goes out and the charger works ten times slower. Only a fuelled generator keeps the lights and the charger going.
- Everything the crew buys is listed on the **THIS WAY** board on the dock wall in front of where you start, with an arrow to each. Their signs are backlit so you can spot them across the building, and the first night after a purchase you're told what it's for and where it is.

## What's in the building

| Threat | Where | Tells | What to do |
|---|---|---|---|
| **Mimic** | Inside a box | Keeps still until you're close, then twitches and scratches | **Q** kick suspicious boxes before you lift them. Pick one up and it bites (about 30 damage). Kicking a *fragile* box breaks it. A mimic that's been found out hides as a box again on the floor or a shelf, scrambles somewhere new when you get close, and bites if you grab it. Click your flashlight off and on at it and it leaves for good. |
| **The sleeper** | Asleep behind the blankets at the back of some trailers | Manifest says *scale reads more than the cargo weight*, claw marks on the trailer's front wall, slow breathing. No glowing eyes: in the dark you won't see it | Reach the back of the trailer and it silently sits up. Light on it makes it growl, the whole time. Keep the light on it for three seconds and it charges. In the dark it only moves while nobody is looking at it. If it reaches you, your shift is over. Use the panel beside the bay door to refuse the delivery. |
| **The crawler** | Inside some trailers | Weight mismatch; a high, wavering voice when the door opens | It climbs the wall, then wanders the ceiling in silence. Get within about 9 m and it comes for you. Shine your light up at it and it flees to the far side of the building, then goes back to wandering. If it gets right above you, it holds still for a moment, then drops (about 45 damage). It crawls back into its truck before the truck leaves. |
| **The stalker** | The dark aisles | Whispering, heartbeat, your flashlight stutters | It moves only when no light is on it. Catch it in your beam and it shrieks and vanishes. It can't enter a working lamp's light, or a burning flare's, but it can put a lamp out if you hide under it too long. |

### Later nights

| Threat | From | What it does | What to do |
|---|---|---|---|
| **The night manager** | Night 3 | A tall man in a grey suit who walks the aisles reading a clipboard, shoes clicking. Stand idle and empty-handed in front of him for 3 seconds and he writes you up ($10 off the crew's pay). | Keep busy. On the third write-up he lowers the clipboard and walks after you, slightly slower than you walk. Keep moving for 25 seconds and he gives up. |
| **The shrink-wrap** | Night 4 | A person wrapped in pallet film, standing among the wrapped pallets in the south-east. It's blind and hunts sound: running, kicking, dropping boxes, the forklift, a loaded carry-upgrade stack, the air horn. | Walk, don't run, and don't bump into it (about 50 damage). It gives up and goes home after 18 quiet seconds. |
| **The driver** | Night 5 | Sometimes a trucker climbs out of a cab. He looks like a crewmate (in a crew he even wears one of their names), his torch never flickers and he makes no footsteps. Within 8 m he follows you. | Keep your distance (about 70 damage). An air horn or the strobe stuns him. The thermal scanner shows him cold. |
| **Shelf mouths** | Night 5 | Two empty lower slots a night are mouths. The deck sags and there are teeth under it that only show in your light. | Shine your light on a slot before you shelve into it. A box put in a mouth is lost, and so is 25 health. |
| **The wrong voice** | Night 2 / 6 | From night 2 the loudspeaker sometimes calls out a priority parcel somewhere dark (double pay). From night 6, half of those calls use a chime played upside down and out of tune and a voice too slow and low. | There's no parcel at a wrong-voice location, only a stalker waiting in the dark. |
| **The thing in the yard** | Night 7, and every overtime | When a truck leaves, its bay door jams open for 14 seconds. Something enormous stands out in the fog. Each time you stare at it, it steps closer. | Don't look out of an open bay. Close the door at its panel, or with the bay door remote. On the fourth look it reaches in (80 damage). |

## Between nights: the shop

After each night you survive, the crew's pay buys things. The money is shared, and anyone can spend it. In a crew game the host starts the next night (or it starts by itself after 150 seconds).

**Warehouse additions.** Each one adds boxes to the quota and time to the shift (the shift starts earlier than midnight), and something lives in each one.

| Addition | Price | Quota | Time | The work | What lives there |
|---|---|---|---|---|---|
| Cold Storage | $250 | +6 | +45 s | A freezer room in the north-east corner, under a pulsing blue light. Trucks bring extra frozen crates (pale blue), never more than its 15 shelves have room for. Get each one onto a freezer shelf within 60 s of picking it up, or it spoils; the prompt points you to the freezer. E opens the door; from inside, just walk up to it. It swings shut after a few seconds unless a box is left in the doorway. | Three frost figures, hidden behind stacks of frozen stock. They move only while the door is shut and no light is on them. One grab (30 damage) and they all go back to their corners. |
| Sorting Conveyor | $300 | +8 | +45 s | About four parcels a minute ride the belt along the south wall, each worth a box. Set the lever (E) to the colour of the parcel at the end and it drops into its bin. Nothing is lost while you're busy elsewhere: parcels wait at the end until the lever matches. Sometimes it jams: hold E on the red button by the bins. | Hands come out of the bins for anyone within reach for 2.5 s (20 damage). Some parcels are mimics: kick them off the belt. |
| Repaired Forklift | $350 | +8 | +45 s | Parked by the dock, just east of where you start. E to climb in, W/S to drive, A/D to steer. Three pallets of **eight** boxes a night come in trucks, just inside the door. E lifts one, E sets it on any top shelf (8 boxes shelved in one trip), G puts it down, Q gets out. | Its engine draws the stalker and the shrink-wrap. Sometimes a passenger sits on the forks. Light on it for 3 s and it's gone. Leave it dark for 7 s and it lunges (40 damage). |
| Basement Returns | $400 | +6 | +60 s | Ten damaged returns wait in a cage downstairs. Ride the freight elevator (west wall) down and bring them up to the shelves. | Sometimes the elevator stops halfway and something walks on its roof (only when someone in the car has a working flashlight). Shine your light up at the hatch for 2.5 s and it moves again; a meter in the middle of the screen shows how long. After 18 s the hatch opens (45 damage), but you can't run from a stopped car, so it never takes you below 12 health. |
| Generator Room | $300 | 0 | +40 s | Backup power (see power outages). It burns fuel only during an outage; a full tank lasts two minutes, and each jerry can from the rack by the office adds half a tank. It also stops lamps flickering out on their own. | Moths circle the lamps and break bulbs after 14 s. Shine your light on one and it follows the beam. Lead it 7 m from its lamp and it loses interest. They also circle flares instead. |
| Bay C | $500 | +10 | +60 s | A third dock in the north-west corner for refrigerated trailers. | The sleepers in those trailers are colder: they creep faster, but light halves the speed of their charge. |

**Equipment (yours).**

| Item | Price | Key | What it does |
|---|---|---|---|
| Better flashlight | $150 | | Brighter and wider. Monsters notice it from farther away. The battery lasts twice as long. |
| Spare batteries (2) | $20 | 1 | A full charge anywhere. |
| Flares (2) | $25 | 2 | 35 s of red light on the floor. The stalker and the sleeper won't cross it, the crawler won't hang over it, and moths circle it. |
| Box cutter | $60 | 3 | Cut into the box or parcel you're looking at. Kills a mimic for good; ruins a real box. |
| Strobe (3) | $70 | 4 | Stops a charging sleeper, scatters the crawler, drives off mimics, moths and the passenger, stuns the driver, kills a stalker in its cone. |
| Thermal scanner | $120 | hold 5 | Warm things glow through walls within 15 m: sleepers, crawlers, mimics, the passenger, your crew. The driver, the frost figures and the shrink-wrap stay dark. |
| Air horn (3) | $40 | 6 | Lures the shrink-wrap to the sound and stuns the driver. |
| Energy drinks (2) | $15 | 7 | 20 s of running without getting tired. |
| Stamina upgrade | $90 | | Sprint half again as long (drains at two-thirds the rate) and recover 50% faster. |
| Bay door remote | $90 | 8 | Slams the nearest bay shut: a docked truck leaves at once, its crawler is shut out for good, and a jammed door closes. It won't fire while anyone is inside that trailer. |
| Lamp bulb | $50 | 9 | Stand under a dead fixture to bring it back for the rest of the run. Three fixtures at most. |
| Carry Upgrade | $110 | | Carry up to three boxes at once. Crewmates see the whole stack. Slower, and loud enough for the shrink-wrap to hear. |
| Red headlamp | $80 | H | A dim red light that monsters don't notice: it doesn't scare them off and doesn't set them off. |
| First-aid refill | $30 | | One more first-aid use next night (two at most). |

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
| 1 to 9 | Use an item (hold 5 for the thermal scanner) |
| H | Red headlamp on/off |
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
- `src/`: the source. `shell.html` holds the page and UI; `01-core.js` to `07b-client2.js` hold the game (renderer and textures, world, models, audio, simulation, networking, client). The `b` files hold the additions, the shop, the later-night monsters and the items.
- `build.sh`: rebuilds `stocking-in-the-dark.html` from `src/`, plus a copy as `index.html` for GitHub Pages.
- `tools/serve.ps1`: a tiny local web server for testing (`powershell -File tools/serve.ps1`, then open http://localhost:8137).
