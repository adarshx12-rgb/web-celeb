# Anniversary — storyboard & spec

Scroll-driven film, **35 seconds**. Faces stay hidden everywhere except one deliberate reveal: her face at the palat turn (scene07-palat-turn.png). Spider-Verse-inspired comic art style (never name the film/studio in prompts). Train scene is a DDLJ homage; everything else is universal. Faces are never clearly visible. Red is the through-line: her scarf → the leaf.

## Storyboard

| # | Beat | Clip | Shot | Palette | Code overlay |
|---|---|---|---|---|---|
| 0 | Hook | K1 still | Countryside station, golden hour, train waiting | Saffron + teal, halftone | Title caption box; comic split-panels merge on scroll |
| 1 | Frozen moment | C1 · 5s | Time is frozen: he leans from the door, she is mid-stride chasing, pigeons and steam hang in the air; only the camera glides from the front view around to the side view | Saffron + teal | "CHUK-CHUK!" |
| 2 | She runs | C2 · 5s | Camera behind her shoulder, chasing his hand | Saffron, chromatic fringe | Split panels: feet / hand / clock |
| 3 | Hands meet | C3 · 4s | Code crash-zoom from C2's last frame into the hands (zoom lines, flash) lands on C3's matching close-up; hands clasp | Freeze to one halftone panel | Hearts pop, pink grade, "THUMP THUMP" |
| 4 | Into the spotlight | C4 · 3s | Same hands under a pink spotlight; pull back to ballroom floor | Indigo dark, warm-pink spot | Pink paint wipe hides the cut |
| 5 | Dance | C5 · 6s | From arms outstretched, he draws her in; she twirls into his arms, his hand on her waist, closed dance hold, swaying. Camera descends and moves in, arcing to end behind his shoulder | Pink spotlight, particles, soft DOF; couples dancing in the dark | Motes in the beam |
| 6 | Walk away | C6 · 4s | She steps back, hands slide apart, she turns and walks away into depth; the spotlight dims and the ballroom dissolves into darkness | Pink → dark | Match-dissolve into scene07-porch (same composition: him left foreground, her walking away center-right) |
| 7 | Palat | C7 · 5s | Continues from the match-dissolve; over his shoulder at the gate; she stops at the door, turns, rim-lit profile | Lilac night, amber porch | "Palat… palat…" + "(turn around)" |
| 8 | Leaf | C8 · 4s | Slow pull-back, house glows | Lilac + amber | Red leaf PNG falls with scroll, lands, end note written on it |

Runtime: 4 + 5 + 4 + 3 + 6 + 4 + 5 + 4 = **35s**. Scroll distance is set separately; the hands, palat turn, and leaf get extra scroll room.

---

## Consistency rules (read before generating anything)

1. **Lock the look first.** Generate the two character sheets and K1. Don't make any video until all three look right together. These three images are the **style bible** — attach them as reference images to every later generation.
2. **Paste the blocks verbatim.** STYLE, NO FACES, HERO, HEROINE, and NEGATIVE are copied exactly into every prompt. Never paraphrase — small wording changes cause drift.
3. **Keyframe first, then animate.** Every clip starts from an approved still (image-to-video), never text-to-video. Make the still with the image model using the character sheets as references.
4. **Chain the clips.** Where marked "start = previous last frame", extract that frame and use it as the start image:
   `ffmpeg -sseof -0.1 -i clip04-spotlight.mp4 -frames:v 1 clip04-last-frame.png`
   If the video model accepts an end frame too, give it the next keyframe.
