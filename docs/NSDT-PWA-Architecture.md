# National Sheep Dog Trials — PWA Architecture & Functionality Summary

## What We Are Building

A Progressive Web App (PWA) that serves as the **live event experience** for the National Sheep Dog Trial Championships. It is a companion to the existing website at nationalsheepdogtrials.org.au — not a replacement for it.

---

## Guiding Principles

- The PWA does one thing exceptionally well: the **live event experience during the 7 days of competition**
- Everything else (history, news, trialler info, gallery) stays on the WordPress site
- Zero dependency on WordPress — the PWA is entirely standalone
- Infrastructure cost is effectively **$0/year**
- Content is managed by existing people doing existing jobs (scorers update a spreadsheet, camera operator goes live on YouTube)

---

## Hosting & Deployment

| Component | Service | Cost |
|---|---|---|
| PWA hosting | Netlify (free tier) | $0 |
| Source code | GitHub (free tier) | $0 |
| Custom URL | `app.nationalsheepdogtrials.org.au` | $0 (existing domain) |
| SSL certificate | Netlify (automatic) | $0 |

Deployment is via GitHub → Netlify. Push a code change to GitHub and Netlify automatically rebuilds and publishes within ~60 seconds.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | React (with Vite) | Component-based UI, fast builds |
| Styling | Tailwind CSS | Mobile-first, utility styling |
| Data fetching | Google Sheets API (v4) | Live scorecard |
| PWA features | Vite PWA plugin | Installability, offline shell, push notifications |
| Deployment | Netlify | Hosting, CI/CD |
| Native wrapping (future) | Capacitor | Optional App Store distribution later |

---

## Data Sources

All data comes from external sources — the PWA hosts nothing itself.

| Data | Source | Update method |
|---|---|---|
| Live scores / leaderboard | Google Sheets (your Workspace) | Scorers type into spreadsheet as normal |
| Run order / who's next | Same Google Sheet | Same sheet, different tab |
| Live video | YouTube Live URL (or similar) | Camera operator goes live; URL configured once |
| Live audio | Radio Dog National stream URL (Icecast/Shoutcast) | Provided by Radio Dog National, configured once |
| Schedule & event info | Hardcoded in app (or a Sheet tab) | Updated once before each event |

---

## Google Sheet Structure (Proposed)

The scoresheet is the engine of the live scorecard. Proposed structure:

**Tab 1 — Leaderboard**
| Column | Content |
|---|---|
| A | Rank (auto-calculated) |
| B | Competitor name |
| C | Dog name |
| D | State |
| E | Score |
| F | Status (e.g. "On course", "Complete", "DNS") |

**Tab 2 — Run Order**
| Column | Content |
|---|---|
| A | Run number |
| B | Competitor name |
| C | Dog name |
| D | Scheduled time |
| E | Status |

**Tab 3 — Config**
| Key | Value |
|---|---|
| current_day | Day 3 |
| current_class | Open Championship |
| video_url | https://youtube.com/live/xxx |
| audio_url | http://stream.radiodognational.com/live |
| event_active | TRUE |

The Config tab means you can update the video URL, toggle the app between "event mode" and "off-season mode", and change the current class label — all without touching any code.

---

## App Screens & Functionality

### 1. Scores (default screen)
- Live leaderboard auto-refreshing every 30 seconds from Google Sheet
- Shows rank, competitor name, dog name, score
- "On course" indicator for current runner
- Selector to switch between classes (Open, Improvers, Maiden, etc.)
- Last-updated timestamp

### 2. Watch
- Embedded live video player (YouTube Live or equivalent)
- Full-screen capable
- Falls back to a holding message when stream is offline

### 3. Radio
- Persistent audio player for Radio Dog National stream
- Audio continues playing when user navigates to other screens
- Play/pause control
- Falls back to a holding message when stream is offline

### 4. Schedule
- Daily run schedule sourced from Google Sheet
- Highlights current/upcoming runs
- Shows all classes across the 7 days

### 5. Info
- About the event (brief, with link to full website)
- Venue details and map
- Links back to nationalsheepdogtrials.org.au for full information

---

## PWA Features

- **Installable** — users can add to home screen on both Android and iOS ("Add to Home Screen" prompt)
- **App-like** — runs full-screen with no browser chrome once installed
- **Offline shell** — app loads even without connectivity; shows cached data with "offline" indicator
- **Push notifications** (phase 2) — opt-in alerts for finals day, score milestones, schedule changes

---

## Off-Season Behaviour

When `event_active = FALSE` in the Config sheet, the app shows:
- Countdown to next event (March 2027)
- Previous year's results
- Link to main website
- "See you at Hall Showgrounds" holding screen

This means the app is always live at its URL year-round, but gracefully handles the 358 days when there's no live event.

---

## What the PWA Does NOT Do

- No login or user accounts
- No ticket sales or payments (link to website for that)
- No content management system — content comes from Google Sheets and configured URLs
- No server-side code — it is a fully static app
- No replacement for the WordPress website

---

## Development Phases

**Phase 1 — Core (build now)**
- Scores screen with live Google Sheets integration
- Watch screen with video embed
- Radio screen with persistent audio
- Schedule screen
- Info screen
- PWA installability
- Off-season holding screen

**Phase 2 — Enhancements (before March 2027 event)**
- Push notifications
- Score history / run-by-run breakdown
- Multiple class support with easy switching
- Performance refinements based on Phase 1 feedback

**Phase 3 — Optional future**
- Wrap in Capacitor for native Android/iOS App Store distribution

---

## Next Steps

1. Set up GitHub repository
2. Scaffold React + Vite + Tailwind project
3. Deploy skeleton to Netlify with custom subdomain
4. Build Google Sheets API connection and test with a sample sheet
5. Build Scores screen
6. Build Watch and Radio screens
7. Build Schedule and Info screens
8. PWA configuration (manifest, service worker)
9. Test on real Android and iOS devices
10. Soft launch before March 2027 event

---

*Document version 1.0 — prepared May 2026*
