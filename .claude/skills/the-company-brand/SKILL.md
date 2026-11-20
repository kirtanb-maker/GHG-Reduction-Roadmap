---
name: the-company-brand
description: Apply The Company's identity to any UI, document, or content this build produces. Trigger whenever styling a dashboard, generating a PDF or report, or producing any branded output for The Company.
---

# The Company — Brand

## Identity

- **Name:** The Company
- **One-line description:** Global manufacturer of glass.

## Colors

| Role | Hex | Usage |
|---|---|---|
| Text — primary | `#000000` | All body text and page titles |
| Text — secondary / UI grey | `#8C8985` | Navigation, labels, footnotes, page numbers, inactive states |
| Neutral — warm panel | `#F0EEE4` | Tags/chips, background panels behind content |
| Background — off-white | `#FAFAF7` | Page / section background |
| Background — white | `#FFFFFF` | Default surface, cards |
| Accent 1 — green | `#77BB78` | Category accent; tint `#D6EBD6` for panel backgrounds |
| Accent 2 — blue | `#8DBAED` | Category accent / panel headers; tints `#BBD6F4`, `#E8F1FB` for backgrounds |
| Accent 3 — pink | `#F8AAB6` | Category accent / panel headers; tints `#FBCCD3`, `#FDE5E9` for backgrounds |
| Accent 4 — yellow | `#FCCF61` | Category accent; table header bars |

Pattern from the source material: each main area of the tool gets one accent color, used for its active navigation marker, panel headers and table headers, with that accent's light tint as the panel background. Grey `#8C8985` marks inactive and reference areas. Body text always stays black.

## Typography

| Use case | Font | Weight |
|---|---|---|
| Page titles, large headings | Spectral *(free stand-in for Novarese Std)* | Medium (500); Bold (700) for emphasis |
| Body text | DM Sans *(free stand-in for Euclid Circular A)* | Regular (400); Light (300); Italic |
| Panel headers, navigation, labels | DM Sans, UPPERCASE, letter-spacing ~0.08em | Medium (500) / SemiBold (600) |

Both stand-ins are free (SIL Open Font License) on Google Fonts:
`https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Spectral:wght@500;700&display=swap`

The original typefaces (Novarese Std, Euclid Circular A) are commercial. If licensed files become available, swap them in for the stand-ins and change nothing else.

## Logo & assets

Not provided. No logo is included in this package. Use the name "The Company" set in Spectral Medium as a text lockup until a logo file is supplied.

## Templates included in this package

None.

## How this feeds your build

This brand is for an internal (non-public) online tool. Claude Code should apply the colors above as the tool's UI tokens: black text on white or off-white surfaces, grey for navigation and secondary text, the warm neutral for chips and panels, and one accent color (with its tint) per main area of the tool. Load the two fonts from Google Fonts and use Spectral for page titles, DM Sans for everything else, and uppercase letter-spaced DM Sans for headers and navigation.
