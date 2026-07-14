# BuJo Visual Specification v1

Status: Active source of truth
Purpose: This document defines BuJo's visual direction, page-level design rules, typography, color, card system, interaction principles, and implementation priorities.

This is a working visual specification. It is strong enough to guide implementation, but should still be validated through real CalendarMain, AppSidebar, ActivityView, Login, Friends, and Alerts implementation.

---

## 0. 2026 Visual Direction Correction: Modern Paper, Not Flat Wireframe

BuJo should sit between the original paper/editorial direction and mature modern product craft.

The goal is **Modern Paper Interface**:

- keep BuJo's paper form, activity sheet, editorial index, printed object, and social calendar personality
- avoid flat PPT wireframe UI where every element has the same white fill, rectangular border, font weight, and ink color
- avoid generic AI/SaaS UI made from pale cards, excessive rounded corners, muted helper strips, pill controls, and soft shadows
- borrow modern SaaS spacing, padding, and typography scale only as craft tools, not as the visual style

Modern BuJo hierarchy should come from:

- paper depth
- line weight contrast
- spacing rhythm
- type scale
- ink color scale
- paper / ink / accent color families with different saturation and lightness
- small caption, metadata, stamp, label, or index marks
- clear selected states and primary decision areas

Do not solve hierarchy by making every section a soft rounded card. Do not solve paper character by making every section a flat black-outlined rectangle.

### Layout / Spacing / Typography Hierarchy Rules

Use a consistent spacing scale so screens feel designed, not manually stacked.

Recommended spacing scale:

```text
4px    tight inline spacing, icon + text, tiny internal relationships
8px    label / input / hint inside one field
12px   rows inside one small group
16px   normal form fields and repeated controls
20-24px different task sections or major form groups
32px+  page-level content, hero to content, major editorial breaks
```

Recommended padding:

```text
Small control:      8-12px horizontal
Normal input:       12-16px horizontal
Compact group:      12-16px
Modal body:         20-24px
Primary content:    24-32px
Dense calendar UI:  compact but rhythmic; grid scanability is more important than spaciousness
```

Recommended product typography:

```text
Modal title:        18px / 700
Section heading:    15-16px / 700
Field label:        13-14px / 600-700
Input/body text:    14-15px / 400-500
Helper text:        12-13px / 400-500
Metadata/caption:   11-12px / 400-500
Warning text:       12-13px; use placement and color, not large red paragraphs
```

Chinese UI text needs visible role differences. Do not make labels, hints, metadata, warnings, and values all the same size, weight, and ink darkness.

### Paper Depth Rules

Use fewer equal-weight borders, not fewer all borders.

Allowed hierarchy tools:

- strong boundary for primary inputs, pickers, calendar grids, and decision blocks
- softer dividers for rows inside the same thought
- light paper-layer backgrounds for secondary areas
- small offset paper shadow when an object should feel printed or lifted
- slight radius only where it improves product polish; avoid large soft app cards
- selected state with stronger ink, accent mark, frame, or stamp-like treatment

Avoid:

- every row as a separate rectangle
- every helper note as a pale rounded card
- every mode control as a quiet settings row
- black or near-black text everywhere
- large soft shadows, blur, glow, or generic dashboard card treatment

Forms should feel like activity sheets or printed paper forms. A form's primary task must be visually clearer than helper text and secondary settings.

---

## 1. Design Positioning

BuJo is a **Social Inbox Calendar**.

Chinese positioning:

- 社交收件式日曆
- 活動索引日曆
- 成熟社交日曆工具

Core feeling:

- calm editorial
- exhibition-like
- social object
- mature but playful
- functional but memorable

BuJo should not feel like:

- an old engineering website
- a generic SaaS dashboard
- a Bootstrap admin template
- a full pixel game UI
- a childish sticker website

Overall balance:

```text
Calm editorial: 85%
Playful emotion: 15%
```

Static screens should feel calm. Personality should gradually appear through typography, composition, hover, motion, hidden details, and small emotional decorations.