5. **One model, one setup.** Same image model, same video model, 16:9, 1080p, 24 fps for every shot. Reuse the seed of the first good result when the model exposes it.
6. **Two wardrobes, one switch.** Casual (C1–C3): HERO / HEROINE blocks. Formal (C4 onward — ballroom and the walk home): HERO-FORMAL / HEROINE-FORMAL blocks. The switch happens only at the C3→C4 pink wipe. Gold ring on her reaching hand (right) in every hands close-up. Red is always on her: the scarf, then the gown.
7. **Screen direction.** K1/C1: camera looks back along the train; it rolls forward toward the **right foreground**, the open door coming toward camera. C2 onward is the reverse angle, looking in the direction of travel: **train on the left, platform on the right**, she runs away from camera. His hand always enters from the **left**, hers from the **right** (C2, C3, C4 match).
8. **Light direction.** Station: low sun behind the train, backlighting him. Ballroom: one spotlight directly overhead. House: porch lamp to the left of the door, amber, rim-lighting her profile from screen left.
9. **Faces.** Reject any take where a face is readable. Fixes: "seen from behind", "silhouette against the light", "face in deep shadow", "hair falling across face".
10. **Generate 3 takes per shot.** Reject for: readable faces, style drift toward smooth 3D/Pixar, missing ink lines or halftone, wrong hand count or merged fingers, scarf missing or wrong color, any text or signage, a camera cut inside the clip.
11. **Frozen world.** In the train scenes the train never moves in the clip (motion is implied by drawn speed lines and code overlays). He is rigidly anchored in the doorway: feet on the step, hand on the rail. A moving train plus a near-still hero makes the model slide him through the coach walls.
12. **Camera moves, characters don't.** Every clip is extreme slow motion with characters nearly still — only hair, fabric, scarf, particles, and small essential gestures (the hands reaching and closing) move. The camera carries the shot. Running, stepping, and twirling go in the negative prompt. Character motion is what makes AI video look cheap.
13. **Keep a log.** For each kept take: file name, model, seed, start image, prompt version. Reshoots then match.

**NEGATIVE (if the model has a negative prompt field):** visible face, detailed facial features, eye contact, photorealistic, smooth plastic 3D, soft blurry outlines, text, letters, subtitles, signage text, logo, watermark, extra fingers, merged fingers, deformed hands, extra people in foreground, camera cut, scene change, outfit change, color flicker.

---

## Prompt blocks

**STYLE:** stylized 3D animated feature in a hand-drawn comic book print look: 3D characters and sets with real volume and dramatic lighting, finished with hand-inked black linework, cross-hatching lines in the shadows instead of soft gradients, Ben-Day halftone dots, CMYK print misregistration with red and cyan offset edges, chromatic aberration on out-of-focus areas, bold saturated colors, painterly brush textures in backgrounds, animated on twos. Not photorealistic, not smooth plastic 3D, not vintage sepia illustration. No text, letters, logos or watermarks.

**NO FACES:** faces never clearly visible — characters seen from behind, in silhouette, backlit, in rim-lit profile, or with faces in shadow or covered by hair.

**HERO:** slim man, late 20s, tousled dark hair, worn brown leather jacket over a cream knit sweater, dark charcoal trousers, dark leather lace-up boots.

**HEROINE:** slim woman, mid 20s, long wavy dark-brown hair, flowing knee-length white dress that flares when she spins, long red scarf, simple tan leather flats, thin gold ring.

**HERO-FORMAL:** same man, dark hair now neatly styled and swept back, tailored black tuxedo with satin lapels, crisp white shirt, black silk bow tie, white pocket square, polished black oxford shoes.

**HEROINE-FORMAL:** same woman, long dark-brown hair in soft glossy waves, half-up with a small gold butterfly hair clip, floor-length deep-red silk satin gown with an open back and a flowing skirt that flares when she spins, thin gold ring, small gold drop earrings.

**HANDS:** anatomically correct hands, five fingers each.

---

## Step 1 — Style bible (images)

**character-hero-casual.png** — HERO, character turnaround sheet: back view, three-quarter back view, side view as a backlit silhouette, full body, plain warm paper background, same outfit in every view. NO FACES. STYLE.

**character-heroine-casual.png** — HEROINE, character turnaround sheet: back view, three-quarter back view, side view as a backlit silhouette, plus one pose mid-spin with the dress flaring and red scarf arcing, full body, plain warm paper background, same outfit in every view. NO FACES. STYLE.

**character-hero-formal.png** — (attach character-hero-casual.png) HERO-FORMAL, same turnaround layout, background, and style as the reference. NO FACES. STYLE.

