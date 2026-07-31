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
| Production | app.nationalsheepdogtrials.org.au | Not yet configured — deferred to pre-launch |
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
| Theme colour | Navy #0D2B5E | Matches nationalsheepdogtrials.org.au website |

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
| Top 20 | Top 20 finalists — cols A:No, B:Competitor, C:Dog, D:1st Score, E:Top 20 Score, F:Total, G:Rank, H:Open Final |
| Maiden Final | Maiden Final results — cols A:No, B:Competitor, C:Dog, D:1st, E:Top 15, F:Final, G:Total, H:Place |
| Improver Final | Improver Final results — cols A:No, B:Competitor, C:Dog, D:1st, E:Final, F:Total, G:Place |
| Open Final | Open Final results — cols A:No, B:Competitor, C:Dog, D:1st, E:Top 20, F:Final, G:Total, H:Place |
| Controls | App control toggles |

### Open Draw Score Columns
| Column | Purpose | Format |
|---|---|---|
| F | Improver numeric score | Number |
| G | Open numeric score | Number |
| S | Improver score for app (=F&"") | Plain text |
| T | Open score for app (=G&"") | Plain text |

Note: Columns S and T use =F4&"" formula to force text format so API returns R/X/SCR/DQ codes correctly.

### Controls Tab Structure
| Key | Value | Notes |
|---|---|---|
| trial_status | off_season | off_season, active, paused (dropdown) |
| off_season_message | The 2027 Trial will be held from 8-14 March 2027. See you at the National! | Editable any time |
| off_season_url | https://nationalsheepdogtrials.org.au | Link shown on off-season and paused screens |
| paused_message | That's all for today. We resume tomorrow at 8:30am. See you then! | Editable each evening |
| current_run | e.g. "23 Open" or "14 Maiden" | Run number + space + draw name. Set to 0 or blank when nobody on course |
| current_state | e.g. "Lunch break — back at 1:30pm" | Shown when current_run is blank/0 |
| ticker_message | e.g. "Day 3 underway · Ken Atherton leads on 97" | Scrolls in header. Update any time |
| video_url | YouTube Live URL | Blank = show video_message instead |
| video_message | e.g. "Live video will commence at 8:30am daily" | Shown when no video URL |
| audio_url | Radio Dog National stream URL | Blank = show audio_message instead |
| audio_message | e.g. "Radio Dog National broadcasts daily from 8am" | Shown when no audio URL |

### Score Value Conventions
| Value | Meaning |
|---|---|
| Number | Actual score |
| Blank | Not yet run (pending) |
| R | Retired |
| X | Eliminated |
| SCR | Scratched |
| DQ | Disqualified |

---

## App Structure

### Navigation
**Draw / Leaderboards / Media / Fun / Info**

### Draw tab
- Open/Improver sub-pill: run order with On Course Now, position badges, completed/pending counts
- Maiden sub-pill: same for Maiden draw
- current_run format: "23 Open" or "14 Maiden"
- current_state message shown when current_run is blank

### Leaderboards tab
Pills: Maiden Top 15 · Open Top 20 · Maiden Final · Improver Final · Open Final
- Qualifying leaderboards show live rankings with cut score indicator
- Finals show pending until data available, Champion stamp when all scores in

### Media tab
- Watch sub-pill: embedded video player or message from Controls
- Listen sub-pill: Radio Dog National player with RDN logo or message from Controls

### Fun tab
- Quiz sub-pill: 157 questions from public/questions.json, Novice/Handler/Champion levels, answer review at end
- Scorer sub-pill: spectator scoring tool, starts at 100, deduct buttons, obstacles, DQ, undo

### Info tab
- Competition structure diagram (public/How the National Works.png)
- Link to nationalsheepdogtrials.org.au

---

## Public Folder Files
| File | Purpose |
|---|---|
| NSDTA-logo.png | App icon and header logo (navy background) |
| RDN Logo.png | Radio Dog National logo on Listen screen |
| How the National Works.png | Competition structure diagram on Info screen |
| questions.json | Quiz questions — edit to add/update questions |

---

## Progress Log