---

## 2. Core Design Principles

### Composition First

Design the composition first. Components come second.

Users should remember the overall atmosphere of the page before they notice individual UI elements.

A user should be able to recognize a BuJo page even after most functional content is removed.

Some visual elements may exist purely as decoration or emotional atmosphere. They may fill whitespace, create mood, add surprise, or make the page feel more interactive. These elements do not need to provide direct functionality.

However, they must never reduce readability, usability, or information clarity. If a decorative element competes with functional content, remove or reduce the decoration first.

### Less Dashboard, More Exhibition

BuJo should feel less like a dashboard and more like an editorial product or exhibition surface.

Use:

- typography
- whitespace
- alignment
- grouping
- scale
- page rhythm
- social objects
- small emotional details

Avoid solving visual flatness only by adding more boxes, shadows, colors, or UI controls.

---

## 3. Graphic Composition Specification

Every page should contain at least one graphic composition that improves atmosphere, hierarchy, rhythm, or memorability.

This composition may consist of:

- typography
- layout
- spacing
- lines
- buttons
- decorations
- labels
- editorial elements

Its primary purpose may not be direct functionality, but it must never reduce usability.

It should give the page identity, rhythm, and memorability.

### Information Grouping

Large amounts of information should be divided into meaningful visual groups.

Use spacing, dividers, alignment, and typography to separate content.

Avoid presenting information as one continuous vertical list.

Each group should feel like one readable thought.

### Visual Rhythm

Create hierarchy primarily through rhythm, scale, spacing, and grouping rather than additional colors.

Rhythm may come from:

- whitespace
- object size
- typography scale
- spacing
- grouping
- empty areas

Avoid making every section equally dense or equally important.

Pages should have moments of compression and moments of breathing.

---

## 4. Hero Typography Specification

Hero Typography is a dedicated visual system in BuJo.

It is not only a page title. It is a graphic composition element that establishes page identity, atmosphere, and editorial rhythm.

Hero Typography may use:

- English words
- numbers
- months
- repeated phrases
- short editorial headings
- exhibition-style headings

English and numbers carry most of the visual expression. Chinese prioritizes readability and content clarity.

English is preferred for system-level page identity. Chinese remains primary for user-generated content such as activity names, notes, and friend names.

### Role

Hero Typography serves as the primary visual headline of a page.

Examples include:

- month name
- page title
- section title
- large date
- large number
- empty state title

Hero Typography should create visual rhythm before users begin reading detailed information.

### Language Hierarchy

Recommended structure:

```text
Large English title
Smaller Chinese subtitle
Large numbers
Small metadata
```

Good examples:

```text
ACTIVITY
好友活動
```

```text
JUNE
2026
```

```text
SOCIAL
INBOX
CALENDAR
```

Avoid oversized Chinese headlines as the default page identity.

Chinese may become large only when it is the actual user-generated primary content.

### Graphic Treatment

Allowed:

- oversized scale
- controlled spacing
- vertical stacking
- multi-line composition
- mixed English and numeric composition
- no more than two font weights in one hero composition

Avoid:

- outlines
- gradients
- shadows
- decorative textures
- colorful fills
- excessive letter spacing

Typography should remain clean and mostly monochrome.

### Responsive Rule

Desktop:

- Hero Typography may align with, extend across, or partially interact with the surrounding layout.

Mobile:

- Hero Typography should stack above content or become background-level text.
- It must never overlap functional content.

---

## 5. Page-Level Rules

### CalendarMain

Art intensity: 40-50%  
Utility: highest

CalendarMain is not a plain tool table. It is a calm calendar surface with hidden social and emotional signals.

The calendar remains the visual anchor.

Supporting elements such as social rail, friend activities, event chips, and inbox panels should visually support the calendar instead of competing with it.

The calendar should remain the dominant object on CalendarMain.

Use:

