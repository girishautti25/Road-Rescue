# Roadside Rescue Hub

Build ROADRESCUE - Highway Emergency Assistance & Rescue Platform (Phase 1).

Key Brand & Identity:
- Name: ROADRESCUE ("Help is Always Within Reach")
- Modern, high-trust emergency design system (clean neutrals, crisp typography, high contrast, red used strictly for urgent emergency states, accessible touch targets, native mobile-app feel on handheld devices).

Core Architecture & State:
- Reusable local/reactive state management for the emergency lifecycle: CREATED -> ACKNOWLEDGED -> FINDING_STATION -> POD_ASSIGNED -> POD_DISPATCHED -> POD_MOVING -> POD_ARRIVED -> WAITING_FOR_ACCESS -> ACCESS_GRANTED -> KIT_IN_USE -> (REPAIR_SUCCESSFUL -> COMPLETED) OR (UNABLE_TO_REPAIR -> MECHANIC_SEARCHING -> MECHANIC_ASSIGNED -> MECHANIC_EN_ROUTE -> MECHANIC_ARRIVED -> REPAIR_IN_PROGRESS -> COMPLETED).
- Seed data: Stations S1-S4 along simulated NH-44 / Ghat Road section, buttons B-001 to B-050, horizontal rail-mounted emergency pods (e.g. S1-POD01, S2-POD01, etc.), 10 sample registered mechanics with ratings and skills, sample past requests.
- Nearest station Haversine algorithm service (`findNearestAvailableStation`) and mechanic matcher service (`findBestAvailableMechanic`).

Required Views & Navigation:
1. Public Pages:
   - `/`: High-impact landing page with hero "Vehicle Breakdown? Help is Always Within Reach", primary "[ GET EMERGENCY HELP ]", quick demo link, problem & solution breakdown, horizontal rail pod concept, roadside emergency button explanation, safety assurance.
   - `/how-it-works`: Step-by-step visual guide (1. Press button / tap emergency, 2. Auto-location identification, 3. Rail pod dispatched, 4. Arrival & QR access, 5. Complete kit usage, 6. Mechanic fallback).
   - `/about` and `/contact`.

2. Driver Experience (`/driver`):
   - Fast 1-tap Emergency Button (`/driver/emergency`): Problem types (Tyre puncture, Tyre burst, Battery dead, Engine issue, Fuel shortage, etc.), vehicle picker with saved vehicles, physical emergency button input (e.g. B-027) with simulated GPS fallback, one-tap dispatch.
   - Live Request Tracking (`/driver/request/:id`): Real-time stage stepper, interactive visual map with rail pod progress bar, pod telemetry (battery, speed, obstacle clear, ETA), QR code scanner/unlock view (`/kit-access/:podId`) with mock Razorpay payment test modal, "Could you repair your vehicle?" decision buttons (Vehicle Repaired vs. Unable to Repair), live mechanic en-route card.
   - Driver dashboard tabs: Saved vehicles, emergency contacts, history.

3. Interactive Demo Mode (`/demo`):
   - Dedicated one-click presentation runner for the B-027 Ghat road scenario:
     Simulate Button B-027 Pressed -> Station S2 selected (2.7 km vs S1 8.4 km) -> S2-POD01 dispatched -> Animated rail movement -> Pod arrived -> QR scan -> Test payment (₹99) -> Kit unlocked -> "Unable to Repair" triggered -> Mechanic M-004 assigned & en-route -> Completed & pod returns to station. Includes manual step-through or auto-play.

4. Admin Command Center (`/admin`):
   - Executive metrics (Active Emergencies, Online Pods, Stations, Mechanics, Heartbeats).
   - Interactive live map showing stations S1-S4, rail lines, button nodes, moving pods, and active emergencies.
   - Emergency stop master switch.
   - Tab views for Emergencies table with filtering, Stations (`/admin/stations`), Pods (`/admin/pods`), Emergency Buttons IoT heartbeat simulator (`/admin/buttons`), Mechanics review (`/admin/mechanics`), and Analytics charts (`/admin/analytics`).

5. Mechanic Portal (`/mechanic`):
   - Incoming emergency dispatch alert with Accept/Reject, navigation route details, status updates (Start Journey -> Arrived -> Start Repair -> Complete Repair), and earnings summary.

Ensure realistic simulation controls, interactive maps (Leaflet/SVG highway schematic), toasts, mobile navbar, and switchable role selector in header for seamless review.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rail-pod-assist.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3906b71b-d92d-4985-88df-c86274cc18c7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
