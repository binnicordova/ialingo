# iaLingo logo: usage guide

**The idea:** a baby dino whose whole body is the capital **L** of Lingo. It is a letter and a pet at once, so the name and the game's promise ("my pet grows because I'm learning") arrive together. Meet the Lingosaur.

## Which version to use

| Version | File | Use it for |
|---|---|---|
| **Logotype** (primary): the pet is the L | `master/logotype-*.svg` | Anywhere the name appears: Welcome screen, website header, store art, certificates |
| **Pet alone** | `master/lingosaur-*.svg` | App icon, splash, stickers, avatars, anywhere the name is already nearby |
| **Pet, small cut** (no plates, feet or smile) | `master/lingosaur-small-*.svg` | Below 32 px: favicon, notification, tiny UI |
| **Horizontal / stacked lockup** | `master/lockup-*.svg` | When the pet must stay large and the name fully typed: posters, shirts, slides |
| **Plain wordmark** | `master/wordmark-*.svg` | Below the logotype's minimum size, and in small one-colour uses such as legal lines |

Pick the file named for your background: `color-on-light`, `color-on-violet`, `black`, `white`. The SVG masters are the only source files; export PNGs from them when you need one.

## In the app

- **Icons:** edit a master, then run `node scripts/generate-icons.cjs`. It rewrites `assets/images/` (iOS icon, Android adaptive layers, splash, favicon). It needs Playwright, which is not in `package.json`.
- **In-app logotype:** `src/presentation/art/BrandLogo.tsx`, baked from `master/logotype-color-on-light.svg`. Light backgrounds only.

## Clear space

Keep **one pet-foot width** clear on every side (the width of one foot, about 14% of the pet's height). It scales with the logo.

## Minimum sizes

| Version | Screen | Print |
|---|---|---|
| Logotype, full colour | 120 px wide | 25 mm wide |
| Logotype, one colour | 200 px wide | 40 mm wide |
| Pet | 32 px | 8 mm |
| Pet, small cut | 16 px | 4 mm |
| Plain wordmark | 48 px wide | 12 mm wide |

## Colour

| Name | Used for | HEX | RGB | CMYK (approx.) | App token |
|---|---|---|---|---|---|
| Violet | Tiles, wordmark | `#6C4BF4` | 108, 75, 244 | 56, 69, 0, 4 | `primary` |
| Yellow | The pet | `#FFC93C` | 255, 201, 60 | 0, 21, 76, 0 | `yellow` |
| Orange | Back plates | `#FF8A3D` | 255, 138, 61 | 0, 46, 76, 0 | `orange` |
| Ink | Eyes, smile | `#2D2A4A` | 45, 42, 74 | 39, 43, 0, 71 | `ink` |
| Blush | Cheeks only | `#FF7FA3` | 255, 127, 163 | 0, 50, 36, 0 | none |

CMYK values are mathematical conversions, and violet in particular prints duller than on screen. Ask the printer for a proof. No Pantone is specified: choose from a physical swatch book.

**Approved backgrounds**

- Pet with violet wordmark on white or pale tints: violet on white is 5.3:1, on `primarySoft` 4.3:1.
- Pet with white wordmark on violet: the pet on violet is 3.5:1.
- White version on black or ink. Black version on white.

Yellow on white is only 1.5:1, which is fine for the pet because its dark face carries it, but **never set text in yellow**. Don't place the pet on yellow, orange or busy photos; use the violet tile instead.

## Don'ts

- Don't stretch, rotate or flip the pet. Flipped, it stops being an L.
- Don't recolour it green. Dinos are expected to be green, and green is also the category leader's colour.
- Don't make it purple: a purple dino is already famous.
- Don't add shadows, outlines, gradients or effects.
- Don't retype the name with a font in place of the logotype or wordmark.
- Don't use the full pet below 32 px; use the small cut.

## Typography

The wordmark is **Fredoka SemiBold** with hand-set kerning, converted to outlines, so no font is needed to display it. Fredoka is the app's own typeface and is licensed under the SIL Open Font License 1.1, which allows logo use.

## Handover notes

**Tested**

- Rendered and inspected from 16 to 1024 px, in one colour and reversed, and on violet, light and black backgrounds.
- The one-colour pet is a single merged contour with real holes for the eyes and smile. The audit tool's warnings on other files are expected for a mascot: 5 to 6 colours, white eye glints painted on the colour versions, and tiny glints in the lockups.
- Icons follow Expo's requirements: 1024 px PNGs, iOS with no alpha. Android art stays inside the 66 dp safe circle.

**Not done**

- **No trademark search.** Run a professional one before launch; nothing here guarantees clearance.
- **Screen files only.** There are no PDF, AI or EPS files because no vector editor was available. A designer can open the SVG masters to produce them. The colour masters use layered shapes (plates sit behind the body), so a vinyl cutter should use the one-colour files.
- **Store art not updated.** Feature graphics and screenshots still need refreshing. Any existing screenshots show the old icon.
