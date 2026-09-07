# PhD Research Atlas

Interactive Three.js PhD research portfolio organized around two connected research themes:

1. **Theme I — Composite Manufacturing & Multiscale Modeling**
2. **Theme II — Battery Manufacturing & Multiscale Modeling**

Live GitHub Pages site:

```text
https://wangluo021.github.io/phd-research-3d-map/
```

## Preview

![Research framework preview](assets/images/core-workflow.svg)

The deployed site renders the full interactive 3D atlas with spherical research nodes, curved branch paths, floating visual panels, and a right-side research detail gallery.

## Project Overview

This is a static Three.js website for presenting dissertation research as an interactive scientific knowledge field. The content is stored in `js/research-data.js`; the visual and interaction system is implemented in `js/app.js`; supporting images live in `assets/images/`.

The map supports:

- drag-to-rotate 3D navigation
- mouse wheel / trackpad / pinch zoom
- click-to-expand and click-to-collapse branches
- clickable research nodes
- node-linked image previews
- right-side image gallery updates
- models, methods, papers, and next steps for each selected node
- GitHub Pages deployment from the repository root

The visual direction combines premium scientific visualization, soft pink-blue material lighting, subtle pixel-inspired details, sharp generated labels, glowing curved connections, restrained data-packet motion, and frosted polymer / pearlescent node materials.

## Run Locally

This is a static site. On GitHub Pages, Three.js loads from jsDelivr over HTTPS first and falls back to `vendor/three.module.min.js` if the CDN cannot be reached.

For the most reliable local test, run a local server:

```bash
cd phd-research-3d-map
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

The app also shows a readable error message if Three.js or WebGL initialization fails, instead of staying on `Loading 3D map...`.

## Replace Node Images

Put new visual assets in:

```text
assets/images/
```

Use relative paths from the project root:

```text
assets/images/my-abaqus-result.png
assets/images/my-sem-image.jpg
assets/images/my-ovito-interface.png
```

Then edit the relevant node in `js/research-data.js`:

```js
{
  id: "pp-carbon",
  name: "PP / Carbon Fiber Interface",
  category: "composites",
  preview: "assets/images/my-ovito-interface.png",
  images: [
    {
      src: "assets/images/my-ovito-interface.png",
      caption: "LAMMPS / OVITO PP-carbon interface"
    }
  ],
  models: ["PP molecular slab", "Graphitic carbon surface"],
  papers: [],
  next: ["Run separation simulations"]
}
```

## Edit Research Data

Most content updates only require editing `js/research-data.js`.

Main fields:

- `id`: stable node identifier
- `name`: node label
- `category`: visual theme category
- `description`: text shown in the side panel
- `preview`: small image plane shown beside the 3D node
- `images`: gallery images shown when the node is selected
- `models`: models, methods, or experiments associated with the node
- `papers`: paper titles, metadata, and DOI links
- `next`: current or future work items
- `children`: child branches in the mind map hierarchy

Keep image references relative, such as `assets/images/example.svg`. Do not use local filesystem paths, `file://` URLs, or localhost-only asset URLs.

## Project Structure

```text
.
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   └── research-data.js
├── assets/
│   └── images/
│       ├── core-workflow.svg
│       ├── pultrusion.svg
│       ├── cathode-microstructure.svg
│       └── ...
├── vendor/
│   ├── three.core.min.js
│   └── three.module.min.js
├── .nojekyll
└── README.md
```

`index.html` must stay at the repository root for GitHub Pages branch deployment from `/ (root)`.

## Current Research Structure

```text
PhD Research
├── Theme I — Composite Manufacturing & Multiscale Modeling
│   ├── Pultrusion Process Modeling
│   │   ├── Thermo-Chemical & Cure Modeling
│   │   ├── 3D / 2D / 1D Multi-Fidelity Models
│   │   └── Pulling Force & Process Optimization
│   ├── Fiber Architecture & Structural Performance
│   ├── Polymer & Interface Molecular Modeling
│   │   ├── PU Cure + MD + GPR
│   │   ├── PP / Carbon Fiber Interface
│   │   └── PP / Cellulose Interface
│   ├── Composite Experimental Validation
│   └── Composite Publications & Industry Translation
└── Theme II — Battery Manufacturing & Multiscale Modeling
    ├── Cathode Mechanics & Calendering
    │   ├── SEM → Heterogeneous RVE
    │   ├── 2D Abaqus + 1D Reduced-Order Model
    │   └── 3D Roller Calendering
    ├── Dry Electrode & Solid-State Manufacturing
    │   ├── Dry Mixing, CNF & Binder
    │   ├── Electrostatic Spray & Deflector
    │   └── Hot Calendering & Layer Integrity
    ├── Electrochemical Performance Link
    ├── Solid Electrolyte Molecular Modeling
    ├── Battery Experimental Validation
    └── Battery Publications & Future Work
```

## GitHub Pages

This repository is configured to publish from:

```text
Branch: main
Folder: / (root)
```

Because the project is static and uses relative paths, no build step is required.
