# Stocking In The Dark

A first-person, cel-shaded horror game for one to ten players. You work the night shift at Dock 13: unload trucks, stack boxes on the shelves, and make quota before 6:00 AM. Something else works here too.

**Play:** https://jasonninja15.github.io/stocking-in-the-dark/ (or open `stocking-in-the-dark.html` in Chrome, Edge or Firefox). It needs an internet connection the first time, for Three.js, fonts and the multiplayer library.

## Difficulty

Pick **Easy**, **Normal** or **Hard** on the title screen. In a crew, the host's choice applies to everyone, and the lobby shows it.

| | Easy | Normal | Hard |
|---|---|---|---|
| Quota | 70% | 100% | 130% |
| Monster damage | 60% | 100% | 135% |
| Bad luck (sleepers, crawlers, mimics, outages, jams, lamp failures, stalker visits, elevator stalls, the driver, the wrong voice) | about half as often | as listed below | about 1.5 times as often |

Things that end your shift outright (the sleeper reaching you, the night manager's third write-up) do so on every difficulty.

## The job

- Trucks back into **Bay A** and **Bay B** (and **Bay C**, once it's bought) every minute or so. Walk into the trailer, pick up boxes (**E**) and shelve them on any empty slot. A green outline shows where the box will go.
- Shelve the quota before 6:00 AM (the clock moves one minute per real second, so an in-game hour is 60 seconds). On Normal, night 1 asks for 15 boxes and each night adds 5 up to night 5; after that the quota only grows by 2.5 a night, and the monsters carry the difficulty instead: from night 6, bad luck comes 12% more often each night (up to twice as often) and every hit lands 6% harder each night (up to 60% harder). Crews get a bigger quota.
- The bar under the quota shows your progress, and its white marker shows where you should be by now. It turns amber, then red, as you fall behind. The supervisor radios at 3, 4 and 5 AM if you're behind pace, and the loudspeaker announces the final hour and the last truck of the night.
- Short at 6:00 AM? You get **60 seconds of overtime**. Every light goes out, the monsters get bolder, and a last truck comes in if there's nothing left to unload. Make quota and you survive the night. Miss it and you're fired.
- A truck leaves when it's empty or after about two minutes. Any boxes still on board are lost.
- Your flashlight battery runs down. Hold **E** at the charging dock between the bays. The first-aid cabinet next to it heals you fully, twice a night.
- **Power outages.** From night 3 the mains can fail at a random moment, and once they do they stay dead until morning: every lamp goes out and the charger works ten times slower. Only a fuelled generator keeps the lights and the charger going. Whenever the building is dark during an outage, the blind one is out (see below). A running generator undoes all of it: while it has fuel the lamps stay on, the charger works normally and the blind one fades away. If the tank runs dry, the dark and the blind one come back.
- Everything the crew buys is listed on the **THIS WAY** board on the dock wall in front of where you start, with an arrow to each. Their signs are backlit so you can spot them across the building, and the first night after a purchase you're told what it's for and where it is.

## What's in the building

| Threat | Where | Tells | What to do |
|---|---|---|---|
| **Mimic** | Inside a box | Keeps still until you're close, then twitches and scratches | **Q** kick suspicious boxes before you lift them. Pick one up and it bites (about 30 damage). Kicking a *fragile* box breaks it. A mimic that's been found out hides as a box again on the floor or a shelf, scrambles somewhere new when you get close, and bites if you grab it. Click your flashlight off and on at it and it leaves for good. The box cutter (3) kills one in a box, or loose within reach. |
| **The sleeper** | Asleep behind the blankets at the back of some trailers | Manifest says *scale reads more than the cargo weight*, claw marks on the trailer's front wall, slow breathing. No glowing eyes: in the dark you won't see it | Reach the back of the trailer and it silently sits up. Light on it makes it growl, the whole time. Keep the light on it for three seconds and it charges. In the dark it only moves while nobody is looking at it. If it reaches you, your shift is over. Use the panel beside the bay door to refuse the delivery. |
| **The crawler** | Inside some trailers | Weight mismatch; a high, wavering voice when the door opens | It climbs the wall, then wanders the ceiling in silence. Get within about 9 m and it comes for you. Shine your light up at it and it flees to the far side of the building, then goes back to wandering. If it gets right above you, it holds still for a moment, then drops (about 45 damage). It crawls back into its truck before the truck leaves. |
| **The stalker** | The dark aisles | Whispering, heartbeat, your flashlight stutters | It moves only when no light is on it. Catch it in your beam and it shrieks and vanishes. It can't enter a working lamp's light, or a burning flare's, but it can put a lamp out if you hide under it too long. |

### Later nights

| Threat | From | What it does | What to do |
|---|---|---|---|
| **The night manager** | Night 3 | A tall man in a grey suit who walks the aisles reading a clipboard, shoes clicking. Stand idle and empty-handed in front of him for 3 seconds and he writes you up ($10 off your own fund; off the shared pot when you play alone). | Keep busy. On the third write-up he lowers the clipboard and walks after you, slightly slower than you walk. Keep moving for 25 seconds and he gives up. |
| **The shrink-wrap** | Night 4 | A person wrapped in pallet film, standing among the wrapped pallets in the south-east. It's blind and hunts sound: running, kicking, dropping boxes, the forklift, a loaded carry-upgrade stack, the air horn. | Walk, don't run, and don't bump into it (about 50 damage). It gives up and goes home after 18 quiet seconds. |
| **The blind one** | Every power outage | The moment the power fails, something very tall, grey and eyeless steps out of the dark somewhere far from you. It hunts by sound (running, kicking, dropping boxes, the air horn, the shake flashlight), and it feels footsteps: walk within 3 m of it and it knows where you are. Light does nothing to it, but it will not step into lamp light or near a flare. | Stand still when it is close; it gives up and wanders off. Fuel the generator: while it runs, the blind one fades away and stays gone until the tank runs dry. It hits hard (55 damage). |
| **The driver** | Night 5 | Sometimes a trucker climbs out of a cab. He looks like a crewmate (in a crew he even wears one of their names), his torch never flickers and he makes no footsteps. Within 8 m he follows you, at a slow, stiff walk. | Walk away from him (about 35 damage if he reaches you). An air horn or the strobe stuns him. The thermal scanner shows him cold. |
| **The wrong voice** | Night 2 / 6 | From night 2 the loudspeaker sometimes calls out a priority parcel somewhere dark (double pay). From night 6, half of those calls use a chime played upside down and out of tune and a voice too slow and low. | There's no parcel at a wrong-voice location, only a stalker waiting in the dark. |
| **The thing in the yard** | Night 7, and every overtime | Something twenty metres tall, white and starved-thin, that nothing lights but your flashlight, with arms that hang past its knees and a small head tipped to one side. When a truck leaves, its bay door jams open for 14 seconds and it stands out in the fog. Each time you stare at it, it steps closer and stoops lower, until at the fourth step its face is in the doorway and its fingers are round the frame. | Don't look out of an open bay. Close the door at its panel, or with the bay door remote. On the fourth look it lunges up to the doorway and its hand comes in through the door at you (80 damage). It is also out there whenever someone is on the roof (see below). |
| **The long-legged thing** | Night 6, about every other night | Eight long legs round a flat, blackish-purple body with a stubby head, taller than the racks. Sometimes, when a bay door motor sticks open, this climbs in through the door instead of the thing in the yard showing up, crouched low with its legs folded in. It walks straight over the racks (a leg over a rack folds up into its body), and it is completely blind. It hears a long way: running, kicking, dropped boxes and the forklift engine from across a good part of the floor, and the forklift's reverse beeper and the air horn from anywhere in the warehouse. When it hears something it gives a long, very deep call, follows the sound (going round walls it can't step over), and stamps its legs down twice, hurting anyone underneath (about 20 a stamp, 30 right under the body). | Keep quiet near it and walk, don't run. If it's coming, get out from under it. An air horn draws it away. After two minutes it leaves: it crouches into the next truck that pulls out and goes with it. There's no jumpscare. |
| **The auditor** | Night 11, about every other night | A very tall, thin figure in a grey day-shift coat, with a flat slab for a face split by one red scanning line. It walks the aisles pulling boxes back off the shelves to check them. Each box it pulls drops on the floor and comes off the quota until someone shelves it again (shelving the same box a second time pays nothing). Its red scan line reaches 9 m: stand in it for more than a second and it marks you (about 34 damage, more on later nights). | Racks block the scan line, so keep one between you. A strobe sends it away. It leaves by itself after four boxes or about two minutes. |

## The roof

A steel ladder in the south-west corner (where the office used to be) goes up through a hatch to the roof. Up there it is snowing hard and nothing is lit: the storm only thins the view a little, but at night you only see what your flashlight is on. Footsteps crunch, the wind never stops, and frost creeps in at the edges of your sight. You need both hands for the ladder, so set down boxes and jerry cans first.

- **Why go up.** Someone keeps a supply crate at the far (north-east) end of the roof. Once a night, the first person to open it gets a free battery, flare, energy drink, air horn or strobe.
- **The plant room.** In the middle of the roof is a block-walled room, lit by one bulb hanging from the ceiling, with its doorway on the west side facing the hatch. The warehouse's ventilation plant is in there (see *The cold* below). It also fills the middle of the roof, so there is no open spot outside it that is out of reach.
- **What comes.** Stay up there for a few seconds (about 9 on Normal, 6 on Hard) and the thing in the yard walks in out of the storm, from whichever direction nobody up there is looking. Nothing lights it, so you only see it if your flashlight finds it. It walks round the outside of the building only as far as the nearest spot it can reach someone from, leans over the parapet and slowly reaches across the roof, its face peering down. Its hand follows you at walking pace, so keep moving and you can get out from under it. If you're further in than its arm goes, it plants its other hand on the roof and leans right over the building; from there it can reach anywhere outside the plant room. If its hand closes on you, it lifts you up in front of its face, its jaw drops open, and it puts you in its mouth.
- **Getting away.** Climb back down the hatch, get inside the plant room (it can't take anyone in there, and pulls its hand back if you get in), or flash it in the face with the strobe: it snatches its hand back and takes longer to try again. It gives up after a while and walks off into the storm, then comes back later. The game never warns you about it. You hear it, though: its footfalls, its joints creaking, and slow breathing from far overhead.

## The cold

From night 3, every second night (nights 3, 5, 7 and so on), halfway through the shift **The Warehouse Is Getting Cold** comes up in blue. You have **2 minutes** to get up to the plant room on the roof and hold **E** on the ventilation plant for two seconds. Right after the warning a blue line on screen points the way (to the ladder, then to the plant room door) until it is fixed, and the top-right panel counts down. If nobody does, the warehouse goes cold until someone does:

- Everyone loses 1 health a second, wherever they are.
- Frozen crates stop thawing: their timers hold until it warms up.
- The frost figures leave the freezer room and come after anyone in the building (they still can't move while a light is on them). Once the plant is running again they run back to their corners.

The **Warehouse Heater** (shop) adds a night between cold spells: nights 4, 7, 10 and so on instead.

## Between nights: the shop

After each night you survive, the pay buys things. **From night 4, prices rise 12% for every night survived**, and the shared warehouse additions also cost more for bigger crews (whose pay is bigger too). The prices below are the prices for one worker up to night 3. Lost boxes (left on a truck, spoiled, shredded by mistake, cut open) cost nothing; they just don't count toward the quota.

**Team fund and personal funds.** Playing alone, all the pay goes into one pot and you buy anything with it. In a crew, 60% of every payment goes into the **team fund** and the other 40% is split evenly into each worker's own **personal fund**. To make up for the split, a crew pays 60% of the listed price for team equipment and 40% for personal equipment, so things take about as many nights to afford as they would from one shared pot. The shop has two columns. **Team Equipment** (the warehouse additions and the first-aid refills) is paid from the team fund and bought by vote: press **Vote to buy** on a card, and once more than half the crew has voted for it (and the team fund covers it) it is bought. While a vote is open the button turns amber and shows how many have voted and how many are needed; it turns green once you have voted. Press it again to take your vote back. **Personal Equipment** (flashlights, items, upgrades) comes out of your own fund, and you spend it however you like.

When you're finished, press **Done**. Once more than half the crew is done, the next night starts (or it starts by itself after 150 seconds). Press it again to take your vote back.

**Saving.** The run saves after every night you survive, and again after every purchase. **Continue** on the main menu picks it up in the shop, before the next night. In a crew, the host's browser keeps the save: the host presses **Continue the saved run** in the crew room, and everyone gets their own gear back by name. When the run ends (the crew dies, or misses quota), the save is deleted. Starting a new run leaves an older save alone until the new run gets through a night, then replaces it.

**Leftovers.** Boxes left on the floor at 6 AM are still there the next night, and so are mimics: a loose one folds itself back into a box wherever it stopped. Boxes still in someone's arms are set down where they stood. Shelves are emptied by the day shift as before.

**Warehouse additions.** Each one adds boxes to the quota and time to the shift (the shift starts earlier than midnight), and something lives in each one.

| Addition | Price | Quota | Time | The work | What lives there |
|---|---|---|---|---|---|
| Cold Storage | $250 | +6 | +45 s | A freezer room in the north-east corner, under a pulsing blue light. Trucks bring extra frozen crates (pale blue), never more than its 15 shelves have room for. Get each one onto a freezer shelf within 60 s of picking it up, or it spoils; the prompt points you to the freezer. E opens the door; from inside, just walk up to it. It swings shut after a few seconds unless a box is left in the doorway. | Three frost figures, hidden behind stacks of frozen stock. They move only while the door is shut and no light is on them. One grab (30 damage) and they all go back to their corners. |
| Sorting Conveyor | $300 | +8 | +45 s | About four parcels a minute ride the belt along the south wall, each worth a box. Set the lever (E) to the colour of the parcel at the end and it drops into its bin. Nothing is lost while you're busy elsewhere: parcels wait at the end until the lever matches. Sometimes it jams: hold E on the red button by the bins. | Hands come out of the bins for anyone within reach for 2.5 s (20 damage). |
| Repaired Forklift | $350 | +8 | +45 s | Parked by the dock, just east of where you start. E to climb in, W/S to drive, A/D to steer. Three pallets of **eight** boxes a night come in trucks, just inside the door. E lifts one, E sets it on any top shelf (8 boxes shelved in one trip), G puts it down, Q gets out. With no pallet up, the forks carry up to three loose boxes, like the Carry Upgrade: E loads the box you're looking at, E shelves one on any shelf, G sets one down. Getting out sets any boxes still on the forks down in front of it. | Its engine draws the stalker and the shrink-wrap, and backing up sets off a beeper the long-legged thing hears from anywhere. Sometimes a passenger sits on the forks. Shine your light on it for about a second and it's gone. Leave it dark for 7 s and it lunges (40 damage). |
| Basement Returns | $400 | +6 | +60 s | Ten damaged returns wait in a cage downstairs. Ride the freight elevator (west wall) down and feed them to the shredder by the cage. Returns are for the shredder only: they can't be shelved, and each one shredded counts toward quota ($5). Shredding good stock counts as lost; shredding a mimic kills it. | Something sits in the cage corner, knees up. Stand around down there without handling a box (7 s; you get a warning partway) and it crawls over, takes hold and drags you to the shredder. Mash E to tear free (20 damage). It takes a lot of mashing, and the meter drains as soon as you stop. Getting back to work before it reaches you sends it back. Sometimes the elevator stops halfway and something walks on its roof (only when someone in the car has a working flashlight). Shine your light up at the hatch for 2.5 s and it moves again; a meter in the middle of the screen shows how long. After 18 s the hatch opens (45 damage), but you can't run from a stopped car, so it never takes you below 12 health. The cars are otherwise safe: nothing from outside can get into a car or hurt anyone standing in one (monsters that follow you wait at the gate). Only the thing on the roof and the cold reach you in there. |
| Generator Room | $300 | 0 | +40 s | Backup power (see power outages). It burns fuel only during an outage; a full tank lasts two minutes, and each jerry can from the rack by the roof ladder adds half a tank. It also stops lamps flickering out on their own. | Moths circle the lamps and break bulbs after 14 s. Shine your light on one and it follows the beam. Lead it 7 m from its lamp and it loses interest. They also circle flares instead. |
| Bay C | $500 | +10 | +60 s | A third dock in the north-west corner for refrigerated trailers. | The sleepers in those trailers are colder: they creep faster, but light halves the speed of their charge. |
| Warehouse Heater | $250 | 0 | 0 | A gas heater high on the east wall. The warehouse goes cold every third night instead of every second (see *The cold*). | Nothing. |
| Medkit Upgrade | $300 | 0 | 0 | A bigger first-aid cabinet: the crew can buy a third first-aid refill each night instead of two. | Nothing. |
| Autonomous Mobile Robot S | $2000 | 0 | 0 | A small white robot with its own pad on the dock, west of the charger. Put a box on the pad (E) and it drives it slowly to the nearest free bottom or middle shelf, lifts it in, shelves it (it counts and pays like any box) and comes back. One box at a time; one more can wait on the pad. It won't take returns or frozen crates, and it stops for anyone standing in front of it. | Nothing. |
| Autonomous Mobile Robot L | $5000 | 0 | 0 | A big pallet robot with a scissor lift and its own pad on the dock, east of the charger. Set a pallet on the pad with the forklift (drive up and press G; the prompt says when you're lined up) and it carries it slowly to the nearest free top shelf, lifts it up and slides it on (eight boxes shelved). One pallet at a time. Trucks bring pallets more often once you own it. Needs the forklift to be useful. | Nothing. |

**Equipment (yours).** Items you carry sit on the **hotbar** at the bottom of the screen. Scroll the mouse wheel to pick one (or press its number), and right click or press Space to use it.

| Item | Price | Hotbar key | What it does |
|---|---|---|---|
| Better flashlight | $150 | | Brighter and wider. Monsters notice it from farther away. The battery lasts twice as long. |
| Spare batteries (2) | $20 | 1 | A full charge anywhere. |
| Flares (2) | $25 | 2 | 35 s of red light on the floor. The stalker and the sleeper won't cross it, the crawler won't hang over it, and moths circle it. |
| Box cutter | $60 | 3 | Cut into the box or parcel you're looking at. Kills a mimic for good; ruins a real box. |
| Strobe (3) | $70 | 4 | Stops a charging sleeper, scatters the crawler, drives off mimics, moths and the passenger, stuns the driver, kills a stalker in its cone. |
| Thermal scanner | $120 | 5 (hold right click or Space) | Warm things glow through walls within 15 m: sleepers, crawlers, mimics, the passenger, the long-legged thing, your crew. The driver, the frost figures and the shrink-wrap stay dark. |
| Air horn (3) | $40 | 6 | Lures the shrink-wrap to the sound and stuns the driver. |
| Energy drinks (2) | $15 | 7 | 20 s of running without getting tired. |
| Shake flashlight | $100 | hold R | Charges your battery about 7% a second, anywhere, even in an outage. Anything that hunts by sound hears it. |
| Stamina upgrade | $90 | | Sprint half again as long (drains at two-thirds the rate) and recover 50% faster. |
| Stamina upgrade II | $160 | | Shows up in the shop once you own the first one. Sprint twice as long as at the start (drains at half the rate) and recover twice as fast. |
| Stamina upgrade III | $900 | | Needs II; on sale from the shop before night 7. Sprint 2.6 times as long as at the start, and recover that much faster. |
| Stamina upgrade IV | $1800 | | Needs III; on sale from the shop before night 10. Sprint 3.3 times as long as at the start, and recover that much faster. |
| Better Stocking | $500 | | Stack a second box on top of one already on a shelf, as long as the two fit under the shelf above (small on small, or small on medium). The prompt says *Stack it on top* when it fits. |
| Bay door remote | $90 | 8 | Slams the nearest bay shut: a docked truck leaves at once, its crawler is shut out for good, and a jammed door closes. It won't fire while anyone is inside that trailer. |
| Lamp bulb | $50 | 9 | Buy as many as you like. Stand under any light fixture that hasn't had one and press E or right click (whatever is picked on the hotbar, unless it's the strobe, air horn or a flare). A dead light comes back on; a working one stops going out: no flickering. Moths and the stalker can still put it out for a while, as with any light. Only a power outage (without the generator) or overtime turns it off. Lasts the rest of the run. With the bulb picked, the prompt points to the nearest light without one. |
| Carry Upgrade | $110 | | Carry up to three boxes at once. Crewmates see the whole stack. Slower, and loud enough for the shrink-wrap to hear. |
| Red headlamp | $80 | H | A dim red light that monsters don't notice: it doesn't scare them off and doesn't set them off. |
| First-aid refill | $30 | | One more first-aid use next night (two at most, three with the Medkit Upgrade). |
| Hand cart | $300 | | A platform cart, parked at the west end of the dock (the far end of the bays from the forklift). One alone, up to two in a crew. E takes the handle; boxes you pick up go on the deck, five at most, and slow you half as much as carrying them. E shelves the top one, G sets one down beside it, Q lets go (anything still on it is set down beside it). It won't go up the ladder or in the elevator. The casters rattle: quiet, but anything close by that hunts by ear can hear it. |

## Controls

| Key | Action |
|---|---|
| W A S D | Move |
| Shift | Run (uses stamina) |
| Mouse | Look |
| E / left click | Pick up, shelve, use. Hold at the charger. |
| Q | Kick (the box under the crosshair, or else the nearest loose box at your feet in front of you) |
| G | Set the box down |
| F | Flashlight on/off |
| Mouse wheel | Pick an item on the hotbar (number keys 1 to 9 jump to one) |
| Right click or Space | Use the picked item (hold it for the thermal scanner). Space can be rebound in Settings. |
| H | Red headlamp on/off |
| R (hold) | Shake flashlight: charge the battery anywhere, loudly |
| Esc | Pause (solo) / menu (crew) |

### Phones and tablets

On a touch screen the game shows on-screen controls instead of locking the mouse. Hold the phone sideways (upright works too, after a reminder). When a shift starts or resumes, the game tries to go full screen and stay in landscape.

| Touch | Does |
|---|---|
| Drag on the left part of the screen | Walk. The stick appears under your thumb, and a small push walks slowly. Push it all the way up to run (the stick turns blue). |
| Drag anywhere else | Look around |
| USE | Pick up, shelve, use things. Hold it at the charger, the vents and the jam button. |
| KICK | Kick. Gets you off the forklift while you're driving it. |
| ITEM | Use the item you picked. It's labelled with that item, and you hold it for the thermal scanner. Tap an item on the hotbar to pick it. |
| LIGHT, DROP | Flashlight, set a box down. DROP only shows while you're carrying something. |
| LAMP, SHAKE | Red headlamp and shake flashlight (hold), shown once you own them |
| ❚❚ (top) | Pause. Switching away from the game pauses it too. |

**Full screen and the app.** The title screen and the break room have a **Full screen** button in the bottom-right corner, on every device that allows it (iPhones only allow it for videos, so there it doesn't show). On phones and tablets, **Get the app** in the bottom-left corner installs the game to the home screen. It then opens full screen and in landscape, like an app, and can start without a connection once it has loaded (crews still need the internet). On Android Chrome the button brings up the install prompt. On an iPhone, or in browsers without an install prompt, it explains how to do it from the browser menu or Safari's Share button.

When you go down, USE and KICK switch to the next or previous crewmate, and a tap on the screen does the same. Prompts on screen name the buttons instead of the keys. On short screens the menus and the shop scroll, and the shop's start button stays at the bottom. Settings has **Touch controls** (Auto, On, Off: Auto turns them on for touch screens), **Button size**. On a touch screen the Mouse slider is replaced by **Screen sensitivity**, which sets how fast dragging turns the view.

## Playing with a crew

1. One player presses **Host a Crew** and shares the five-character code.
2. Everyone else types the code and presses **Join Crew**. Up to ten players. Crews of more than four get a bit less extra quota per worker than the first few, and trucks come more often (up to 60% more often with ten) and bring a box more each per extra worker.
3. **Public crews.** In the crew room the host can switch the crew from *Private* to *Public*. A public crew shows up under **Join Public** on the title screen (below Join Crew), with the host's name, how many workers it has, the night it's on and its cash, and anyone can join it at any time, even mid-shift. It stays listed until the host leaves. The game has no server of its own: a public host also takes one of 24 shared listing ids on the PeerJS matchmaking server, so at most 24 crews can be public at once.
3. The host presses **Start the shift**. People can also join a shift already in progress.

Players connect browser-to-browser over WebRTC, using the free public PeerJS server to find each other. The host's browser runs the world. If the host leaves, the room closes. It keeps running while the host's tab is in the background. If you go down, you watch your crew in third person until the night ends, then you're back on shift: move the mouse to orbit, and click, Space or the arrow keys to switch to another crewmate who is still standing.

## Settings

Mouse sensitivity, volume, field of view, graphics quality (Low turns off shadows and lowers render resolution for older laptops and Chromebooks), an FPS counter, and **Outlines**: Full, Soft or Off. Auto uses Soft on touch screens, because phones often store depth less precisely and stretch the picture, which drew stray lines on flat floors and walls and turned the scanlines into stripes. Soft ignores those small depth differences, only outlines things close up, and drops the scanlines.

**Controls** can be rebound: click an action, then press the new key (Esc cancels). Binding a key that's already in use swaps the two. Prompts, messages and the key hint bar show your keys. **Crosshair**: dot, cross, open cross, circle, dot in a ring, or none. **Forklift steering**: Normal (D turns right, A turns left) or Inverted.

## Files

- `stocking-in-the-dark.html`: the whole game in one file. This is what you play or upload.
- `src/`: the source. `shell.html` holds the page and UI; `01-core.js` to `07d-touch.js` hold the game (renderer and textures, world, models, audio, simulation, networking, client, touch controls). The `b` files hold the additions, the shop, the later-night monsters and the items.
- `build.sh`: rebuilds `stocking-in-the-dark.html` from `src/`, plus a copy as `index.html` for GitHub Pages.
- `manifest.webmanifest`, `sw.js`, `icon-*.png`, `apple-touch-icon.png`: what lets phones install the game as an app. `tools/make-icons.ps1` redraws the PNG icons from the shapes in `icon.svg`.
- `tools/serve.ps1`: a tiny local web server for testing (`powershell -File tools/serve.ps1`, then open http://localhost:8137).
- `tools/qa.js`: a test harness. With the local server running, open the game, then in the browser console run `await import('/tools/qa.js')` and e.g. `await QA.boot({bots:3,adds:['cold','fork']}); await QA.play(3)` to have bot workers play three nights through the real game actions; `QA.errs` collects any errors and `QA.stats` what happened. The game never loads it.
