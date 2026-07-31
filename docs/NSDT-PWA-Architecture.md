# National Sheep Dog Trial Championships — PWA Documentation

*Last updated: July 2026*

---

## Overview

The NSDTA PWA is a Progressive Web App built for spectators, competitors and followers of the National Sheep Dog Trial Championships. It provides live scores, leaderboards, media streaming, interactive quizzes and competition information — all driven from a Google Spreadsheet that event staff update in real time.

The app is designed for an older audience on mobile phones, with large fonts, minimal interaction steps and a simple navigation structure.

---

## Accounts & Products

### GitHub
- **Product:** GitHub Free
- **Account:** natsheepdogs@gmail.com
- **Organisation:** NatSheepDogs (https://github.com/NatSheepDogs)
- **Repository:** nsdta-pwa (https://github.com/NatSheepDogs/nsdta-pwa)
- **Purpose:** Source code storage and version control
- **Cost:** Free
- **Notes:** Main branch auto-triggers Netlify deploys on every push

### Netlify
- **Product:** Netlify Free (Starter) tier
- **Account:** natsheepdogs@gmail.com
- **Dashboard:** https://app.netlify.com
- **Site URL:** https://nsdta-pwa.netlify.app
- **Purpose:** Hosting and automatic deployment
- **Cost:** Free (100GB bandwidth/month, more than sufficient)
- **Connected to:** GitHub NatSheepDogs/nsdta-pwa repository
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Notes:** Deploys automatically within ~60 seconds of a GitHub push. Custom subdomain (app.nationalsheepdogtrials.org.au) to be configured here.

### Google Workspace
- **Product:** Existing Google Workspace account
- **Purpose:** Google Sheets for live event data
- **Spreadsheet:** National Sheep Dog Trial Championships data
- **Spreadsheet ID:** 1H8cjA_UCOBlo6pZmJd104y74OnRNThk7c7ZevAY0w8I
- **Access:** Public (anyone with link can view — no API key required)
- **Cost:** Existing subscription — no additional cost for app use
- **Notes:** The app uses the Google Visualisation API (gviz/tq endpoint) which is free and requires no authentication for public spreadsheets

### Domain Registrar (nationalsheepdogtrials.org.au)
- **Purpose:** Custom subdomain for the app
- **Target:** app.nationalsheepdogtrials.org.au → Netlify
- **Status:** ⬜ Not yet configured
- **How to configure:** Add a CNAME record in your DNS settings pointing app to your Netlify site URL, then add the custom domain in the Netlify dashboard under Domain Settings

### Node.js & Development Tools
- **Node.js:** v24.16.0 (installed on development Mac)
- **VS Code:** Installed, connected to GitHub
- **Local dev server:** `npm run dev` → http://localhost:5173
- **Build:** `npm run build` → produces dist/ folder

### Radio Dog National (future)
- **Purpose:** Audio stream for the Listen screen
- **Integration:** Stream URL added to Controls sheet as `audio_url`
- **Status:** ⬜ URL not yet obtained — contact Radio Dog National prior to event
- **Notes:** Supports Icecast/Shoutcast streams and direct audio URLs

### YouTube (future)
- **Purpose:** Live video stream for the Watch screen
- **Integration:** YouTube Live URL added to Controls sheet as `video_url`
- **Status:** ⬜ URL not yet obtained — confirm with camera operator prior to event
- **Notes:** App handles YouTube URL formats automatically and embeds the player

---

## Architecture

### Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | React 18 + Vite | Single page application |
| Styling | Tailwind CSS + inline styles | Mobile-first |
| Hosting | Netlify (free tier) | Auto-deploys from GitHub |
| Data | Google Sheets API (gviz/tq) | Public spreadsheet, no API key required |
| PWA | vite-plugin-pwa | Installable, offline-capable |
| Source control | GitHub (NatSheepDogs/nsdta-pwa) | Main branch auto-deploys |

### Data Flow

```
Google Spreadsheet
       ↓
Google Sheets API (gviz/tq endpoint)
       ↓
React app fetches every 30 seconds
       ↓
State updated → UI re-renders
```

No backend server. No database. No API keys. All data is read directly from the public Google Spreadsheet using the Google Visualisation API.

### File Structure

```
nsdta-pwa/
├── src/
│   └── App.jsx          ← Entire application (single file)
├── public/
│   ├── NSDTA-logo.png           ← App icon and header logo
│   ├── RDN Logo.png             ← Radio Dog National logo
│   ├── How the National Works.png  ← Competition structure diagram
│   ├── questions.json           ← Quiz questions (157 questions)
│   └── dogs/
│       ├── border-collie/       ← bc-001.png, bc-002.png ...
│       ├── kelpie/              ← k-001.png, k-002.png ...
│       └── mutt/                ← m-001.png, m-002.png ...
├── vite.config.js       ← Vite + PWA configuration
├── package.json
└── index.html
```

### Google Spreadsheet

**Spreadsheet ID:** `1H8cjA_UCOBlo6pZmJd104y74OnRNThk7c7ZevAY0w8I`

| Tab | Purpose |
|---|---|
| Open Draw | Open and Improver competitors, run order, scores |
| Maiden Draw | Maiden competitors, run order, scores |
| Top 20 | Top 20 finalists with combined scores |
| Maiden Final | Maiden Final results |
| Improver Final | Improver Final results |
| Open Final | Open Final results |
| Controls | App configuration toggles |

#### Open Draw Score Columns
The Open Draw uses two plain-text mirror columns because the Google Sheets API returns null for text values (R, X, SCR, DQ) in number-formatted cells:

| Column | Purpose | Formula |
|---|---|---|
| F | Improver numeric score | Number format |
| G | Open numeric score | Number format |
| S | Improver score for app | `=F4&""` (plain text) |
| T | Open score for app | `=G4&""` (plain text) |

#### Score Value Conventions

| Value | Meaning |
|---|---|
| Number | Actual score |
| Blank | Not yet run — shown as pending |
| R | Retired |
| X | Eliminated |
| SCR | Scratched |
| DQ | Disqualified |

Non-numeric scores are displayed as a red badge and treated as 0 for ranking purposes.

---

## Controls Sheet

The Controls sheet drives all real-time messaging and configuration. Event staff update it during the event to control what the app shows.

| Key | Purpose | Example value |
|---|---|---|
| `trial_status` | App mode | `off_season` / `active` / `paused` |
| `off_season_message` | Message shown off-season | "The 2027 Trial will be held 8-14 March" |
| `off_season_url` | Link shown off-season | https://nationalsheepdogtrials.org.au |
| `paused_message` | Message shown when paused | "That's all for today. We resume at 8:30am" |
| `current_run` | Current runner on course | `23 Open` or `14 Maiden` |
| `current_state` | Message when nobody on course | "Lunch break — back at 1:30pm" |
| `ticker_message` | Scrolling header message | "Day 3 underway · Ken Atherton leads on 97" |
| `video_url` | YouTube Live URL | Blank = show video_message |
| `video_message` | Shown when no video URL | "Live video commences at 8:30am daily" |
| `audio_url` | Radio Dog National stream URL | Blank = show audio_message |
| `audio_message` | Shown when no audio URL | "Radio Dog National broadcasts from 8am" |

### Trial Status Behaviour

| Status | What the app shows |
|---|---|
| `off_season` | Full-screen off-season message with website link |
| `active` | Full app with all features |
| `paused` | Full-screen pause message (end of day etc) |

### Current Run Format

`current_run` uses a space-separated format: **run number + draw name**

- `23 Open` → highlights run 23 in the Open/Improver draw
- `14 Maiden` → highlights run 14 in the Maiden draw
- Blank or `0` → no runner highlighted; shows `current_state` message

When the Open draw is active, the Maiden draw shows who is currently on course in the Open.

---

## Features

### Draw Tab

Displays the run order for the Open/Improver and Maiden draws.

**Sub-pills:** Open/Improver · Maiden

**For each competitor:**
- Run number
- Competitor name (bold)
- Dog name (prominent, same size)
- Class tag (Open / Improver / Maiden)
- Score — numeric scores in navy, non-completion codes (R, X, SCR, DQ) in red
- Current rank below score (dynamic, updates every 30 seconds)
- Position badge (e.g. "3rd Top 20", "2nd Imp") for qualifying positions

**Special states:**
- **On course now** — yellow card shown at top for the current runner
- **Pause message** — blue card shown when `current_run` is blank
- **Other draw active** — Maiden draw shows who is running in Open when Open is active
- **Completed count** — shows runs completed and pending

**Search:** Filter by competitor name or dog name in real time.

**Data auto-refreshes every 30 seconds.**

---

### Leaderboards Tab

Shows live rankings and final results.

**Sub-pills:** Open Top 20 · Maiden Top 15 · Maiden Final · Improver Final · Open Final

| Leaderboard | Source sheet | Score formula |
|---|---|---|
| Open Top 20 | Top 20 | 1st run + Top 20 run |
| Maiden Top 15 | Maiden Draw | 1st run score |
| Maiden Final | Maiden Final | 1st + Top 15 + Final |
| Improver Final | Improver Final | 1st + Final |
| Open Final | Open Final | 1st + Top 20 + Final |

**Qualifying leaderboards** show a cut score indicator and "below cut" section.

**Finals leaderboards** show pending state until data is available, then display all competitors sorted by total. When all competitors have a final score, the winner receives a **🏆 Champion stamp** with gold border.

---

### Media Tab

**Sub-pills:** Watch · Listen

**Watch:**
- If `video_url` is set in Controls → embeds YouTube Live player (16:9, full width)
- If blank → shows `video_message`
- Handles YouTube URL formats automatically

**Listen:**
- If `audio_url` is set → shows Radio Dog National logo with play/pause button
- Audio continues playing while user browses other tabs
- If blank → shows `audio_message`

---

### Fun Tab

**Sub-pills:** Quiz · What dog? · Scorer

#### Quiz
- 157 questions loaded from `public/questions.json`
- Three difficulty levels: 🌱 Novice (Easy) · 🐕 Handler (Medium) · 🏆 Champion (Hard)
- 10 random questions selected per session from chosen difficulty
- A/B/C/D letter buttons with colour-coded correct/incorrect feedback
- Explanation shown after each answer
- Progress bar and dot indicators
- Full answer review at end with correct answers for wrong answers

**To add or update questions:** edit `public/questions.json` and redeploy. No code changes needed.

#### What dog?
- 20 personality questions, 10 randomly selected per session
- Scores toward Border Collie, Kelpie or Lovable Mutt
- Result shows breed name, tagline, personality description and a random photo from the matching breed folder
- **Share button** — opens native share sheet with dog photo and pre-written social post
- **Deep link** — `?fun=dogquiz` in the URL opens the quiz directly (used in shared posts)

**Share post text:**
> 🐾 I just found out I'm a [Breed] at the National Sheep Dog Trial Championships in Hall Village, Canberra! Are you a Border Collie, Kelpie or Lovable Mutt? Find out 👇 [url] #NationalSheepdogTrial #NSDTA2027

**To add more dog photos:**
1. Name files sequentially: `bc-003.png`, `bc-004.png` etc
2. Place in the correct folder: `public/dogs/border-collie/`
3. Update the `count` value in `DOG_PROFILES` in `App.jsx`
4. Push to GitHub

| Breed | Folder | Prefix | Count |
|---|---|---|---|
| Border Collie | public/dogs/border-collie/ | bc- | 2 |
| Kelpie | public/dogs/kelpie/ | k- | 2 |
| Lovable Mutt | public/dogs/mutt/ | m- | 2 |

#### Scorer
Spectator scoring tool for following along with the judge.

- Starts at 100 points
- Deduct 1-5 points per fault
- Obstacle buttons: Race (−7), Bridge (−8), Pen (−10) — each usable once per run
- Disqualify (DQ) button
- Undo last action
- Fault log showing all deductions
- New trial button resets everything

---

### Info Tab

- Competition structure diagram (`/How the National Works.png`)
- 7-day event schedule table (Mon–Sun, Morning/Afternoon sessions)
- Link to nationalsheepdogtrials.org.au

---

## PWA Configuration

The app is a Progressive Web App — it can be installed on iPhone and Android home screens.

**On iPhone:** Safari → Share button → Add to Home Screen
**On Android:** Chrome → three dots menu → Add to Home Screen

Once installed it opens full screen with no browser chrome, using the NSDTA icon.

**Offline capability:** The PWA caches the app shell and static assets. Google Sheets data requires an internet connection (cached for 5 minutes).

---

## Deployment

### Automatic Deploy Pipeline
```
Edit src/App.jsx locally
       ↓
git add . && git commit -m "message" && git push
       ↓
Netlify detects push → builds automatically (~60 seconds)
       ↓
Live at https://nsdta-pwa.netlify.app
```

### Manual Steps Required
- Replace `src/App.jsx` with updated file
- Replace `public/` assets as needed
- Push to GitHub

---

## URLs

| URL | Status |
|---|---|
| https://nsdta-pwa.netlify.app | ✅ Live |
| app.nationalsheepdogtrials.org.au | ⬜ Not yet configured |

---

## Before March 2027 Event Checklist

- [ ] Configure custom subdomain `app.nationalsheepdogtrials.org.au`
- [ ] Obtain YouTube Live channel URL from camera operator
- [ ] Obtain Radio Dog National stream URL
- [ ] Update `ticker_message`, `off_season_message`, `paused_message` for 2027
- [ ] Add more dog photos (aim for 10+ per breed)
- [ ] Test on multiple real devices (iPhone, Android)
- [ ] Share with a small group for feedback
- [ ] Brief the scoring team on Controls sheet operation
- [ ] Brief Radio Dog National on `audio_url` setup
- [ ] QR code printed for gate and around grounds
- [ ] Share app URL in competitor entry confirmations and social media

---

## Ranking Formulas (Google Sheets)

When score columns are number-formatted, use these formulas for ranking alongside R/X/SCR/DQ values:

**Open Rank:**
```
=IF(G4="","",IF(ISNUMBER(G4),RANK(G4,$G$4:$G$161,0),RANK(0,$G$4:$G$161,0)))
```

**Improver Rank:**
```
=IF(F4="","",IF(ISNUMBER(F4),RANK(F4,$F$4:$F$161,0),RANK(0,$F$4:$F$161,0)))
```

**IMP Final qualifier:**
```
=IF(F4="","",IF(ISNUMBER(F4),IF(H4<=5,"IMP FINAL",""),""))
```

---

*Documentation maintained in the GitHub repository docs/ folder.*
