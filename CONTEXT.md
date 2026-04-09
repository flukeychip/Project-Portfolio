# Portfolio Site — CONTEXT.md

## Project Goal
Build a hardware-focused engineering portfolio hosted on GitHub Pages (flukeychip.github.io/portfolio) to show prospective employers Alexander's personal EE projects.

## Environment
- OS: Windows 11
- User: EE undergrad, not a software person — solution must be low-maintenance
- GitHub: github.com/flukeychip (existing account)
- Hosting: GitHub Pages, repo named `portfolio`

## Decisions Log
- **Plain HTML/CSS/JS chosen over Jekyll/Hugo** — no build process, nothing to install, easy to edit for a non-software user. One data file (js/projects.js) acts as the CMS.
- **Single-page app with modal detail view** — no 14 separate HTML files to maintain. Projects defined as a JS array; clicking a card opens a modal. Easier to update.
- **Dark theme, cyan accent** — professional, engineering aesthetic. Avoids generic blue.
- **Separate repo `portfolio`** — keeps personal GitHub site (flukeychip.github.io) untouched.
- **.nojekyll file** — disables Jekyll processing so GitHub Pages serves raw HTML.

## Structure
```
portfolio/               ← GitHub repo root
  index.html             ← entire site (one file)
  css/style.css          ← all styles
  js/projects.js         ← PROJECT DATA — edit this to update content
  js/main.js             ← rendering + interactions (don't edit)
  assets/
    laser-engraver/      ← drop photos here → add paths to projects.js
    sand-plotter/
    buck-converter/
    6dof-arm/
    heartbeat-detector/
    drink-dispenser/
    esp32-testbench/
    h-bridge/
    led-controller/
    necklace-organizer/
    pantilt/
    parametric-speaker/
    parallax-projector/
    rotary-subwoofer/
  .nojekyll              ← required for GitHub Pages raw HTML
```

## How to Add Content Per Project
1. Drop photos/videos into the matching `assets/<project>/` folder
2. Open `js/projects.js`
3. Find the project object
4. Add image paths to the `images` array: `["assets/laser-engraver/1.jpg", ...]`
5. Update `description` with your write-up
6. Add file links to `files` array: `[{ name: "Schematics", url: "assets/laser-engraver/schematic.pdf" }]`
7. Commit and push — site updates automatically

## Surfaced Assumptions
- Alexander will write his own project descriptions (placeholders are in projects.js)
- Photos will be added project-by-project over time
- No contact form needed (GitHub link is sufficient for now)
- Employer audience: EE/hardware companies, internship/new grad roles

## Open Questions
- None currently

## Current Direction
Site built. Next step: push to GitHub, enable Pages, add content per project.

## Learned Rules
_(none yet)_