- hero month typography
- social rail as editorial brief
- event chips with friend metadata
- tiny emotional notes
- subtle hover moments
- small selected/today details
- sidebar emotion and object icons

Avoid:

- large illustrations
- large ghost text
- decorations inside every date cell
- too many boxes
- a spreadsheet-like grid
- social rail competing with the calendar

Calendar grid should feel like an editorial planning surface, not Excel.

### ActivityView

Art intensity: 65-80%  
Utility: medium

ActivityView is an activity index, exhibition page, and social room gallery.

Use:

- central active activity card
- bottom horizontal card index
- printed editorial cards
- large date numbers
- English system labels
- generous whitespace
- tiny exhibition text
- emotional color cards

Avoid:

- dashboard card grid
- filling every available space
- too many cards visible at once
- bottom cards covering the central card

### Login

Art intensity: 55-70%  
Utility: medium

Login is BuJo's brand emotion entry point.

Use:

- hero typography
- social object
- tiny emotional text
- pixel stars or slow twinkle
- high-saturation decorations in small amounts

Avoid:

- gradients
- large circular background blobs
- too many stars
- reducing form readability

### Friends

Art intensity: 80-90%  
Utility: low

Friends is BuJo's playful collectible social page.

It can feel closer to:

- character card gallery
- friend collection book
- social stamp wall
- small interactive toy page

Friends may borrow Feather-like whitespace while allowing more interaction and childlike delight.

Use:

- character-card style friend cards
- social stamps
- hover flips
- sticker pop
- tiny burst
- playful add-friend interactions
- stars, squares, labels, collectible frames

Avoid:

- contact management page
- dense CRM-like grid
- all cards moving at the same time
- decorations making names unreadable

### Alerts

Art intensity: 35-50%  
Utility: high

Alerts should feel like a social inbox or Feather Brief.

Use:

- Must see / FYI / Low priority
- inbox object
- metadata
- small indicator
- clear information grouping

Avoid:

- colorful notification cards everywhere
- every alert becoming a sticker
- decoration interfering with priority

### Modal / Detail

Art intensity: 25-40%  
Utility: high

Detail panels should feel like printed information cards.

Use:

- paper card structure
- metadata
- clear grouping
- low decoration
- stable actions

Activity detail may render into the central content area instead of using a traditional overlay modal.

---

## 6. Sidebar Specification

Sidebar should become an **English editorial navigation rail**.

Desktop:

- English label + icon
- no Chinese label

Mobile:

- icon only
- no Chinese label required

Navigation labels:

- CALENDAR
- ACTIVITY
- FRIENDS
- ALERTS

### Icon Direction

Sidebar icons should be **mini editorial object icons**, not generic tool icons.

They should feel like:

- small collected objects
- printed symbols
- navigation artifacts
- editorial index marks

Possible concepts:

- Calendar: small date slip / folded month card
- Activity: event ticket / stacked editorial card
- Friends: profile stamp / friend card
- Alerts: inbox note / folded paper

Rules:

- icon size: 18-28px
- no large square icons
- no generic lucide-style toolbar feeling
- not all thin-line icons
- may use small filled areas
- may use small `#98D0A2` active detail
- should not become colorful illustrations

Hover / active:

- no full background fill
- no right shift
- text deepens
- icon state changes subtly
- active indicator appears

---

## 7. Color System

BuJo's color system should feel like paper keepsakes collected from daily life.

The interface should not rely on one large brand color. Its visual structure comes from quiet paper neutrals, soft ink colors, and small saturated collage accents.

Core color principle:

```text
Paper is the stage.
Ink is the structure.
Stickers are the emotion.
App signals are the function.
```

In product language:

> BuJo uses quiet paper neutrals as the stage, dark ink for structure, and small saturated collage colors as emotional evidence of lived moments.

### Color Roles

Use color by role, not by decoration impulse.

```text
Paper Base        main page, cards, notebook sheets, envelopes, postcards
Ink               headings, body text, labels, important structure
Soft Accent       stickers, stars, tape, small paper details
Object Color      ticket, note, postcard, invitation, polaroid, envelope families
Functional Signal focus, active, selected, status, actionable UI states
```