**character-heroine-formal.png** — (attach character-heroine-casual.png) HEROINE-FORMAL, same turnaround layout, background, and style as the reference, including the mid-spin pose with the gown flaring. NO FACES. STYLE.

**scene01-station.png** — A small countryside railway station at golden hour, a vintage maroon-and-cream passenger train waiting at the platform facing right, soft steam drawn as ink swirls, iron pillars, a wooden bench, pigeons as graphic shapes on the roof, yellow flowering fields beyond the tracks in halftone, low sun behind the train, blank signboards, empty platform, wide low-angle shot, saffron and teal palette. STYLE.

## Step 2 — Keyframes (images, with the style bible attached)

**scene01-frozen.png** — EDIT of scene01-station.png: add both characters in the exact poses of scene01b-side-chase, seen from this angle, frozen in time; pigeons and steam suspended mid-air.

**scene01b-side-chase.png** — (attach scene01-station, scene02-run-to-train, casual sheets) Side view from the platform, perpendicular to the moving train, strong backlight from the low sun behind the train: he stands in the open coach doorway (center-right) holding the rail, leaning out, arm reaching back to the left; she runs in from the left along the platform, mid-stride, reaching toward him, a few meters behind the door. Both rim-lit silhouettes, faces in shadow. Train moves left → right. = end of clip01, start of clip02 (the camera then swings around behind her).

**scene02-run-to-train.png** — Over-the-shoulder view from close behind HEROINE running along the railway platform, the moving vintage maroon-and-cream train on the left side of frame, platform pillars on the right, her hair and red scarf streaming back toward camera, white dress fluttering. Ahead, HERO's leather-sleeved arm reaches back out of the open coach door. Low golden sun flaring beyond the train, saffron and teal palette. NO FACES. HANDS. STYLE.

**scene03-hands-reaching.png** — (attach scene02-run-to-train.png, both casual sheets) Extreme close-up continuing the k2 framing: his hand in a brown leather jacket sleeve reaching down from the upper left out of the train door, her open hand with a gold ring reaching in from the right, fingertips almost touching, the low golden sun flaring in the gap between them, the maroon coach edge soft and blurred on the left, ink speed lines and heavy halftone in the defocused background. HANDS. STYLE.

**scene03-hands-held.png** — EDIT of scene03-hands-reaching.png (image-edit model, same frame): only the hands change — his hand closes around hers palm to palm, his fingers wrapping the back of her hand, her fingers curling around the edge of his palm, her thumb resting over the back of his hand. Arm angles, sleeves, background, sun, framing unchanged. This is C3's end frame.

**scene04-hands-spotlight.png** — EDIT of scene03-hands-held.png: hands, pose, position, and framing stay pixel-identical; only his sleeve → black tuxedo + white cuff + cufflink, her sleeve → bare arm, background → deep indigo darkness with soft warm-pink spotlight from above and haze. This guarantees the C3→C4 match cut.

**scene07-porch.png** — Night, a cozy house front under an autumn tree. Over-the-shoulder from behind HERO-FORMAL standing at a small garden gate, his back to camera, bow tie loosened. HEROINE-FORMAL walks up the stone path toward the front door, holding the hem of her red gown, an amber porch lamp glowing to the left of the door with a soft white bloom, lilac night palette, a few leaves drifting. NO FACES. STYLE.

**Dance keyframes (formal sheets + scene05-dance-start.png attached):**
- **scene05-dance-start.png** — the C4 pull-back: he on the left, she on the right, arm's length apart, holding hands outstretched; couples dancing in the dark. = end of clip04, start of clip05.
- **scene05-dance-hold.png** — eye-level medium shot over HIS shoulder (him left foreground, back to camera, tuxedo); she is in his arms in a closed dance hold, his right hand on her waist, her hand on his shoulder, her face hidden against his shoulder and under her hair. = end of clip05, start of clip06.
- **scene06-walk-away.png** — EDIT of scene07-porch.png: same composition, but the setting is the ballroom fading to darkness, a dim last pool of pink light on her as she walks away, him in his tuxedo as the soft foreground silhouette. = end of clip06; dissolves into scene07-porch.
- Wardrobe continuity: she walks straight from the ballroom to her door, so scene07-porch has her in the gown only (no jacket) and him in his tuxedo jacket.

