# PhD Research Concept Atlas

Interactive 2D SVG research mind map for a PhD portfolio organized into two core research themes:

1. **Theme I — Composite Manufacturing & Multiscale Modeling**
2. **Theme II — Battery Manufacturing & Multiscale Modeling**

Live GitHub Pages site:

```text
https://wangluo021.github.io/phd-research-3d-map/
```

## Screenshot

![Screenshot placeholder](assets/images/core-workflow.svg)

Replace this placeholder with a deployed-site screenshot when you want the README to show the actual rendered interface.

## Project overview

This is a static, GitHub Pages-compatible PhD research portfolio. It presents the dissertation structure as a flat academic concept atlas with a paper-like background, translucent research domains, colored circular nodes, curved relationship lines, small moving data packets, and image previews attached to selected research areas.

The map supports:

- click-to-expand and click-to-collapse research branches
- click-to-select nodes and update the right-side details panel
- drag-to-pan the 2D atlas
- mouse wheel / trackpad zoom
- optional gentle auto drift
- node image previews
- a right-side image gallery for each selected node
- related models, experiments, publications, and next steps
- static GitHub Pages deployment from the repository root

The research content lives in `js/research-data.js`. The 2D SVG interaction and layout code lives in `js/app.js`. Visual assets live in `assets/images/`.

## Project structure

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
├── .nojekyll
└── README.md
```

`index.html` must stay at the repository root for GitHub Pages branch deployment from `/ (root)`.

## Current research structure

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

## Add or replace node images

Put images in:

```text
assets/images/
```

Then update the matching node in `js/research-data.js`:

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

Use relative paths such as `assets/images/result.png`. Do not use local filesystem paths, `file://` URLs, or absolute website-root paths.

## Edit research data

Most content changes only require editing `js/research-data.js`.

Main fields:

- `name`: node label
- `description`: description shown in the side panel
- `preview`: small image shown near the node
- `images`: image gallery shown after clicking the node
- `models`: models / experiments associated with that node
- `papers`: papers and DOI links
- `next`: next research steps
- `children`: sub-branches

Keep each `id` unique. Add nested `children` when a node should expand into subtopics.

## Run locally

You can usually double-click:

```text
index.html
```

For the most reliable local test, run a local server:

```bash
cd phd-research-3d-map
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

The current interface does not require WebGL or a JavaScript CDN. It only needs the local static files in this repository.

## Deploy to GitHub Pages

1. Push the project files to the repository.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Save.

The published site is:

```text
https://wangluo021.github.io/phd-research-3d-map/
```

## Recommended real research images

### Theme I — Composites

- Abaqus temperature contour
- degree-of-cure contour
- 1D / 2D / 3D model comparison
- Pareto optimization
- industrial pultrusion setup
- fiber architecture simulation
- OVITO PU network
- PP / carbon-fiber interface
- PP / cellulose interface
- DSC / rheology / DMA results
- load-cell setup

### Theme II — Batteries

- raw SEM
- segmented SEM / RVE
- Abaqus porosity or stress contours
- experimental compression curve
- 3D roller-calendering model
- dry catholyte / SSE layer photographs
- electrostatic spray setup
- deflector CAD / simulation
- electric-field / particle-deposition results
- EIS plots
- Li6PS5Cl OVITO supercell

Using actual SEM, Abaqus, OVITO, process photographs, and experimental plots will make the atlas work as a research portfolio rather than a generic mind map.