Recommended base tokens:

```css
--bujo-paper: #fbfaf4;
--bujo-paper-warm: #f4f1e8;
--bujo-paper-muted: #eeece3;
--bujo-paper-pink: #efd0e6;
--bujo-paper-blue: #cfe3f2;
--bujo-paper-yellow: #eee3a8;
--bujo-paper-green: #98d0a2;

--bujo-sticker-pink: #e883bd;
--bujo-sticker-blue: #63a6df;
--bujo-sticker-red: #ef5c3c;
--bujo-sticker-yellow: #e2c84d;
--bujo-sticker-grass: #4ba66b;
```

### Text Color System

Text should avoid pure black except for rare graphic emphasis.

BuJo text should feel printed, not digitally harsh. Use a soft ink scale so hierarchy is created through tone before decoration.

Recommended text tokens:

```css
--bujo-text-primary: #20261f;
--bujo-text-body: #3f473f;
--bujo-text-muted: #6f776d;
--bujo-text-faint: #9ca49a;
--bujo-text-inverse: #f8f7f0;
```

Usage:

```text
Primary   page titles, card titles, important labels, selected states
Body      readable product text, descriptions, form labels, event titles
Muted     secondary captions, helper text, inactive shell text
Faint     metadata, dates, tiny labels, decorative system text
Inverse   dark buttons, dark chips, dark status labels
```

Rules:

- do not use pure black as the default text color
- do not make metadata the same darkness as headings
- date labels and weekday labels should usually use `Muted` or `Faint`
- decorative text may be faint, but must remain readable
- dark buttons should use `Inverse`, not pure white
- Chinese body copy should use `Body` or `Primary`, never too faint

### Signature Accent

```text
#98D0A2
```

Role:

`#98D0A2` is BuJo's Signature Accent. It is used for brand recognition, confirmed social presence, and subtle identity moments.

It is not:

- a general primary color
- a background color
- the default button color
- the default Activity Card color

Use for:

- logo accent
- small brand mark
- month marker
- active sidebar indicator
- focus ring
- tiny pixel mark
- selected state detail
- subtle divider accent
- micro interaction detail

Avoid using for:

- full sidebar background
- page background
- large layout sections
- every button
- every hover state
- all event chips
- all Activity Cards
- large decorative areas

It should appear as a repeated small identity signal.

### Activity Card Status Colors

```text
我建立的 & 揪團中：#EBCAE6
我建立的 & 已成團：#98D0A2
我已報名 & 揪團中：#A8D0CF
我參加別人的 & 已成團：#DED49C
一般揪團中：使用原本已成團狀態色
特殊 / 系統 / 空狀態：白 or 紫
```

Activity page should avoid using green except for the completed status card or tiny brand details.

### Emotion Decoration Colors

Emotion decoration may contain the highest saturation in the interface.

Rules:

- do not use decoration colors as large backgrounds
- do not use yellow too much
- do not make pink the only decoration color
- decoration should remain small
- if decoration is not the brightest object, reduce saturation around it instead of increasing decoration size
- each page should choose 2-3 emotional accent colors at most
- saturated accents should appear as evidence of collage, not as a full theme wash

---

## 8. Typography System

```text
Inter：Display / Heading / top mood line / UI shell
Nunito：Body / readable product text / event chip title
Space Mono：metadata / caption / small labels / weekdays / date labels
Doto：special decorative numbers, such as Social Rail date numbers
IBM Plex Sans TC：Chinese fallback
```

Rules:

- body text must not use pixel fonts
- buttons should use Inter or Space Mono depending on hierarchy
- one component should use no more than two font families
- Doto is only for decorative numbers and should not replace all metadata
- Space Mono Micro text may use 400-700 weight
- Chinese content should remain readable

Suggested weight hierarchy:

