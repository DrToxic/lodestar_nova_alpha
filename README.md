# LODESTAR NOVA

### A smarter MeshCore companion for the Heltec V4 R2, by FEAR REACTIVE

**Version v0.1.0-alpha** (alpha test release, **Heltec WiFi LoRa 32 V4 R2 only**)

The stock MeshCore companion firmware connects your phone to the mesh and shows a few status screens. NOVA keeps all of that and answers the questions you actually have while you are out with a radio: *Can I reach anyone from here? Did my message get through, and who carried it? How far back was the last place I had coverage? How long will the battery last?*

It is the companion sibling of [LODESTAR](https://github.com/propertymonitor-web/lodestar.alpha2), the mobile-repeater firmware. LODESTAR is a repeater; NOVA is the radio your phone talks to. NOVA uses LODESTAR's uplink scoring to judge the repeaters it hears.

**At a glance**

- **Who it is for:** anyone who carries a MeshCore companion radio and uses it away from home: driving, hiking, on a boat.
- **What it adds to the stock companion:** seven new screens on the OLED, quiet hours, power profiles, and a dashboard page for your computer with the full detail. Everything else is stock MeshCore, and your phone app works as before.
- **What it needs:** a Heltec V4 R2 with its antenna. No soldering and no extra parts. A GPS module is optional (the trip screens need one).

> **Hardware check before you flash.** Heltec sells the V4 in two versions: **V4 R2** (ESP32-S3R2, 2 MB PSRAM) and **V4-R8** (ESP32-S3R8, 8 MB PSRAM). **This firmware is for the R2 only.** The two boards use different pins for GPS, the LED and external power (Heltec lists the differences on its [V4 product page](https://heltec.org/project/wifi-lora-32-v4/)), so an R2 image on an R8 can leave the GPS unpowered or misbehave. **Never power the radio without an antenna.**

> **Status: alpha.** The firmware builds for the V4, and the logic, the screen layouts and the dashboard data are covered by automated tests that run on every push. It has **not yet been run on a real board by its author**, so expect rough edges and please report them. See [what to test](#test-checklist).

## What you get

| Screen | What it shows |
| --- | --- |
| **Link** | The repeaters your radio hears right now, best first: score, signal, how long ago, with an arrow for getting better or worse. It answers "why is nothing getting through?" |
| **Sent** | What happened to each message you sent: *sent*, *heard by repeater 3F*, *delivered in 4 s*, or *failed* (and whether you had a usable repeater at the time). |
| **Trip** | Distance, time, moving time, top speed and average speed. Hold the button twice to clear it. |
| **Back** | An arrow and distance to the last place you had a usable repeater. Heading-up while you move, north-up when stopped. |
| **Batt** | Battery percentage, a trend, a rough time-left estimate, and a graph of the last hours. |
| **Range** | Hold the button to ask nearby repeaters to answer, then see GOOD / OK / WEAK / NONE for where you are standing. |
| **NOVA** | Version, your power profile, packet counts, uptime and free memory. Hold the button to change profile. |
| **Quiet** | Quiet hours on or off. |

Other changes:

- **Power profiles** (*hike*, *car*, *desk*): how long the screen stays on, and how quickly old repeaters fade from the ranking (a car passes repeaters in minutes, a desk never does).
- **Quiet hours:** no sound, vibration or screen wake for incoming messages between two hours you choose. Messages from contacts you marked as favourites still alert. If the radio's clock has never been set, quiet hours stay off rather than guess.
- **Boot splash:** LODESTAR / NOVA / by FEAR REACTIVE.
- **Dashboard** for your computer, described [below](#the-dashboard).

NOVA only listens and keeps score. It does not change how packets are routed, and it never sends anything on its own except the single discovery request when you use the Range screen.

### Using the button

The V4 has one user button, so the stock controls apply:

- **Click:** next screen. **Double-click:** previous screen.
- **Hold (long press):** the action on the screen you are looking at (clear trip, start range check, change profile, quiet on/off).
- **Triple-click:** mute or unmute the buzzer (stock MeshCore).
- **Do not hold the button during the first 8 seconds after power-up.** Stock MeshCore treats that as a request to open its rescue console.

## Quick start

1. **Check the board.** It must be a Heltec WiFi LoRa 32 **V4 R2**.
2. **Get the firmware.** Download `firmware-merged.bin` from this repository's [Releases page](https://github.com/propertymonitor-web/lodestar_nova_alpha/releases), or [build your own](#building-it-yourself). The release contains the **Bluetooth** build (`heltec_v4_companion_radio_ble`), which is the one to use. The USB build is for a phone-app-over-cable setup and you [build it yourself](#building-it-yourself) (see [which build](#which-build)).
3. **Flash it** at https://flasher.meshcore.io using Chrome or Edge: choose **Custom Firmware**, pick `firmware-merged.bin`, connect to the board and flash. If the board does not show up, put it in bootloader mode: hold **PRG**, tap **RST**, release **PRG**, then try again.
4. **Pair your phone** with the MeshCore app over Bluetooth. The pairing PIN is shown on the radio's Bluetooth screen (click through to it).
5. **Click through the screens.** Give the Link screen about 10 minutes of adverts and traffic before judging the scores.

Already running MeshCore on this board? Flashing over the top usually keeps your contacts and settings. Erasing the board's flash removes them, along with NOVA's own saved settings.

### Which build

| Build | Phone connection | USB cable | Use it when |
| --- | --- | --- | --- |
| `heltec_v4_companion_radio_ble` | Bluetooth (and WiFi if you set it up) | Free, so the **dashboard works** | Almost always |
| `heltec_v4_companion_radio_usb` | USB cable | Carries the phone-app link, so **no dashboard** | The app on a computer over USB |

## km/h or mph

Every release comes in one speed unit. The version name ends in `-mph` on the miles-per-hour build (shown on the NOVA info screen and in the dashboard's diagnostics). Distances are still in kilometres and metres in both. To build your own, set **units** to `mph` when you run the build workflow.

## The dashboard

The OLED has room for five short lines. The dashboard is a web page that shows everything NOVA knows, on a computer or laptop: the full repeater table, a score graph over the last 15 minutes, a trip map with your track and the last-coverage marker, battery history, message history, diagnostics, and controls for profile, quiet hours and clearing the trip. There is nothing to install.

1. Use the Bluetooth build, and plug the radio into the computer with a USB **data** cable. Your phone can stay connected over Bluetooth.
2. Open the dashboard at **<https://propertymonitor-web.github.io/lodestar_nova_alpha/>** in **Chrome or Edge**. (Offline, you can instead open `dashboard.html` from the release.) Firefox and Safari cannot talk to USB devices.
3. Click **Connect radio** and pick the radio's port. Close any other program using the port first (the flasher page, a serial monitor).
4. Within a few seconds the readouts fill in. **Save log** downloads everything the page has received as a text file you can send when reporting a problem.

No radio yet? Click **Try sample data** to see the page with made-up numbers.

**Privacy.** The radio only sends dashboard data while the page is connected and asking for it. The data includes your GPS position, and it travels only over the USB cable to your computer. The page does not send your data anywhere; its only request to the internet is for the typeface from Google Fonts, and it falls back to your system font without it.

You can also type commands into any serial terminal (115200 baud) on the Bluetooth build: `nova status`, `nova profile hike|car|desk`, `nova quiet 22-7`, `nova quiet off`, `nova trip reset`, `nova defaults`. Replies start with `#`.

## Settings are remembered

Your profile and quiet-hour settings are saved to the board's flash the moment you change them and restored at every start. They survive reboots and power loss. The uplink table, trip and battery history are not saved; they rebuild as you use the radio.

## Honest limits

- **Not run on hardware yet.** See the status note above.
- **Delivery status is as good as what the radio can observe.** "Heard by repeater 3F" means NOVA heard a repeater re-broadcast your message (the same trick LODESTAR uses). Direct (non-flood) messages show *sent* then *delivered*, because there is no echo to hear. "Delivered" comes from the recipient's acknowledgement. **Channel messages** (Public and other channels) have no acknowledgement at all in MeshCore, so they can only show *heard by repeater XX* or, after 10 seconds of silence, *unheard*.
- **Back-to-coverage is a straight line**, not a route, and "coverage" means "a repeater scoring above LODESTAR's usable threshold". It needs a GPS fix, and the Back screen says so when it does not have one.
- **Battery percentage is approximate.** It maps the cell voltage to a percentage; a loaded cell reads low. Time left appears only after 30 minutes on battery and only while the battery is steadily draining.
- **Range check** uses MeshCore's repeater-discovery request. It reports repeaters that answered, so an empty answer means "nobody replied", not "nobody is there".
- **Not in this alpha:** automatic message retry, holding outgoing messages until a repeater appears, and an SOS button. The first two change how the phone app's send command behaves and need testing with the app on real hardware before they are safe to ship. SOS needs a confirmation step so a stray press cannot spam the mesh. They are the next candidates.
- **GPS** is whatever MeshCore does: it stays off until you turn it on in the app or the GPS screen. NOVA never turns it on for you.

## Test checklist

If you are helping to test, these are the most useful things to learn:

1. Does it flash cleanly, show the **LODESTAR / NOVA / by FEAR REACTIVE** splash, and pair with the phone app as before?
2. Do all eight screens draw cleanly, and does the page-dot row at the top still fit?
3. Does the **Link** screen list the repeaters you know are nearby after about 10 minutes?
4. Send a message from the phone. Does **Sent** go from *sent* to *heard by* to *delivered*? Does a message to someone out of range end as *failed*?
5. **Range:** does GOOD / OK / WEAK match what you see from where you stand?
6. Drive or walk with GPS on: do **Trip** and **Back** behave, and does the arrow point back the way you came?
7. **Quiet hours:** set them for the next few minutes and check that a message from a non-favourite makes no sound and does not wake the screen, while a favourite does.
8. **Dashboard:** does it connect, stay live for several minutes, and match what the screens say? Does unplugging the cable show "Radio unplugged" instead of freezing?
9. Does the phone app stay connected the whole time?

Please include your radio settings, what you were doing, and the dashboard's saved log if you can.

## Building it yourself

NOVA is a patch applied to the official MeshCore source. You do not need to know C++.

**On GitHub (no software to install):** fork this repository, open the **Actions** tab, choose **Build LODESTAR NOVA firmware**, click **Run workflow**, pick the build, and wait about 4 minutes. Download the zip from the finished run's **Artifacts** (you must be signed in). Repository owners can tick **Publish** and type a release tag: a new tag makes a release, and an existing release that has no files yet gets the firmware attached. The workflow refuses an empty tag or a release that already has files, and never overwrites anything. Every push also runs the quick checks (about a minute): unit tests, a layout test that draws every screen on a pretend 128×64 display, and a check that the patch still applies to the newest MeshCore.

**On your own computer:** you need `git`, Python 3, a C++ compiler for the tests, and [PlatformIO](https://platformio.org/) for the firmware (on Windows, WSL is the easiest way). The first firmware build downloads the ESP32 toolchain, which takes a while.

```
pip install platformio
git clone https://github.com/propertymonitor-web/lodestar_nova_alpha.git
cd lodestar_nova_alpha

# 1. the tests
g++ -std=c++17 -Wall -Wextra -Ilodestar -Inova nova/test/test_nova.cpp -o nova_test && ./nova_test

# 2. get MeshCore (use a fresh clone every time) and apply NOVA
git clone --depth 1 https://github.com/meshcore-dev/MeshCore.git
python tools/apply_nova.py --meshcore MeshCore

# 3. build
cd MeshCore
pio run -t mergebin -e heltec_v4_companion_radio_ble
```

The finished files are in `MeshCore/.pio/build/heltec_v4_companion_radio_ble/`: `firmware-merged.bin` for a first flash, `firmware.bin` for updates. Builds track the newest MeshCore, so they are not byte-for-byte reproducible; `git -C MeshCore rev-parse HEAD` tells you which version you built on. If upstream MeshCore changes enough that the patch no longer fits, the script stops and names the part it could not find, rather than leaving a half-patched tree.

### For developers

- `nova/Nova.h` holds the logic (delivery tracking, trip and coverage, battery, profiles, quiet hours, the dashboard JSON). It is header-only with no Arduino dependencies, so it is unit-tested on a PC.
- `nova/ui/NovaPages.h` draws the OLED screens. The layout test in `nova/test/test_ui.cpp` runs them against a pretend display and fails if any text or shape leaves the screen.
- `lodestar/Lodestar.h` is a copy of LODESTAR's scoring engine, vendored so this repository builds on its own.
- `tools/apply_nova.py` patches `examples/companion_radio`. Every edit must match exactly the number of places it expects.
- `docs/index.html` is the dashboard, one self-contained page. It speaks one JSON line per two seconds (`"nova":1`) over the radio's USB serial port.

## Credits and responsibility

NOVA is built on **MeshCore**, an open-source project; please see the MeshCore repository for its license terms and documentation. NOVA is a community give-away from FEAR REACTIVE, provided as is, with no warranty.

Transmit only where and how your local regulations allow (frequency, power, duty cycle; the V4's transmit-power setting is not the same number as the power at the antenna), and follow your local mesh community's norms.

**LODESTAR NOVA by FEAR REACTIVE**
