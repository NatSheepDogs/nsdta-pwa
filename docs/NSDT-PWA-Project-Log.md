# NSDT PWA — Project Log & Reference

*Last updated: May 2026*

---

## Accounts & Services

| Service | Account | Username / URL | Notes |
|---|---|---|---|
| GitHub | natsheepdogs@gmail.com | NatSheepDogs | https://github.com/NatSheepDogs |
| Netlify | natsheepdogs@gmail.com | NatSheepDogs | https://app.netlify.com — connected to GitHub |
| Google Workspace | Existing account | — | Used for Sheets API |

---

## Repositories

| Repo | URL | Purpose |
|---|---|---|
| PWA | https://github.com/NatSheepDogs/nsdta-pwa | Main app repository (note: nsdta not nsdt) |

---

## Deployed URLs

| Environment | URL | Status |
|---|---|---|
| Production | app.nationalsheepdogtrials.org.au | Not yet configured |
| Netlify default | https://nsdta-pwa.netlify.app | ✅ Live |

---

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| App type | PWA (not native) | Simpler, free, no App Store needed for now |
| Hosting | Netlify free tier | Zero cost, automatic deploys from GitHub |
| Framework | React + Vite + Tailwind | Modern, well-supported, good mobile tooling |
| Score data | Google Sheets API | Scorers use existing workflow, no new tools |
| Video | Embedded YouTube Live URL | Free, reliable, no hosting required |
| Audio | Embedded stream URL (Icecast/Shoutcast) | Provided by Radio Dog National |
| Native wrapping | Capacitor (future Phase 3) | Deferred until PWA is proven |

---

## Google Spreadsheet

| Item | Value |
|---|---|
| Spreadsheet ID | 1H8cjA_UCOBlo6pZmJd104y74OnRNThk7c7ZevAY0w8I |
| Sharing | Public (anyone with link can view) |
| URL | https://docs.google.com/spreadsheets/d/1H8cjA_UCOBlo6pZmJd104y74OnRNThk7c7ZevAY0w8I |

### Tabs
| Tab | Purpose |
|---|---|
| Open Draw | Open and Improver competitors, scores, ranks |
| Maiden Draw | Maiden competitors and scores |
| Top 20 | Top 20 finalists |
| Maiden Top 15 | Maiden finalists |
| Finals | Finals results |
| Controls (to be created) | App control toggles |

### Controls Tab Structure
| Cell A | Cell B | Notes |
|---|---|---|
| trial_status | off_season | off_season, active, paused (dropdown) |
| off_season_message | The 2027 Trial will be held from 8-14 March 2027. See you at the National! | Editable any time |
| off_season_url | https://nationalsheepdogtrials.org.au | Link shown on off-season screen |
| paused_message | That's all for today. We resume tomorrow at 8:30am. See you then! | Editable each evening |

### Score Value Conventions
| Value | Meaning |
|---|---|
| Number | Actual score |
| Blank | Not yet run |
| R | Retired |
| X | Eliminated |
| SCR | Scratched |
| DQ | Disqualified |

---



See separate file: `NSDT-PWA-Architecture.md`

---

## Progress Log

### May 2026
- ✅ Project scoped and architecture agreed
- ✅ Architecture document created
- ✅ GitHub account confirmed (NatSheepDogs)
- ✅ Create GitHub repository (nsdta-pwa)
- ✅ Set up Netlify account
- ✅ Scaffold React + Vite + Tailwind project
- ✅ Connect Netlify to GitHub repo
- ✅ Configure custom subdomain on Netlify (deferred to pre-launch)
- ✅ Create Controls tab in Google Spreadsheet
- ✅ Add trial_status dropdown (off_season / active / paused)
- ✅ Connect app to Google Spreadsheet Controls tab
- ✅ Build trial_status screens (off_season / active / paused)
- ✅ Build Scores screen — Open & Improver leaderboard
- ✅ Build Scores screen — Maiden leaderboard
- ✅ Build Scores screen — Run order with On Course Now indicator
- ⬜ Build Watch screen (live video embed)
- ⬜ Build Radio screen (persistent audio player)
- ⬜ Build Schedule screen
- ⬜ Build Info screen
- ⬜ PWA configuration (manifest, service worker)
- ⬜ Test on Android and iOS devices
- ⬜ Soft launch

---

## Next Step

**Build Watch screen (live video embed) and Radio screen (persistent audio player).**