```text
Display / Hero: Inter 700-800
Heading: Inter 700
Body: Nunito 400-600
UI shell: Inter 500-700
Button: Inter or Space Mono 600-700
Card title: Inter or Nunito 700
Metadata / Caption: Space Mono 400-700
Decorative number: Doto 700
```

Level mapping:

```text
Hero      Inter 700-800
Display   Inter 700-800
Heading   Inter 700
Body      Nunito 400-600
Caption   Space Mono 400-500
Micro     Space Mono 400-700
Decor     Doto 700, numbers only
Chinese   IBM Plex Sans TC fallback with the same level weight
```

Typography should pair with the text color system:

```text
Hero / Display       Text Primary
Heading              Text Primary
Body                 Text Body
Caption              Text Muted
Micro / metadata     Text Faint or Muted
Disabled text        Text Faint
Dark buttons         Text Inverse
```

---

## 9. Card System

BuJo cards should feel like printed objects, not soft app cards.

Default card family:

- printed object
- editorial card
- exhibition card
- paper artifact

Shape:

- default radius: 2-4px
- emotional / empty state object: 4-6px
- Login card: 4-8px
- avoid large rounded cards

Shadow:

- Activity cards may use a small paper-like shadow
- avoid heavy floating UI shadows

### Activity Card

Treat each Activity Card as a printed editorial card instead of a UI dashboard.

Improve hierarchy through typography rather than additional UI elements.

Rules:

- large date numbers may become graphic elements
- English system labels may become the primary visual accent
- Chinese titles remain readable
- Chinese text can act as subtitle or supporting information
- increase whitespace
- information should breathe
- avoid filling every available space

### Label

Labels should feel curated, but stay inside the card.

Rules:

- no floating outside card
- no tight corner attachment
- no colorful capsule feeling
- may align with card content
- may behave like exhibition captions
- must not compete with title

ActivityView label rules:

- only "我建立的" requires identity label
- other cards show only primary status label:
  - 已報名
  - 揪團中
  - 已成團

---

## 10. Button System

Buttons should feel like part of the graphic composition rather than conventional UI controls.

They should be:

- editorial
- calm
- mature
- lightweight
- intentional

Button types:

### Outline Button

Primary button style. Use about 60%.

- transparent background
- thin outline
- hover may darken or fill
- used for filters, navigation, dialog actions, general UI controls

### Underline Button

Secondary button style. Use about 20%.

- text with underline
- editorial feeling
- used for view all, more, browse, supporting actions

### Text Button

Lightweight button style. Use about 15%.

- typography only
- no border
- no background
- used for inline and low-priority actions

### Filled Hero Button

Reserved button style. Use about 5%.

- highest-priority CTA only
- do not use frequently
- should not dominate the composition

### Close / Icon-Only Button

- no border
- transparent background
- hover color deepens
- pressed moves 1px
- no floating hover
- no rotation
- no bounce

---

## 11. Icon / Illustration / Object System

Direction: **Expressive social object**.

Functional icons:

- clear
- simplified
- not too cute
- not more visually important than text

Illustration / empty state object:

### Social Stamp

Use for:

- Friends
- Activity
- completed group state
- friend activity

Feeling:

- collectible
- social
- friendly
- cute but not childish

### Inbox Object

Use for:

- Alerts
- Calendar social rail
- room summary
- notification

Feeling:

- social inbox
- information object
- calm but designed

---

## 12. Emotion Decoration System

Emotion Decorations exist to soften BuJo's calm editorial interface.

They create warmth, personality, surprise, and memorable moments without affecting information hierarchy.

Decoration is emotional punctuation, not information classification.

Emotion Decoration is a collection of visual moments, not a collection of cute graphics.

### Role

Decorations may:

- soften whitespace
- balance composition
- create editorial rhythm
- reinforce personality
- create small memorable moments
- reward interaction

### Placement

Decoration placement should feel naturally accidental.

Decoration moments should vary in:

- distance
- rotation
- size
- spacing
- color rhythm
- color combinations

