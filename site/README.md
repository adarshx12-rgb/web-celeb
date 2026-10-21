# Little Cheers

A celebration homepage with a GSAP ScrollTrigger gallery, occasion and recipient filters, and a local template editor.

The gallery pins at the top of the viewport for a scroll-controlled sequence. Alternating columns travel upward and downward with staggered timing; the next section resumes after the sequence ends. Scrolling backward reverses the sequence. Filtering, expanding the gallery, or enabling reduced motion removes the pin. Travel distances are recalculated when ScrollTrigger refreshes after resizing or font loading.

Cards sit at different perspective depths and change depth and tilt throughout the scroll sequence. Mouse movement adds a gently eased parallax offset and surface lighting, with stronger movement on foreground cards. Touch devices retain the scroll-driven effect. Reduced motion disables both effects.

From the parent project, run `npm run dev` and open http://localhost:5173. Run `npm run build` to produce `site/dist`.

The editor supports text, colors, local photo uploads, browser-local draft saving, and downloadable HTML keepsakes. Uploaded photos are resized in the browser and embedded in exports. Sample photos use Unsplash URLs; fonts use Google Fonts with local fallbacks.

## Headliner concert birthday

Open `/concert.html`, or choose Headliner in the homepage gallery. All gallery templates now open in a new tab; the other templates have a full-page preview at `/template.html?id=...`.

Headliner uses the supplied Higgsfield images as optimized local WebP assets. Enter concert switches to a viewport-filling arena and starts at scroll zero. The camera advances from the wide crowd view to the stage; foreground silhouettes move faster to create depth. Branding and editorial overlays disappear, and the stage stays on screen at the end. Move the pointer, tap, or use Tab to reveal Edit screens, Replay, and Exit; Escape exits the concert when the editor is closed.

Six individually animated flame sprites are visible from the start and grow with scroll. The close stage has its own six jets, which subside as the memories begin. The sprites reuse the fire in the supplied artwork, with feathered edges, warm light spill, and particles; they are not generated video or a physical simulation. Additional SVG spotlights sweep with scroll progress; the lighting baked into the supplied artwork remains static.

Uploaded photos, individual photo captions, the screen headline, names, ages, crowd placards, messages, and sender names are editable. Photo framing can preserve the full image or fill the screen. LED contents are mapped to the screen corners using projective transforms, with pixel texture and light spill. Photos progress with scroll and can also be changed with previous/next controls. Local drafts use a separate key for the concert. Downloaded HTML includes GSAP, the artwork, and uploaded photos; sample photos and Google Fonts require internet. The recipient copy hides editing controls. Reduced-motion users get a static stage with photo navigation, and the dedication remains available to screen readers.

`scripts/check-concert.cjs` checks entry, fire elements, photo/text editing, exit/reentry, and mobile sizing in Playwright using installed Microsoft Edge. Set `CONCERT_PLAYWRIGHT_PATH` to the available Playwright package if it is not installed locally. Browser launch is currently blocked in the coding sandbox (`spawn EPERM`), so this check must be run in an environment that permits browser processes.

`scripts/prepare-concert.cjs` prepares web assets from the user's original files using Sharp (a development tool, not a runtime dependency). Original files in Downloads are never modified. The generated `placements.json` records estimated crop positions in the 3840 × 2160 master. The small runway cutout is retained as an asset but not displayed because the original crowd strip already contains that detail at a more appropriate scale.

This version does not provide accounts, a database, or hosted links for individual celebrations. Drafts are specific to the browser and device. Publishing that platform functionality requires a backend.

GSAP and ScrollTrigger are copied from the installed parent dependencies during the build. React and Motion are installed for subsequent application work; this homepage uses vanilla JavaScript and GSAP.
