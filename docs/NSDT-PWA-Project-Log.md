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

## Architecture Summary

See separate file: `NSDT-PWA-Architecture.md`

---

## Progress Log

### May 2026
- ✅ Project scoped and architecture agreed
- ✅ Architecture document created
- ✅ GitHub account confirmed (NatSheepDogs)
- ✅ Create GitHub repository (nsdt-pwa)
- ✅ Set up Netlify account
- ✅ Scaffold React + Vite + Tailwind project
- ✅ Connect Netlify to GitHub repo
- ✅ Configure custom subdomain on Netlify (deferred to pre-launch)
- ✅ Build Google Sheets API connection
- ⬜ Build Scores screen
- ⬜ Build Watch screen
- ⬜ Build Radio screen
- ⬜ Build Schedule screen
- ⬜ Build Info screen
- ⬜ PWA configuration (manifest, service worker)
- ⬜ Test on Android and iOS devices
- ⬜ Soft launch

---

## Next Step

**Create the GitHub repository** — name: `nsdt-pwa`, public repository, initialise with a README.