Avoid:

- perfect alignment
- mirrored layouts
- equal spacing
- repeated distances
- repeated rotation
- repeated color order
- identical repeated groups

### Density

Decorations should remain intentionally sparse.

Desktop:

- maximum 2-3 decoration moments per page

Mobile:

- maximum 1 decoration moment

Card:

- maximum 0-1 decoration moment

A decoration moment may be a small combination, for example:

- cross star + square dots
- star + tiny caption
- corner mark + color dot
- sticker label + tiny mark

Avoid forming repeated, identical, block-like clusters.

### Scale

Typical size:

```text
6-14px
```

Only rare special moments may exceed 18px.

Large decorative graphics are not part of BuJo.

Whitespace is more important than decoration.

---

## 13. Motion / Interaction System

Motion is part of BuJo's personality.

Static interface:

```text
90% calm / 10% playful
```

Interaction moments:

```text
70% calm / 30% playful
```

Motion should be:

- localized
- lightweight
- short-lived
- meaningful

Avoid:

- large bounce
- full-page flashing
- glow effects
- heavy shadow floating
- all elements animating at once
- every hover becoming a surprise

### Timing

```text
hover: 120-180ms
pressed: 80-120ms
focus: immediate or 120ms
card select: 220-320ms
detail reveal: 260-420ms
page/month switch: 280-500ms
decoration motion: 1.6-4s
```

### Buttons

Outline:

- default: transparent + thin outline
- hover: darker or filled
- pressed: translate(1px, 1px)
- focus: #98D0A2 ring

Underline:

- hover: underline draw
- pressed: translateY(1px)

Close / icon-only:

- hover: color deepens
- pressed: translate(1px, 1px)
- no icon floating

### Calendar

Calendar cell:

- hover: line deepens or surface changes subtly
- today: small signature mark
- selected: thin frame or small corner mark

Event chip:

- hover: line deepens or friend metadata appears
- pressed: 1px down
- no blinking
- no bounce

### Activity

Bottom card index:

- hover: line deepens
- selected: stable position, add frame or corner mark

Central card:

- fade + slight vertical reveal
- no overlay modal required

Success:

- tiny pop
- localized particle burst
- sticker reaction

Only use for low-frequency meaningful actions.

### Emotion Decoration Motion

Allowed:

- slow twinkle
- tiny pop
- subtle blink
- gentle rotation
- underline drawing
- sticker reaction
- localized particle burst
- pixel sparkle

Not every decoration needs to animate.

---

## 14. Responsive Rules

Desktop:

- use large whitespace
- use visual anchor
- sidebar shows English + icons
- Activity may use central card + bottom horizontal index

Tablet:

- reduce decoration density
- keep Activity index horizontally scrollable
- avoid bottom cards covering central card

Mobile:

- sidebar shows icon only
- decoration moment max 1
- calendar grid remains clean
- no hero typography overlapping functional content
- Activity layout must prioritize readable central card and accessible bottom index

---

## 15. Implementation Priority

Three-day priority:

1. AppSidebar redesign
2. CalendarMain composition and social rail
3. global typography and color tokens
4. button, card, label system
5. ActivityView visual refinement
6. Login visual update
7. minimal emotion decoration

Second phase:

- Friends high-interaction character card page
- Empty state illustration objects
- success particle / sticker pop
- full motion system
- hidden easter eggs

---

## 16. Do / Don't

### Do

- design composition first
- use English hero typography and numbers as graphic elements
- keep Chinese readable
- use whitespace as structure
- make CalendarMain clear but not dead
- make Friends playful and collectible
- keep emotion details tiny
- use `#98D0A2` as a subtle identity signal

### Don't

- do not return to the old green sidebar
- do not use full-site pixel fonts
- do not make every page a dashboard grid
- do not overuse boxes
- do not use large rounded soft app cards
- do not use gradients or large circles
- do not make labels into colorful capsules
- do not let decoration overpower content
- do not make every interaction noisy