### July 2026
- ✅ Eliza knowledge base expanded from NSDTA Journal Volume 6 (1988–2004): year-by-year National Championship results, roll of Open Champions, Champion of Champions winners, trophies, sponsor history, and newspaper stories (1991 dead heat, 1996 "Move over, Babe" SMH feature, 2002 insurance crisis, Greg Prince's 11 titles, George Westcott tribute)
- ✅ ELIZA_KNOWLEDGE in src/App.jsx regenerated from docs/eliza-knowledge-base_1.md (embed verified identical; JSX syntax check passed)
- ⚠️ Note: journal-era sources (Canberra Times 1995 & 2001, Westcott tribute) say trials began in **1942** at Manuka Oval; the KB's official history uses **1943**. Flagged inside the KB so Eliza can handle both.

### May 2026
- ✅ Project scoped and architecture agreed
- ✅ Architecture document created
- ✅ GitHub account confirmed (NatSheepDogs)
- ✅ Create GitHub repository (nsdta-pwa)
- ✅ Set up Netlify account
- ✅ Scaffold React + Vite + Tailwind project
- ✅ Connect Netlify to GitHub repo
- ✅ Create Controls tab in Google Spreadsheet
- ✅ Add trial_status dropdown (off_season / active / paused)
- ✅ Build Draw screens — Open/Improver and Maiden with live scores
- ✅ On Course Now indicator with current_run control
- ✅ current_state pause message
- ✅ Position badges in draw (e.g. "3rd Top 20", "2nd Imp")
- ✅ Completed/pending run counts
- ✅ Dynamic rank display next to scores
- ✅ Build Leaderboards — all 6 views (qualifying + finals)
- ✅ Top 20 leaderboard from dedicated sheet
- ✅ Finals leaderboards from dedicated sheets (Open Final, Improver Final, Maiden Final)
- ✅ Champion stamp on finals winners when all scores in
- ✅ Cut score indicator on qualifying leaderboards
- ✅ Build Watch screen with YouTube embed and fallback message
- ✅ Build Listen screen with RDN logo, play/pause and fallback message
- ✅ Build Info screen with competition diagram and website link
- ✅ Build Quiz — Novice/Handler/Champion levels, 157 questions, answer review
- ✅ Build Scorer — spectator scoring tool
- ✅ Scrolling ticker message in header
- ✅ Off-season, active and paused trial status screens
- ✅ PWA configuration — app installable on home screen
- ✅ App icon with navy background
- ✅ Navy blue theme matching website
- ✅ Font sizes increased for older/mobile users
- ✅ Search in Draw screens by competitor or dog name
- ✅ Dog names given equal prominence to competitor names
- ✅ What Kind of Sheep Dog Are You? quiz (10 random questions, 3 breeds)
- ✅ Dog photos randomly selected from public/dogs/ folder
- ✅ Share button with photo and pre-written social post
- ✅ Deep link ?fun=dogquiz opens quiz directly
- ✅ Champion stamp on finals winners
- ✅ Scores display as whole numbers
- ⬜ Configure custom subdomain (app.nationalsheepdogtrials.org.au)
- ⬜ Obtain and configure video stream URL
- ⬜ Obtain and configure Radio Dog National stream URL
- ⬜ Add more dog photos to public/dogs/ (currently 2 per breed)
- ⬜ Test thoroughly on real iOS and Android devices
- ⬜ Soft launch before March 2027 event

---

## Before March 2027 Event Checklist

- [ ] Configure custom subdomain app.nationalsheepdogtrials.org.au
- [ ] Obtain YouTube Live channel URL from camera operator
- [ ] Obtain Radio Dog National stream URL
- [ ] Update Controls sheet with correct 2027 event dates
- [ ] Test on multiple real devices (iPhone, Android)
- [ ] Share with a small group for feedback
- [ ] Brief the scoring team on Controls sheet operation
- [ ] Brief Radio Dog National on audio_url setup

---

## Next Step

**Configure custom subdomain app.nationalsheepdogtrials.org.au on Netlify and your domain registrar.**

## Dog Quiz Photo Library

Photos stored in `public/dogs/` — add more any time, update count in App.jsx:

| Breed | Folder | Prefix | Current count |
|---|---|---|---|
| Border Collie | public/dogs/border-collie/ | bc-001.png | 2 |
| Kelpie | public/dogs/kelpie/ | k-001.png | 2 |
| Lovable Mutt | public/dogs/mutt/ | m-001.png | 2 |

To add more photos: name them sequentially (bc-003.png, bc-004.png etc), update the `count` value in the DOG_PROFILES object in App.jsx.