Lighting bible (ballroom): one overhead spotlight, warm pink, soft-edged pool ~3 m wide with gradual falloff on a polished dark wooden floor that reflects it; visible volumetric cone through haze full of glittering particles; everything outside the pool indigo-black; other couples dance in the dark around the floor at 6–8 m, silhouettes with a faint pink rim, softly out of focus; couple in sharp focus (slight depth of field); faces shadowed by the top light.

Continuity: scene05-dance-start is the C4 pull-back from scene04-hands-spotlight — same axis, HE on the LEFT, SHE on the RIGHT, arms outstretched holding hands at frame center. The C5 orbit swings the camera ~180°, so by scene05-dance-end she is on the left with her back to camera (composite (11) has this orientation).

## Step 3 — Videos (image-to-video, style bible attached)

**clip01-train.mp4 · 5s · start = scene01-frozen.png · end = scene01b-side-chase.png** — frozen-time camera glide; nothing moves except the camera. Time resumes in slow motion in clip02.
The train begins rolling forward toward the right foreground, ink speed lines streaking off the wheels, the open coach door sliding closer to camera. HERO leans out of the open coach door, a backlit silhouette against the low golden sun, holding the rail with one hand and flinging his free arm back toward the platform. Camera at platform height glides alongside. Steam swirls, color fringing on the moving train. Single continuous shot, no cuts. NO FACES. HANDS. STYLE.

**clip02-run.mp4 · 5s · start = scene01b-side-chase.png · end = scene02-run-to-train.png** (camera swings from the side around to behind her shoulder, then surges toward the hands)
Camera follows close behind HEROINE's shoulder as she sprints along the platform toward the moving train, hair and red scarf streaming back toward camera, white dress fluttering. HERO's hand reaches back from the coach door and the gap closes; her arm stretches forward to meet it. In the last second the camera surges forward over her shoulder toward their reaching hands. Pigeons burst upward as dark graphic shapes, golden sun flaring around the train. Single continuous shot, no cuts. NO FACES. HANDS. STYLE.

**clip02b-push-to-hands.mp4 · 4s · start = scene02-run-to-train.png · end = scene03-hands-reaching.png** — BUILT IN CODE: a 2.5D dolly push on the 4K still scene02-run-to-train.png into the gap between the hands, crossfading into scene03-hands-reaching.png. AI takes made the hero slide through the train walls. clip02b-push-to-hands.mp4 (Kling take) is used only from ~2.7s to the end (clean hands close-up); before that, the code push on the still, joined under the zoom-lines flash.

**clip03-hands.mp4 · 4s · start = scene03-hands-reaching.png · end = scene03-hands-held.png (if the model accepts an end frame)**
Extreme close-up, slow motion. Her gold-ringed hand from the right and his leather-sleeved hand from the left meet, their palms meet and close into a simple palm-to-palm clasp, fingers not interlaced: her hand on top, her four fingers curling over the outer edge and back of his hand, his fingers curling up around the side of her palm, his thumb resting across the back of her hand just below her knuckles, and an ink-star sparkle bursts off the ring. Low golden sun flaring between their hands, defocused coach edge on the left, heavy halftone and speed lines behind. Ends on the clasped hands held still, centered. Single continuous shot, no cuts. HANDS. STYLE.

**clip04-spotlight.mp4 · 3s · start = scene04-hands-spotlight.png**
Starts on the clasped hands under a soft warm-pink overhead spotlight. The camera rises and pulls back smoothly, revealing HERO-FORMAL and HEROINE-FORMAL standing close together in the middle of a grand dark ballroom dance floor, alone in the pool of light, haze glowing in the beam, onlookers far back as dark indigo silhouettes. Both fully visible head to toe, faces in soft shadow from the overhead light. Single continuous shot, no cuts. NO FACES. HANDS. STYLE.

