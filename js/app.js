(function () {
  const loading = document.getElementById("loading");

  try {
    if (!window.researchTree) throw new Error("Research data did not load. Check js/research-data.js.");
    if (loading) loading.textContent = "Initializing 2D research atlas...";

    const SVG_NS = "http://www.w3.org/2000/svg";
    const XLINK_NS = "http://www.w3.org/1999/xlink";
    const researchTree = window.researchTree;

    const svg = document.getElementById("mapCanvas");
    const canvasWrap = document.getElementById("canvasWrap");
    const resetBtn = document.getElementById("resetBtn");
    const expandBtn = document.getElementById("expandBtn");
    const collapseBtn = document.getElementById("collapseBtn");
    const rotateBtn = document.getElementById("rotateBtn");

    const detailTitle = document.getElementById("detailTitle");
    const detailPath = document.getElementById("detailPath");
    const detailDescription = document.getElementById("detailDescription");
    const gallery = document.getElementById("gallery");
    const imageCount = document.getElementById("imageCount");
    const modelsList = document.getElementById("modelsList");
    const papersList = document.getElementById("papersList");
    const nextList = document.getElementById("nextList");

    if (!(svg instanceof SVGSVGElement)) throw new Error("The 2D map requires an SVG element with id=\"mapCanvas\".");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const PALETTE = {
      core: {
        surface: "#d7c777",
        deep: "#756b38",
        accent: "#1c1d1b",
        line: "#a6a7a2",
        wash: "rgba(217,217,213,.50)",
      },
      composites: {
        surface: "#72b9bd",
        deep: "#0e455c",
        accent: "#0e455c",
        line: "#aab9b7",
        wash: "rgba(217,217,213,.54)",
      },
      battery: {
        surface: "#d98282",
        deep: "#8e4c4c",
        accent: "#8e4c4c",
        line: "#b9aaaa",
        wash: "rgba(217,217,213,.46)",
      },
    };

    const nodesById = new Map();
    const parentById = new Map();
    const depthById = new Map();
    const childIdsById = new Map();

    (function indexTree(node, parent = null, depth = 0) {
      nodesById.set(node.id, node);
      depthById.set(node.id, depth);
      childIdsById.set(node.id, (node.children || []).map(child => child.id));
      if (parent) parentById.set(node.id, parent.id);
      (node.children || []).forEach(child => indexTree(child, node, depth + 1));
    })(researchTree);

    let selectedId = "core";
    let expanded = new Set(["core"]);
    let selectedPath = getPathIds(selectedId);
    let autoDrift = true;
    let hoveredId = null;
    let isDragging = false;
    let dragMoved = 0;
    let lastX = 0;
    let lastY = 0;
    let pointerDownNodeId = null;
    let ignoreNextClick = false;
    let lastSize = { width: 0, height: 0 };

    const view = {
      width: 1,
      height: 1,
      scale: 1,
      tx: 0,
      ty: 0,
      targetScale: 1,
      targetTx: 0,
      targetTy: 0,
      baseScale: 1,
      baseTx: 0,
      baseTy: 0,
      userMoved: false,
    };

    const itemById = new Map();
    const connectionRecords = [];
    let worldGroup = null;

    function setAttrs(element, attrs) {
      Object.entries(attrs).forEach(([key, value]) => {
        if (value == null) return;
        if (key === "href") {
          element.setAttributeNS(XLINK_NS, "href", value);
          element.setAttribute("href", value);
        } else {
          element.setAttribute(key, value);
        }
      });
      return element;
    }

    function svgEl(name, attrs = {}, text = "") {
      const element = document.createElementNS(SVG_NS, name);
      setAttrs(element, attrs);
      if (text) element.textContent = text;
      return element;
    }

    function clear(element) {
      while (element.firstChild) element.removeChild(element.firstChild);
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"]/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
      }[char]));
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function paletteFor(node) {
      return PALETTE[node.category] || PALETTE.core;
    }

    function getPathIds(id) {
      const ids = [];
      let current = id;
      while (current) {
        ids.unshift(current);
        current = parentById.get(current);
      }
      return new Set(ids);
    }

    function getPathText(id) {
      const names = [];
      let current = id;
      while (current) {
        names.unshift(nodesById.get(current)?.name || current);
        current = parentById.get(current);
      }
      return names.join(" / ");
    }

    function isAdjacentToSelection(id) {
      if (id === selectedId) return true;
      if (parentById.get(id) === selectedId) return true;
      if (parentById.get(selectedId) === id) return true;
      return childIdsById.get(id)?.includes(selectedId) || false;
    }

    function isDescendantOf(id, ancestorId) {
      let current = id;
      while (current) {
        if (current === ancestorId) return true;
        current = parentById.get(current);
      }
      return false;
    }

    function nodeProminence(id) {
      if (selectedId === "core") return 0.94;
      if (id === selectedId) return 1;
      if (selectedPath.has(id)) return 0.9;
      if (isAdjacentToSelection(id)) return 0.76;
      return 0.48;
    }

    function visibleItems() {
      const out = [];
      function walk(node, depth, parentObj) {
        const obj = { node, depth, parentObj, pos: { x: 0, y: 0 }, prominence: nodeProminence(node.id) };
        out.push(obj);
        if (expanded.has(node.id)) (node.children || []).forEach(child => walk(child, depth + 1, obj));
      }
      walk(researchTree, 0, null);
      return out;
    }

    function topTheme(item) {
      let current = item;
      while (current.parentObj && current.parentObj.depth > 0) current = current.parentObj;
      return current;
    }

    function layoutItems(items) {
      itemById.clear();
      const themes = researchTree.children || [];
      const themeSide = new Map(themes.map((theme, index) => [theme.id, index === 0 ? -1 : 1]));
      items.forEach(item => itemById.set(item.node.id, item));

      items.forEach(item => {
        if (item.depth === 0) {
          item.pos.x = 0;
          item.pos.y = 0;
          return;
        }

        if (item.depth === 1) {
          const side = themeSide.get(item.node.id) || 1;
          item.pos.x = side * 300;
          item.pos.y = side < 0 ? -68 : 58;
          return;
        }

        const theme = topTheme(item);
        const side = themeSide.get(theme.node.id) || 1;
        const parent = item.parentObj;
        const siblings = parent.node.children || [];
        const index = Math.max(0, siblings.findIndex(node => node.id === item.node.id));
        const center = (siblings.length - 1) / 2;
        const localIndex = index - center;

        if (item.depth === 2) {
          const spread = siblings.length > 5 ? 600 : 500;
          item.pos.x = parent.pos.x + side * 270;
          item.pos.y = (siblings.length > 1 ? localIndex / Math.max(center, 1) : 0) * (spread / 2) + (side < 0 ? -34 : 28);
          return;
        }

        const parentIndex = Math.max(0, (parent.parentObj?.node.children || []).findIndex(node => node.id === parent.node.id));
        const stagger = parentIndex % 2 ? 26 : -10;
        item.pos.x = parent.pos.x + side * (190 + Math.abs(localIndex) * 22);
        item.pos.y = parent.pos.y + localIndex * 76 + stagger;
      });
    }

    function nodeRadius(depth) {
      if (depth === 0) return 58;
      if (depth === 1) return 48;
      if (depth === 2) return 31;
      return 22;
    }

    function labelLines(text, depth) {
      const normalized = text
        .replace("Theme I — ", "Theme I|")
        .replace("Theme II — ", "Theme II|");
      if (normalized.includes("|")) return normalized.split("|").filter(Boolean);

      const limit = depth <= 1 ? 28 : 24;
      if (normalized.length <= limit) return [normalized];

      const words = normalized.split(/\s+/);
      const lines = [];
      let line = "";
      words.forEach(word => {
        const next = line ? `${line} ${word}` : word;
        if (next.length > limit && line) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      });
      if (line) lines.push(line);
      return lines.slice(0, depth <= 1 ? 2 : 3).map(item => (
        item.length > limit + 6 ? `${item.slice(0, limit + 3)}...` : item
      ));
    }

    function connectionPath(parentItem, childItem) {
      const from = parentItem.pos;
      const to = childItem.pos;
      const side = to.x >= from.x ? 1 : -1;
      const curve = clamp(Math.abs(to.x - from.x) * 0.48, 80, 170);
      const lift = childItem.depth === 1 ? -24 : 0;
      return `M ${from.x} ${from.y} C ${from.x + side * curve} ${from.y + lift}, ${to.x - side * curve} ${to.y - lift}, ${to.x} ${to.y}`;
    }

    function createDefs() {
      const defs = svgEl("defs");
      const shadow = svgEl("filter", {
        id: "soft-paper-shadow",
        x: "-20%",
        y: "-20%",
        width: "140%",
        height: "140%",
      });
      shadow.append(
        svgEl("feDropShadow", {
          dx: "0",
          dy: "5",
          stdDeviation: "5",
          "flood-color": "#1c1d1b",
          "flood-opacity": ".14",
        })
      );
      defs.append(shadow);

      const arrowSoft = svgEl("marker", {
        id: "arrow-soft",
        markerWidth: "9",
        markerHeight: "9",
        refX: "8",
        refY: "4.5",
        orient: "auto",
        markerUnits: "strokeWidth",
      });
      arrowSoft.append(svgEl("path", { d: "M 0 0 L 9 4.5 L 0 9 z", fill: "#9da4a1", opacity: ".65" }));
      defs.append(arrowSoft);

      const arrowActive = svgEl("marker", {
        id: "arrow-active",
        markerWidth: "10",
        markerHeight: "10",
        refX: "9",
        refY: "5",
        orient: "auto",
        markerUnits: "strokeWidth",
      });
      arrowActive.append(svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#1c1d1b", opacity: ".86" }));
      defs.append(arrowActive);
      return defs;
    }

    function shouldShowPreview(item) {
      if (!item.node.preview && !item.node.images?.length) return false;
      if (item.depth === 0) return false;
      if (item.depth === 1) return true;
      return item.node.id === selectedId || (selectedPath.has(item.node.id) && item.depth <= 2);
    }

    function addBackgroundSketch(layer, items) {
      const root = items.find(item => item.depth === 0);
      if (!root) return;

      layer.append(svgEl("ellipse", {
        class: "atlas-orbit is-wide",
        cx: "0",
        cy: "118",
        rx: "700",
        ry: "64",
      }));

      items.filter(item => item.depth <= 1).forEach(item => {
        const radius = nodeRadius(item.depth);
        const p = paletteFor(item.node);
        layer.append(svgEl("ellipse", {
          class: "atlas-domain",
          cx: item.pos.x,
          cy: item.pos.y,
          rx: radius * (item.depth === 0 ? 3.25 : 2.95),
          ry: radius * (item.depth === 0 ? 2.1 : 1.9),
          fill: p.wash,
        }));
        layer.append(svgEl("ellipse", {
          class: "atlas-orbit",
          cx: item.pos.x,
          cy: item.pos.y,
          rx: radius * (item.depth === 0 ? 2.15 : 2.42),
          ry: radius * (item.depth === 0 ? 1.28 : 1.38),
        }));
      });
    }

    function addConnections(layer, packetLayer, items) {
      items.forEach((item, index) => {
        if (!item.parentObj) return;
        const active = selectedPath.has(item.node.id) && selectedPath.has(item.parentObj.node.id);
        const p = paletteFor(item.node);
        const path = svgEl("path", {
          class: `diagram-link${active ? " is-active" : ""}`,
          d: connectionPath(item.parentObj, item),
          stroke: active ? "#1c1d1b" : p.line,
          "marker-end": active ? "url(#arrow-active)" : "url(#arrow-soft)",
        });
        layer.append(path);

        const packetCount = active ? 3 : 1;
        const packets = [];
        for (let i = 0; i < packetCount; i++) {
          const packet = svgEl("rect", {
            class: `data-packet${active ? " is-active" : ""}`,
            width: active ? "8" : "6",
            height: active ? "8" : "6",
            rx: "1",
            fill: active ? "#1c1d1b" : p.accent,
          });
          packetLayer.append(packet);
          packets.push(packet);
        }

        connectionRecords.push({
          path,
          packets,
          length: 0,
          phase: (index * 0.137) % 1,
          speed: active ? 0.00018 : 0.00008,
        });
      });
    }

    function addLabel(group, item, radius) {
      const lines = labelLines(item.node.name, item.depth);
      const fontSize = item.depth <= 1 ? 13 : 11;
      const lineHeight = fontSize + 3;
      const labelWidth = Math.max(...lines.map(line => line.length)) * fontSize * 0.54 + 24;
      const labelHeight = lines.length * lineHeight + 12;
      const y = -radius - labelHeight - (item.depth <= 1 ? 16 : 10);
      const p = paletteFor(item.node);

      group.append(svgEl("rect", {
        class: "node-label-bg",
        x: -labelWidth / 2,
        y,
        width: labelWidth,
        height: labelHeight,
        rx: "3",
        stroke: selectedPath.has(item.node.id) ? p.accent : "rgba(28,29,27,.16)",
      }));

      const text = svgEl("text", {
        class: "node-label",
        x: "0",
        y: y + 12 + fontSize * 0.76,
        "font-size": fontSize,
      });
      lines.forEach((line, index) => {
        text.append(svgEl("tspan", {
          x: "0",
          dy: index ? lineHeight : 0,
        }, line));
      });
      group.append(text);
    }

    function addNode(layer, item) {
      const node = item.node;
      const radius = nodeRadius(item.depth);
      const p = paletteFor(node);
      const selected = node.id === selectedId;
      const pathActive = selectedPath.has(node.id);
      const prominence = nodeProminence(node.id);
      const group = svgEl("g", {
        class: [
          "map-node",
          selected ? "is-selected" : "",
          pathActive ? "is-path" : "",
          node.children?.length ? "has-children" : "",
        ].filter(Boolean).join(" "),
        transform: `translate(${item.pos.x} ${item.pos.y})`,
        opacity: prominence,
        "data-node-id": node.id,
      });

      group.append(svgEl("title", {}, node.name));
      group.append(svgEl("circle", {
        class: "node-hit",
        r: radius + 24,
      }));
      group.append(svgEl("circle", {
        class: "node-shadow",
        cx: radius * 0.08,
        cy: radius * 0.1,
        r: radius * 1.04,
      }));
      group.append(svgEl("circle", {
        class: "node-body",
        r: radius,
        fill: p.surface,
        filter: "url(#soft-paper-shadow)",
      }));
      group.append(svgEl("circle", {
        class: "node-outline",
        r: radius,
        stroke: selected || pathActive ? p.accent : "#1c1d1b",
      }));
      group.append(svgEl("circle", {
        class: "node-center",
        r: radius * (item.depth === 0 ? 0.32 : 0.18),
        fill: item.depth === 0 ? "#fffaf0" : p.deep,
      }));

      [
        [-0.38, -0.22, 0.08],
        [0.18, -0.34, 0.06],
        [0.28, 0.18, 0.05],
      ].forEach(([x, y, size], index) => {
        group.append(svgEl("circle", {
          class: "node-marker",
          cx: x * radius,
          cy: y * radius,
          r: radius * size,
          fill: index === 0 ? p.deep : "#1c1d1b",
        }));
      });

      if (node.children?.length) {
        const isExpanded = expanded.has(node.id);
        const badge = svgEl("g", {
          class: "branch-badge",
          transform: `translate(${radius * 0.78} ${radius * 0.76})`,
        });
        badge.append(svgEl("circle", { r: item.depth <= 1 ? "11" : "9", fill: "#fffaf0", stroke: p.accent }));
        badge.append(svgEl("path", {
          d: isExpanded ? "M -5 0 H 5" : "M -5 0 H 5 M 0 -5 V 5",
          stroke: p.accent,
          "stroke-width": "1.8",
          "stroke-linecap": "round",
        }));
        group.append(badge);
      }

      addLabel(group, item, radius);
      group.addEventListener("mouseenter", () => {
        hoveredId = node.id;
        group.classList.add("is-hovered");
      });
      group.addEventListener("mouseleave", () => {
        if (hoveredId === node.id) hoveredId = null;
        group.classList.remove("is-hovered");
      });
      group.addEventListener("click", event => {
        event.stopPropagation();
        if (ignoreNextClick || dragMoved >= 18) return;
        selectNode(node.id, true);
      });
      layer.append(group);
    }

    function addPreview(layer, item) {
      if (!shouldShowPreview(item)) return;
      const node = item.node;
      const src = node.preview || node.images?.[0]?.src;
      const radius = nodeRadius(item.depth);
      const side = item.pos.x < 0 ? -1 : 1;
      const width = item.depth === 1 ? 98 : 78;
      const height = item.depth === 1 ? 62 : 50;
      const x = item.pos.x + side * (radius + width * 0.74);
      const y = item.pos.y + radius * 0.22;
      const p = paletteFor(node);
      const group = svgEl("g", {
        class: `preview-card${selectedPath.has(node.id) ? " is-path" : ""}`,
        transform: `translate(${x} ${y})`,
        "data-node-id": node.id,
      });
      group.addEventListener("click", event => {
        event.stopPropagation();
        if (ignoreNextClick || dragMoved >= 18) return;
        selectNode(node.id, true);
      });

      group.append(svgEl("rect", {
        x: -width / 2,
        y: -height / 2,
        width,
        height,
        rx: "3",
        fill: "#fffaf0",
        stroke: p.accent,
      }));
      group.append(svgEl("image", {
        href: src,
        x: -width / 2 + 5,
        y: -height / 2 + 5,
        width: width - 10,
        height: height - 10,
        preserveAspectRatio: "xMidYMid meet",
      }));
      layer.append(group);
    }

    function renderDetails(id) {
      selectedId = id;
      selectedPath = getPathIds(id);
      const node = nodesById.get(id);
      if (!node) return;

      detailTitle.textContent = node.name;
      detailPath.textContent = getPathText(id);
      detailDescription.textContent = node.description || "";

      const images = node.images || [];
      imageCount.textContent = `${images.length} visual${images.length === 1 ? "" : "s"}`;
      gallery.innerHTML = images.length
        ? images.map((image, index) => {
          const className = index === 0 ? "gallery-card visual-hero" : "gallery-card visual-thumb";
          return `<figure class="${className}"><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.caption || node.name)}" loading="eager" decoding="async" /><figcaption class="gallery-caption">${escapeHtml(image.caption || "Research visual")}</figcaption></figure>`;
        }).join("")
        : `<div class="empty">Add a visual by setting <code>preview</code> or <code>images</code> in <code>js/research-data.js</code>.</div>`;

      modelsList.innerHTML = (node.models || []).map(item => `<li>${escapeHtml(item)}</li>`).join("") || `<li class="empty">No model or method entries yet.</li>`;
      const papers = node.papers || [];
      papersList.innerHTML = papers.length
        ? papers.map(paper => `<a class="paper-card" href="${escapeHtml(paper.url || "#")}" ${paper.url ? 'target="_blank" rel="noopener"' : ""}><strong>${escapeHtml(paper.title)}</strong><span>${escapeHtml(paper.meta || "")}</span></a>`).join("")
        : `<div class="empty">No publication linked to this research area yet.</div>`;
      nextList.innerHTML = (node.next || []).map(item => `<li>${escapeHtml(item)}</li>`).join("") || `<li class="empty">No current or next work listed yet.</li>`;
    }

    function fitToItems(items, immediate = false) {
      if (!items.length) return;
      const padding = Math.max(96, Math.min(view.width, view.height) * 0.18);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      items.forEach(item => {
        const radius = nodeRadius(item.depth);
        const labelPad = item.depth <= 1 ? 96 : 72;
        const fontSize = item.depth <= 1 ? 13 : 11;
        const labelHalfWidth = Math.max(...labelLines(item.node.name, item.depth).map(line => line.length)) * fontSize * 0.27 + 18;
        const previewPad = shouldShowPreview(item) ? (item.depth === 1 ? 142 : 112) : 0;
        const xPad = Math.max(radius * (item.depth <= 1 ? 3.35 : 2.4), labelHalfWidth) + previewPad;
        minX = Math.min(minX, item.pos.x - xPad);
        maxX = Math.max(maxX, item.pos.x + xPad);
        minY = Math.min(minY, item.pos.y - radius * 2.65 - labelPad);
        maxY = Math.max(maxY, item.pos.y + radius * 2.3 + 54);
      });

      const contentWidth = Math.max(1, maxX - minX);
      const contentHeight = Math.max(1, maxY - minY);
      const nextScale = clamp(
        Math.min((view.width - padding * 2) / contentWidth, (view.height - padding * 2) / contentHeight),
        0.18,
        1.42
      );
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const nextTx = view.width / 2 - centerX * nextScale;
      const nextTy = view.height / 2 - centerY * nextScale;

      view.baseScale = nextScale;
      view.baseTx = nextTx;
      view.baseTy = nextTy;
      view.targetScale = nextScale;
      view.targetTx = nextTx;
      view.targetTy = nextTy;

      if (immediate) {
        view.scale = nextScale;
        view.tx = nextTx;
        view.ty = nextTy;
        applyTransform();
      }
    }

    function applyTransform() {
      if (!worldGroup) return;
      worldGroup.setAttribute("transform", `translate(${view.tx} ${view.ty}) scale(${view.scale})`);
    }

    function rebuildMap(options = {}) {
      const fit = options.fit ?? false;
      selectedPath = getPathIds(selectedId);
      connectionRecords.length = 0;
      clear(svg);
      svg.append(createDefs());
      worldGroup = svgEl("g", { class: "map-world" });

      const backgroundLayer = svgEl("g", { class: "background-layer" });
      const connectionLayer = svgEl("g", { class: "connection-layer" });
      const packetLayer = svgEl("g", { class: "packet-layer" });
      const previewLayer = svgEl("g", { class: "preview-layer" });
      const nodeLayer = svgEl("g", { class: "node-layer" });

      worldGroup.append(backgroundLayer, connectionLayer, packetLayer, previewLayer, nodeLayer);
      svg.append(worldGroup);

      const items = visibleItems();
      layoutItems(items);
      addBackgroundSketch(backgroundLayer, items);
      addConnections(connectionLayer, packetLayer, items);
      items.forEach(item => addPreview(previewLayer, item));
      items.forEach(item => addNode(nodeLayer, item));

      requestAnimationFrame(() => {
        connectionRecords.forEach(record => {
          record.length = record.path.getTotalLength();
        });
      });

      if (fit) fitToItems(items, options.immediate ?? false);
      applyTransform();
    }

    function resizeMap(forceFit = false) {
      const rect = canvasWrap.getBoundingClientRect();
      view.width = Math.max(1, rect.width);
      view.height = Math.max(1, rect.height);
      svg.setAttribute("viewBox", `0 0 ${view.width} ${view.height}`);
      svg.setAttribute("width", view.width);
      svg.setAttribute("height", view.height);

      const sizeChanged = Math.abs(view.width - lastSize.width) > 4 || Math.abs(view.height - lastSize.height) > 4;
      lastSize = { width: view.width, height: view.height };
      if (forceFit || (sizeChanged && !view.userMoved)) {
        const items = Array.from(itemById.values());
        if (items.length) fitToItems(items, true);
      }
      applyTransform();
    }

    function clientPoint(event) {
      const rect = svg.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }

    function zoomAt(event) {
      event.preventDefault();
      const point = clientPoint(event);
      const nextScale = clamp(view.targetScale * Math.exp(-event.deltaY * 0.001), 0.18, 2.6);
      const worldX = (point.x - view.targetTx) / view.targetScale;
      const worldY = (point.y - view.targetTy) / view.targetScale;

      view.targetScale = nextScale;
      view.targetTx = point.x - worldX * nextScale;
      view.targetTy = point.y - worldY * nextScale;
      view.userMoved = true;
    }

    function selectNode(id, shouldToggleBranch) {
      const node = nodesById.get(id);
      if (!node) return;
      renderDetails(id);
      if (shouldToggleBranch && node.children?.length) {
        expanded.has(id) ? expanded.delete(id) : expanded.add(id);
      }
      view.userMoved = false;
      rebuildMap({ fit: true });
    }

    function resetView() {
      view.userMoved = false;
      fitToItems(Array.from(itemById.values()), false);
    }

    svg.addEventListener("pointerdown", event => {
      if (event.button != null && event.button !== 0) return;
      const target = event.target.closest?.("[data-node-id]");
      pointerDownNodeId = target ? target.getAttribute("data-node-id") : null;
      isDragging = true;
      dragMoved = 0;
      lastX = event.clientX;
      lastY = event.clientY;
      svg.classList.add("is-panning");
      svg.setPointerCapture?.(event.pointerId);
    });

    svg.addEventListener("pointermove", event => {
      if (!isDragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      dragMoved += Math.abs(dx) + Math.abs(dy);
      view.targetTx += dx;
      view.targetTy += dy;
      view.userMoved = true;
      lastX = event.clientX;
      lastY = event.clientY;
    });

    svg.addEventListener("pointerup", () => {
      const clickNodeId = pointerDownNodeId;
      const wasDrag = dragMoved >= 18;
      pointerDownNodeId = null;
      isDragging = false;
      svg.classList.remove("is-panning");
      ignoreNextClick = true;
      if (!wasDrag && clickNodeId) {
        selectNode(clickNodeId, true);
        setTimeout(() => {
          ignoreNextClick = false;
        }, 50);
        return;
      }
      setTimeout(() => {
        ignoreNextClick = false;
      }, 0);
    });

    svg.addEventListener("pointercancel", () => {
      isDragging = false;
      pointerDownNodeId = null;
      svg.classList.remove("is-panning");
      ignoreNextClick = false;
    });

    svg.addEventListener("click", event => {
      const target = event.target.closest?.("[data-node-id]");
      if (!target || ignoreNextClick || dragMoved >= 18) return;
      selectNode(target.getAttribute("data-node-id"), true);
    });

    svg.addEventListener("wheel", zoomAt, { passive: false });

    resetBtn.addEventListener("click", resetView);
    expandBtn.addEventListener("click", () => {
      nodesById.forEach((node, id) => {
        if (node.children?.length) expanded.add(id);
      });
      view.userMoved = false;
      rebuildMap({ fit: true });
    });
    collapseBtn.addEventListener("click", () => {
      expanded = new Set(["core"]);
      renderDetails("core");
      view.userMoved = false;
      rebuildMap({ fit: true });
    });
    rotateBtn.addEventListener("click", () => {
      autoDrift = !autoDrift;
      rotateBtn.textContent = autoDrift ? "Pause Drift" : "Resume Drift";
      rotateBtn.setAttribute("aria-pressed", String(!autoDrift));
    });

    function animate(time) {
      if (autoDrift && !view.userMoved && !isDragging && !reducedMotion.matches) {
        view.targetTx = view.baseTx + Math.sin(time * 0.00022) * 12;
        view.targetTy = view.baseTy + Math.cos(time * 0.00018) * 8;
      }

      view.scale += (view.targetScale - view.scale) * 0.16;
      view.tx += (view.targetTx - view.tx) * 0.16;
      view.ty += (view.targetTy - view.ty) * 0.16;
      applyTransform();

      connectionRecords.forEach(record => {
        if (!record.length) return;
        record.packets.forEach((packet, index) => {
          const phase = (record.phase + index / Math.max(1, record.packets.length)) % 1;
          const t = reducedMotion.matches ? phase : (phase + time * record.speed) % 1;
          const point = record.path.getPointAtLength(record.length * t);
          const size = Number(packet.getAttribute("width")) || 6;
          packet.setAttribute("x", point.x - size / 2);
          packet.setAttribute("y", point.y - size / 2);
        });
      });

      requestAnimationFrame(animate);
    }

    new ResizeObserver(() => resizeMap()).observe(canvasWrap);
    resizeMap(true);
    renderDetails("core");
    rebuildMap({ fit: true, immediate: true });
    if (loading) loading.classList.add("hidden");
    requestAnimationFrame(animate);
  } catch (error) {
    console.error(error);
    if (loading) {
      loading.classList.remove("hidden");
      loading.innerHTML = `<strong>Map failed to load.</strong><br><span>${String(error.message || error)}</span><br><small>Check that <code>js/research-data.js</code> loaded and that the browser supports SVG.</small>`;
    }
  }
})();
