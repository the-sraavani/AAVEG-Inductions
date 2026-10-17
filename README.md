# AAVEG / Inductions 2026: "The AAVEG Archive"

A static website made of plain HTML, CSS and JavaScript. No Node.js, no npm, no build step, no server.

```
aaveg-inductions/
├── index.html          Intro screen + team selection screen
├── operations.html     Team page
├── content.html        Team page
├── design.html         Team page
├── photography.html    Team page
├── style.css           All styling (colours are at the top)
├── script.js           All behaviour (carousels, navigation, apply buttons)
├── fonts/              Anton, Inter, IBM Plex Mono (open licence, bundled so it works offline)
├── images/
│   ├── intro/                   4 intro carousel photos
│   └── teams/
│       ├── operations/          1 team photo (used for the card and the page hero)
│       ├── content/             card + hero + 4 carousel photos
│       ├── design/              1 team photo
│       └── photography/         1 team photo
└── README.md
```

> The photos and application links in this version are the real ones supplied for AAVEG Inductions 2026.

---

## 1. Preview on your laptop

Double-click `index.html`. It opens in your browser and everything works.

(Optional) If you have Python installed, running `python -m http.server` in this folder and opening `http://localhost:8000` behaves exactly like the live site. You never *need* this.

## 2. Replace or add photos

**Easiest way:** put your photo in the same folder with the **same file name** as the one it replaces. For example, overwrite `images/teams/design/design-team.jpg` with a new Design photo, keeping the name. The extension must match exactly (`.jpg`, not `.jpeg` or `.JPG`), because GitHub is case-sensitive.

**Or** use any name and change the `src="..."` in the HTML file (and the `alt="..."` text so it describes your photo).

Where each photo is used:
- **Intro screen:** `images/intro/01…04` (captions THE CROWD, BEHIND THE SCENES, THE NIGHT, EVERYTHING IN BETWEEN).
- **Team selection cards:** set in `index.html` (search for `team-card`).
- **Top of a team page:** the `hero__img` block in that team's HTML file.
- **Operations, Design and Photography** each have one photo, so their pages have no carousel. **Content** has a four-photo carousel.

**Adding a carousel to another team page:** open `content.html`, copy the whole `<section class="gallery"> … </section>` block, paste it into the other team's page just before the `<!-- ===== ABOUT THE TEAM ===== -->` comment, and change the image names, alt text and captions. Add at least two `<figure class="slide">` blocks. Carousels need two or more photos.

Tips:
- Use **JPG**, around **1600 px wide**, ideally under 400 KB each. Large photos make the site slow on phones.
- Photos are cropped to fit. To change which part shows, add `style="object-position:50% 20%"` to the `<img>` (the numbers are left-right and top-bottom, in percent).
- For a tall photo in a carousel, add `fit-contain` to its `<div class="photo">` (so it reads `class="photo fit-contain"`) to show it uncropped.
- If an image ever fails to load, the site shows a labelled dark panel instead of a broken icon.

## 3. Edit text and team descriptions

All text is plain HTML.
- **Intro paragraph, captions, team card descriptions:** open `index.html` and search for the words you want to change.
- **Team page tagline, "About the team" paragraphs, carousel captions:** open that team's `.html` file. Each section is labelled with a comment such as `<!-- ===== ABOUT THE TEAM ===== -->`.

## 4. Change an application link

Open the team's HTML file and find the section marked `APPLY`. Change the `href`:

```html
<a class="apply-btn" href="https://docs.google.com/forms/d/e/…/viewform">
```

**Safety switch:** to close applications for a team without removing the button, add `data-apply="off"` to that `<a>`. The button turns grey and dashed and can't be clicked through. Remove `data-apply="off"` to open it again. A link that still contains `example.com` is also disabled automatically.

## 5. Create a GitHub repository

1. Create a free account at <https://github.com> and sign in.
2. Click **+** (top right) → **New repository**.
3. Name it, for example `aaveg-inductions`. Choose **Public** (free GitHub Pages needs a public repo on most accounts).
4. Leave the "Add a README" boxes **unticked** (this folder already has one). Click **Create repository**.

## 6. Upload the files

The simple way, no tools needed:
1. On the new empty repository page, click **uploading an existing file**.
2. Open this project folder on your computer, select **everything inside it** (`index.html`, the other `.html` files, `style.css`, `script.js`, `README.md`, and the `fonts` and `images` folders) and drag it into the browser window. Make sure `index.html` ends up at the **top level** of the repository, not inside an extra folder.
3. Wait for the uploads to finish, then click **Commit changes**.

## 7. Turn on GitHub Pages

1. In the repository, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Under **Branch**, choose **main** and the folder **/ (root)**, then click **Save**.

## 8. Find and share the live URL

Wait 1–2 minutes, then refresh **Settings → Pages**. A box at the top says *"Your site is live at …"*. It looks like:

```
https://YOUR-USERNAME.github.io/aaveg-inductions/
```

Share that link. All links in the site are relative, so it works from that sub-path (and from a custom domain too).

## 9. Update the site later

Edit the files on your laptop, then in your repository click **Add file → Upload files**, drag in the changed files (same names and folders), and **Commit changes**. The live site refreshes in about a minute. If you don't see changes, hard-refresh the browser (Ctrl+Shift+R, or Cmd+Shift+R on Mac).

---

## Changing colours and fonts

At the top of `style.css`, in `:root { … }`, the five brand colours are variables (`--ink`, `--paper`, `--orange`, `--grey`, `--white`). Fonts are loaded from the `fonts/` folder, so they work with no internet connection.

## Accessibility and behaviour notes

- Works with a keyboard: Tab through everything, Enter / Space on the intro to continue, and ← / → on a focused carousel.
- Visible focus outlines; carousel buttons have labels; the intro carousel has a PAUSE button.
- If the visitor's device is set to "reduce motion", automatic sliding and animations are turned off.
- BACK on a team page returns to the team selection screen at the same scroll position. If someone opens a team page directly, BACK goes to `index.html#teams`.
- Opening `index.html#teams` skips the intro and shows the team selection screen.

## Troubleshooting

- **A page looks unstyled / images missing on GitHub:** the folders were uploaded one level too deep. `index.html` must sit at the top of the repository.
- **A file name has capital letters:** GitHub Pages is case-sensitive (`Photo.JPG` ≠ `photo.jpg`). Match the name in the HTML exactly.