**clip05-dance.mp4 · 6s · start = scene05-dance-start.png · end = scene05-dance-hold.png**
Holding her hand, HERO-FORMAL gently draws HEROINE-FORMAL in; she twirls toward him, her red silk gown flaring, and lands softly in his arms in a closed dance hold, his right hand on her waist, her hand on his shoulder, her head resting against his shoulder. They sway slowly together, smiling. The camera descends from the high angle and moves closer, arcing around until it rests just behind his shoulder. Soft warm-pink spotlight overhead, glittering particles in the beam, other couples dancing as rim-lit silhouettes in the dark, slight depth of field. Single continuous shot, no cuts. NO FACES. HANDS. STYLE.

**clip06-walkaway.mp4 · 4s · start = scene05-dance-hold.png · end = scene06-walk-away.png**
Slowly she steps back out of his arms; their hands slide apart until only fingertips touch, then part. She turns and walks away from camera into the depth of the hall, her red gown trailing, not looking back yet. He stays in the foreground on the left, his back to camera. As she walks, the pink spotlight dims, the dancing silhouettes dissolve into darkness, and the ballroom fades away until only a faint pool of light remains around her. Single continuous shot, no cuts. NO FACES. STYLE.

**scene07-palat-turn.png** — medium shot at the front door: she has stopped on the top step and turns back over her left shoulder toward him (camera-left), face visible for the first and only time: shy, delighted smile, eyes glancing up through her lashes just past the lens, faint halftone blush; amber porch lamp as key light from the left; his blurred shoulder at the left edge. = end frame of clip07 (clip07 adds a slow push-in), start of clip08.

**clip07-palat.mp4 · 5s · start = scene07-porch.png**
Over-the-shoulder from behind HERO at the garden gate. HEROINE walks up the path to her front door, slows, stops at the door, then turns back over her shoulder toward camera — profile rim-lit by the amber porch lamp, face mostly in shadow, a shy, delighted smile readable only in the curve of her cheek. The hem of her red gown stirs in the breeze, leaves drift down. Lilac night palette. Camera nearly still. Single continuous shot, no cuts. NO FACES. STYLE.

**clip08-pullback.mp4 · 4s · start = last frame of clip07-palat.mp4**
The camera slowly pulls back and rises from behind HERO at the gate, revealing the whole cozy house with warm glowing windows, the autumn tree, and the quiet lilac night sky. HEROINE remains at the door looking back. Calm, still ending with empty sky across the top third of the frame. Single continuous shot, no cuts. NO FACES. STYLE.

## Step 4 — Leaf asset

**leaf.png** — A single red maple leaf, top-down view, comic ink outlines and halftone shading, isolated on a plain white background. STYLE. Remove the background → transparent PNG.

## Delivery

Put files in `site/assets/anniversary/source/` with the names above (`character-hero-casual.png`, `character-heroine-casual.png`, `scene01-station.png`, `clip01-train.mp4` … `clip08-pullback.mp4`, `leaf.png`). If the generator only offers 5s/10s, generate 5s and they get trimmed while encoding.

---

## Customization

- **End note** (on the leaf): editable text + signature.
- **Title:** names, years.
- **Floating cards:** users add text and/or image cards to the film.
  - Each card: content (text, image, image + caption), scene (clip), visible scroll range, screen position, depth (near / mid / far), size, rotation.
  - Cards are anchored in the scene, not the screen: they move with the estimated camera motion of the clip, scaled by depth (near cards move more — parallax).
  - Interactive: pointer tilt + light sheen, tap/click to expand, drag to place in edit mode.
  - Locked moments with no cards: C3 hands meet, C7 palat turn. Editor warns/hides cards there.
- Local drafts, downloadable HTML keepsake, recipient copy with editing hidden (same model as Headliner).

## Camera motion for cards

Per-frame camera path per clip, estimated offline once the clips exist (global motion from OpenCV feature tracking → translation, scale, roll; orbit yaw for C5 estimated from background drift). Stored as a small JSON track like `concert-tracking.js`. Cards transform as `camera(frame) × depth`. Hand-authored keyframes are the fallback if estimation is noisy on a clip.
