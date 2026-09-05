(async function () {
  const loading = document.getElementById("loading");

  try {
    if (!window.researchTree) throw new Error("Research data did not load. Check js/research-data.js.");
    if (loading) loading.textContent = "Initializing research constellation...";

    const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.180.0/+esm");
    const researchTree = window.researchTree;

    const canvas = document.getElementById("mapCanvas");
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

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tmpScale = new THREE.Vector3(1, 1, 1);
    const yAxis = new THREE.Vector3(0, 1, 0);
    const billboardQuaternion = new THREE.Quaternion();
    const inverseResearchQuaternion = new THREE.Quaternion();
    const projectedPosition = new THREE.Vector3();
    const worldPosition = new THREE.Vector3();

    const PALETTE = {
      core: {
        surface: 0xeef4ff,
        deep: 0x7f8da9,
        accent: 0xa7ecff,
        edge: 0xf4fbff,
        line: 0xf4b2cf,
      },
      composites: {
        surface: 0x314b67,
        deep: 0x20354c,
        accent: 0x8fcfff,
        edge: 0xa7ecff,
        line: 0xc2b6ff,
      },
      battery: {
        surface: 0x2f5369,
        deep: 0x203b50,
        accent: 0xa7ecff,
        edge: 0xd0f5ff,
        line: 0x8fcfff,
      },
      molecular: {
        surface: 0x211b32,
        deep: 0x121021,
        accent: 0xc2b6ff,
        edge: 0xf1d8ff,
        line: 0xf4b2cf,
      },
      validation: {
        surface: 0x2f2030,
        deep: 0x160f1d,
        accent: 0xf4b2cf,
        edge: 0xffd6e7,
        line: 0xc2b6ff,
      },
      outputs: {
        surface: 0x2f2b3a,
        deep: 0x151321,
        accent: 0xe8d9a7,
        edge: 0xfff4cc,
        line: 0xf4b2cf,
      },
    };

    const CATEGORY_COLORS = Object.fromEntries(Object.entries(PALETTE).map(([key, value]) => [key, value.accent]));

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
    let autoRotate = true;
    let hoveredId = null;
    let isDragging = false;
    let dragMoved = 0;
    let lastX = 0;
    let lastY = 0;
    let sceneRotationX = -0.14;
    let sceneRotationY = 0.18;
    let targetRotationX = sceneRotationX;
    let targetRotationY = sceneRotationY;
    let cameraDistance = defaultCameraDistance();
    let targetCameraDistance = cameraDistance;
    let lastCompact = isCompactView();

    const focusOffset = new THREE.Vector3();
    const targetFocusOffset = new THREE.Vector3();
    const itemById = new Map();
    const nodeRecords = new Map();
    const labelRecords = [];
    const previewRecords = [];
    const connectorRecords = [];
    const orbitalRecords = [];

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x526a82, 0.011);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 420);
    camera.position.set(0, 3.8, cameraDistance);
    camera.lookAt(0, 0, 0);

    buildLighting();
    buildAtmosphere();

    const researchGroup = new THREE.Group();
    scene.add(researchGroup);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const interactiveMeshes = [];

    function isCompactView() {
      const width = canvasWrap?.clientWidth || window.innerWidth || 1024;
      return width < 560;
    }

    function isTabletView() {
      const width = canvasWrap?.clientWidth || window.innerWidth || 1024;
      return width < 900;
    }

    function defaultCameraDistance() {
      if (isCompactView()) return 34.5;
      if (isTabletView()) return 36.5;
      return 31.5;
    }

    function maxCameraDistance() {
      if (isCompactView()) return 52;
      if (isTabletView()) return 56;
      return 54;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>\"]/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
      }[char]));
    }

    function hexToCss(hex) {
      return `#${hex.toString(16).padStart(6, "0")}`;
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

    function classifyNode(node, depth) {
      const text = `${node.id} ${node.name}`.toLowerCase();
      if (depth === 0) return "core";
      if (depth === 1 && node.category === "composites") return "theme-composite";
      if (depth === 1 && node.category === "battery") return "theme-battery";
      if (/publication|output|future|translation|paper/.test(text)) return "output";
      if (/molecular|interface|electrolyte|lpscl|md|atom|pu|carbon|cellulose/.test(text)) return "molecular";
      if (/validation|experimental|experiment|dsc|sem|eis|testing|load-cell|lab/.test(text)) return "experimental";
      if (/manufacturing|process|pultrusion|calender|spray|mixing|binder|electrode|dry|hot/.test(text)) return "process";
      if (/model|simulation|rve|abaqus|fidelity|force|optimization|transport|mechanics|field/.test(text)) return "simulation";
      return "simulation";
    }

    function nodeProminence(id) {
      if (selectedId === "core") return 0.94;
      if (id === selectedId) return 1;
      if (selectedPath.has(id)) return 0.9;
      if (isAdjacentToSelection(id)) return 0.78;
      return 0.48;
    }

    function physicalMaterial(node, options = {}) {
      const p = paletteFor(node);
      const opacity = options.opacity ?? 1;
      return new THREE.MeshPhysicalMaterial({
        color: options.color ?? p.surface,
        roughness: options.roughness ?? 0.25,
        metalness: options.metalness ?? 0.34,
        clearcoat: options.clearcoat ?? 0.78,
        clearcoatRoughness: options.clearcoatRoughness ?? 0.16,
        transmission: options.transmission ?? 0,
        thickness: options.thickness ?? 0.25,
        ior: options.ior ?? 1.45,
        emissive: options.emissive ?? p.accent,
        emissiveIntensity: options.emissiveIntensity ?? 0.035,
        transparent: opacity < 1 || (options.transmission ?? 0) > 0,
        opacity,
        depthWrite: opacity > 0.42,
      });
    }

    function lineMaterial(color, opacity, linewidth = 1) {
      return new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        linewidth,
        depthWrite: false,
      });
    }

    function additiveMaterial(color, opacity) {
      return new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
    }

    function buildLighting() {
      scene.add(new THREE.HemisphereLight(0xd7e7ff, 0x4a5d72, 1.7));

      const key = new THREE.DirectionalLight(0xd7eeff, 3.35);
      key.position.set(-8, 12, 10);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      scene.add(key);

      const topFill = new THREE.DirectionalLight(0xc2b6ff, 1.1);
      topFill.position.set(0, 13, -4);
      scene.add(topFill);

      const warmRim = new THREE.PointLight(0xf4b2cf, 8.2, 58);
      warmRim.position.set(12, 4, -12);
      scene.add(warmRim);

      const coolRim = new THREE.PointLight(0xa7ecff, 10.5, 62);
      coolRim.position.set(-14, 3, 9);
      scene.add(coolRim);

      const blueFill = new THREE.PointLight(0x8fcfff, 5.2, 46);
      blueFill.position.set(9, -4, 8);
      scene.add(blueFill);
    }

    function buildAtmosphere() {
      const hazeGeo = new THREE.SphereGeometry(58, 64, 32);
      const hazeMat = new THREE.MeshBasicMaterial({
        color: 0x8ea6bd,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
        depthWrite: false,
      });
      const haze = new THREE.Mesh(hazeGeo, hazeMat);
      scene.add(haze);

      const ringMat = lineMaterial(0xd9e8ff, 0.17);
      [9, 16, 25, 36].forEach((radius, i) => {
        const curve = new THREE.EllipseCurve(0, 0, radius, radius * (0.72 + i * 0.025), 0, Math.PI * 2);
        const points = curve.getPoints(180).map(point => new THREE.Vector3(point.x, -4.8 + i * 0.07, point.y));
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const ring = new THREE.LineLoop(geo, ringMat.clone());
        ring.rotation.x = -0.08;
        scene.add(ring);
        orbitalRecords.push({ object: ring, speed: 0.000018 * (i + 1), axis: "y" });
      });

      const particleCount = isCompactView() ? 520 : 900;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const colorA = new THREE.Color(0x8fcfff);
      const colorB = new THREE.Color(0xf4b2cf);
      const colorC = new THREE.Color(0xc2b6ff);

      for (let i = 0; i < particleCount; i++) {
        const radius = 8 + Math.random() * 48;
        const angle = Math.random() * Math.PI * 2;
        const height = -9 + Math.random() * 22;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = height;
        positions[i * 3 + 2] = Math.sin(angle) * radius * 0.7;

        const color = i % 9 === 0 ? colorC : i % 3 === 0 ? colorB : colorA;
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const particleMat = new THREE.PointsMaterial({
        size: 0.062,
        vertexColors: true,
        transparent: true,
        opacity: 0.46,
        sizeAttenuation: true,
        depthWrite: false,
      });
      const dataField = new THREE.Points(particleGeo, particleMat);
      scene.add(dataField);
      orbitalRecords.push({ object: dataField, speed: -0.000032, axis: "y" });
    }

    function drawRoundRect(ctx, x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + width - r, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + r);
      ctx.lineTo(x + width, y + height - r);
      ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      ctx.lineTo(x + r, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function labelLines(text, depth) {
      const normalized = text
        .replace("Theme I — ", "Theme I|")
        .replace("Theme II — ", "Theme II|");
      if (normalized.includes("|")) return normalized.split("|").filter(Boolean);

      const limit = depth <= 1 ? 34 : 30;
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
      return lines.slice(0, 2).map(line => line.length > limit + 5 ? `${line.slice(0, limit + 2)}...` : line);
    }

    function makeLabelTexture(text, colorHex, depth) {
      const width = 3072;
      const height = 720;
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, width, height);

      const lines = labelLines(text, depth);
      const boxW = depth <= 1 ? 2450 : 2100;
      const boxH = lines.length > 1 ? 430 : 310;
      const x = (width - boxW) / 2;
      const y = (height - boxH) / 2;
      const accent = hexToCss(colorHex);
      const grad = ctx.createLinearGradient(x, y, x + boxW, y + boxH);
      grad.addColorStop(0, "rgba(5,12,18,0.54)");
      grad.addColorStop(1, "rgba(14,25,35,0.18)");
      drawRoundRect(ctx, x, y, boxW, boxH, 58);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = `${accent}66`;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = `${accent}aa`;
      ctx.shadowBlur = depth <= 1 ? 28 : 18;
      ctx.fillStyle = "#eef4ff";
      ctx.font = `${depth <= 1 ? 500 : 500} ${depth <= 1 ? 112 : 92}px Inter, Arial, sans-serif`;
      const lineHeight = depth <= 1 ? 132 : 112;
      const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, index) => ctx.fillText(line, width / 2, startY + index * lineHeight));

      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
      return texture;
    }

    function makeCaptionTexture(text, colorHex) {
      const c = document.createElement("canvas");
      c.width = 1800;
      c.height = 260;
      const ctx = c.getContext("2d");
      const label = text.length > 58 ? `${text.slice(0, 55)}...` : text;
      const accent = hexToCss(colorHex);
      const grad = ctx.createLinearGradient(0, 0, c.width, c.height);
      grad.addColorStop(0, "rgba(5,12,17,0.72)");
      grad.addColorStop(1, "rgba(5,12,17,0.20)");
      drawRoundRect(ctx, 24, 34, c.width - 48, c.height - 68, 34);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = `${accent}44`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#eef4ff";
      ctx.font = "500 58px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = accent;
      ctx.shadowBlur = 16;
      ctx.fillText(label, c.width / 2, c.height / 2);

      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.generateMipmaps = true;
      return texture;
    }

    function makeFallbackPreviewTexture(node) {
      const c = document.createElement("canvas");
      c.width = 1400;
      c.height = 900;
      const ctx = c.getContext("2d");
      const p = paletteFor(node);
      const accent = hexToCss(p.accent);
      const edge = hexToCss(p.edge);
      const bg = ctx.createLinearGradient(0, 0, c.width, c.height);
      bg.addColorStop(0, "#101923");
      bg.addColorStop(0.5, "#071018");
      bg.addColorStop(1, "#11100d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, c.width, c.height);

      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      for (let x = 0; x < c.width; x += 86) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 120, c.height);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.strokeStyle = `${edge}dd`;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.ellipse(700, 390, 220, 145, -0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `${accent}bb`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(700, 390, 340, 50, 0.24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(700, 390, 52, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#edf7fb";
      ctx.font = "500 66px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(node.name.slice(0, 36), 700, 730);

      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.generateMipmaps = true;
      return texture;
    }

    function loadTextureSafe(src, node, onReady) {
      const fallback = makeFallbackPreviewTexture(node);
      if (!src) {
        onReady(fallback, { width: 1400, height: 900 });
        return;
      }

      const loader = new THREE.TextureLoader();
      loader.load(
        src,
        texture => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = true;
          texture.needsUpdate = true;
          const image = texture.image || {};
          onReady(texture, {
            width: image.naturalWidth || image.width || 1400,
            height: image.naturalHeight || image.height || 900,
          });
          fallback.dispose();
        },
        undefined,
        () => onReady(fallback, { width: 1400, height: 900 })
      );
    }

    function visibleItems() {
      const out = [];
      function walk(node, depth, parentObj) {
        const obj = { node, depth, parentObj, pos: new THREE.Vector3() };
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
      const compact = isCompactView();
      const tablet = isTabletView();
      const themes = researchTree.children || [];
      const themeSide = new Map(themes.map((theme, index) => [theme.id, index === 0 ? -1 : 1]));

      items.forEach(item => itemById.set(item.node.id, item));

      items.forEach(item => {
        if (item.depth === 0) {
          item.pos.set(0, 0.2, 0);
          return;
        }

        if (item.depth === 1) {
          const side = themeSide.get(item.node.id) || 1;
          const x = side * (compact ? 4.6 : tablet ? 5.9 : 7.2);
          const y = side < 0 ? (compact ? 1.4 : 1.7) : (compact ? -0.55 : -0.85);
          const z = side * (compact ? -0.35 : -0.9);
          item.pos.set(x, y, z);
          return;
        }

        const theme = topTheme(item);
        const side = themeSide.get(theme.node.id) || 1;
        const parent = item.parentObj;
        const siblings = parent.node.children || [];
        const idx = Math.max(0, siblings.findIndex(node => node.id === item.node.id));
        const center = (siblings.length - 1) / 2;
        const normalized = siblings.length > 1 ? (idx - center) / Math.max(center, 1) : 0;
        const angle = normalized * (compact ? 1.02 : 1.28);

        if (item.depth === 2) {
          const outward = compact ? 2.7 : tablet ? 3.8 : 4.8;
          const vertical = compact ? 2.55 : 3.35;
          const depth = compact ? 2.25 : 3.55;
          item.pos.set(
            parent.pos.x + side * outward,
            parent.pos.y - Math.sin(angle) * vertical,
            parent.pos.z + Math.cos(angle) * depth + (idx % 2 ? 0.9 : -0.9)
          );
          return;
        }

        const localIndex = idx - center;
        const outward = compact ? 1.75 + (item.depth - 3) * 1.0 : 2.55 + (item.depth - 3) * 1.42;
        item.pos.set(
          parent.pos.x + side * outward,
          parent.pos.y - localIndex * (compact ? 1.25 : 1.7),
          parent.pos.z + localIndex * (compact ? 1.05 : 1.55) - side * 0.75
        );
      });
    }

    function disposeMaterial(material) {
      if (!material) return;
      const materials = Array.isArray(material) ? material : [material];
      materials.forEach(item => {
        if (item.map) item.map.dispose();
        if (item.emissiveMap) item.emissiveMap.dispose();
        item.dispose();
      });
    }

    function disposeTree(root) {
      root.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        disposeMaterial(child.material);
      });
    }

    function clearResearchGroup() {
      while (researchGroup.children.length) {
        const child = researchGroup.children.pop();
        disposeTree(child);
      }
      interactiveMeshes.length = 0;
      nodeRecords.clear();
      labelRecords.length = 0;
      previewRecords.length = 0;
      connectorRecords.length = 0;
    }

    function makeCylinderBetween(from, to, radius, material, radialSegments = 10) {
      const direction = new THREE.Vector3().subVectors(to, from);
      const length = direction.length();
      const geometry = new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1, true);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(from).add(to).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(yAxis, direction.normalize());
      return mesh;
    }

    function addCoreVisual(record) {
      const { group, node, radius } = record;
      const p = paletteFor(node);

      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 1.05, 72, 44),
        physicalMaterial(node, {
          color: p.surface,
          roughness: 0.05,
          metalness: 0.02,
          clearcoat: 1,
          clearcoatRoughness: 0.06,
          transmission: 0.42,
          thickness: 0.8,
          opacity: 0.42,
          emissiveIntensity: 0.055,
        })
      );
      shell.castShadow = true;
      group.add(shell);
      record.materials.push(shell.material);

      const inner = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.42, 48, 28),
        new THREE.MeshPhysicalMaterial({
          color: 0xbfe8f8,
          metalness: 0.08,
          roughness: 0.18,
          clearcoat: 0.9,
          clearcoatRoughness: 0.12,
          emissive: p.accent,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.86,
        })
      );
      group.add(inner);
      record.materials.push(inner.material);

      const latticeGeo = new THREE.IcosahedronGeometry(radius * 0.78, 2);
      const lattice = new THREE.LineSegments(
        new THREE.EdgesGeometry(latticeGeo),
        lineMaterial(p.edge, 0.32)
      );
      group.add(lattice);
      record.spinObjects.push({ object: lattice, speed: 0.00012, axis: "y" });

      [
        { scale: 1.28, rx: Math.PI / 2.45, ry: 0.3, speed: 0.00018 },
        { scale: 1.52, rx: Math.PI / 2, ry: Math.PI / 3.2, speed: -0.00012 },
        { scale: 1.78, rx: Math.PI / 2.7, ry: -Math.PI / 4.6, speed: 0.00008 },
      ].forEach(spec => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(radius * spec.scale, radius * 0.012, 12, 160),
          additiveMaterial(p.edge, 0.48)
        );
        ring.rotation.set(spec.rx, spec.ry, 0);
        group.add(ring);
        record.spinObjects.push({ object: ring, speed: spec.speed, axis: "z" });
      });

      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 2.25, radius * 0.01, 10, 180),
        additiveMaterial(0xffffff, 0.11)
      );
      halo.rotation.x = Math.PI / 2;
      group.add(halo);
      record.spinObjects.push({ object: halo, speed: -0.00005, axis: "z" });
    }

    function addCompositeThemeVisual(record) {
      const { group, node, radius } = record;
      const p = paletteFor(node);
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 64, 32),
        physicalMaterial(node, {
          color: p.surface,
          roughness: 0.21,
          metalness: 0.64,
          clearcoat: 0.9,
          emissiveIntensity: 0.075,
        })
      );
      body.scale.set(1.18, 1.04, 1.18);
      body.castShadow = true;
      group.add(body);
      record.materials.push(body.material);

      for (let i = -3; i <= 3; i++) {
        const filament = new THREE.Mesh(
          new THREE.TorusGeometry(radius * (1.34 + Math.abs(i) * 0.035), radius * 0.006, 8, 150),
          additiveMaterial(i === 0 ? p.edge : p.accent, i === 0 ? 0.55 : 0.28)
        );
        filament.scale.set(1.1, 0.94, 1);
        filament.rotation.set(Math.PI / 2 + i * 0.05, 0.18, Math.PI / 10);
        filament.position.y = i * radius * 0.12;
        group.add(filament);
        record.spinObjects.push({ object: filament, speed: 0.00005 + i * 0.000003, axis: "z" });
      }

      const weaveGeo = new THREE.BufferGeometry();
      const points = [];
      for (let i = 0; i < 11; i++) {
        const t = (i / 10 - 0.5) * Math.PI;
        points.push(new THREE.Vector3(Math.cos(t) * radius * 1.2, Math.sin(t) * radius * 0.94, -radius * 0.64));
        points.push(new THREE.Vector3(Math.cos(t) * radius * 1.2, Math.sin(t) * radius * 0.94, radius * 0.64));
      }
      weaveGeo.setFromPoints(points);
      const weave = new THREE.LineSegments(weaveGeo, lineMaterial(p.edge, 0.22));
      group.add(weave);
    }

    function addBatteryThemeVisual(record) {
      const { group, node, radius } = record;
      const p = paletteFor(node);

      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.98, 56, 28),
        physicalMaterial(node, {
          color: p.surface,
          roughness: 0.18,
          metalness: 0.58,
          clearcoat: 0.78,
          emissiveIntensity: 0.075,
        })
      );
      shell.scale.set(1.08, 1.04, 1.08);
      group.add(shell);
      record.materials.push(shell.material);

      for (let i = -2; i <= 2; i++) {
        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(radius * (1.02 - Math.abs(i) * 0.04), radius * (1.02 - Math.abs(i) * 0.04), radius * 0.09, 64),
          physicalMaterial(node, {
            color: i % 2 ? 0x365870 : 0x263f56,
            roughness: 0.28,
            metalness: 0.5,
            clearcoat: 0.65,
            opacity: 0.9,
            emissiveIntensity: i === 0 ? 0.09 : 0.025,
          })
        );
        plate.rotation.x = Math.PI / 2;
        plate.position.z = i * radius * 0.19;
        group.add(plate);
        record.materials.push(plate.material);

        const edge = new THREE.Mesh(
          new THREE.TorusGeometry(radius * (1.03 - Math.abs(i) * 0.04), radius * 0.008, 8, 120),
          additiveMaterial(i === 0 ? p.edge : p.accent, i === 0 ? 0.5 : 0.24)
        );
        edge.rotation.x = Math.PI / 2;
        edge.position.z = plate.position.z;
        group.add(edge);
      }

      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = radius * (0.15 + Math.random() * 0.74);
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(radius * (0.025 + Math.random() * 0.025), 10, 8),
          additiveMaterial(i % 4 === 0 ? p.edge : p.accent, 0.42)
        );
        particle.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.78, radius * 0.67 + Math.random() * 0.04);
        group.add(particle);
      }
    }

    function addSimulationVisual(record) {
      const { group, node, radius } = record;
      const p = paletteFor(node);
      const body = new THREE.Mesh(
        new THREE.IcosahedronGeometry(radius, 2),
        physicalMaterial(node, {
          color: p.surface,
          roughness: 0.24,
          metalness: 0.36,
          clearcoat: 0.74,
          emissiveIntensity: 0.035,
          opacity: record.prominence > 0.6 ? 0.98 : 0.76,
        })
      );
      group.add(body);
      record.materials.push(body.material);

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(radius * 1.015, 2)),
        lineMaterial(p.edge, 0.2 + record.prominence * 0.22)
      );
      group.add(wire);
      record.spinObjects.push({ object: wire, speed: 0.00008, axis: "y" });

      const contour = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 1.12, radius * 0.008, 8, 96),
        additiveMaterial(p.line, 0.22)
      );
      contour.rotation.set(Math.PI / 2.3, Math.PI / 6, 0);
      group.add(contour);
    }

    function addExperimentalVisual(record) {
      const { group, node, radius } = record;
      const p = paletteFor(node);
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 1.28, radius * 0.78, radius * 1.1, 2, 2, 2),
        physicalMaterial(node, {
          color: p.surface,
          roughness: 0.2,
          metalness: 0.7,
          clearcoat: 0.55,
          emissiveIntensity: 0.025,
          opacity: record.prominence > 0.6 ? 1 : 0.82,
        })
      );
      block.rotation.set(0.18, 0.45, -0.12);
      group.add(block);
      record.materials.push(block.material);

      const dial = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.42, radius * 0.42, radius * 0.08, 36),
        additiveMaterial(p.edge, 0.36)
      );
      dial.rotation.x = Math.PI / 2;
      dial.position.z = radius * 0.58;
      group.add(dial);

      const rodMat = additiveMaterial(p.accent, 0.28);
      const rodA = makeCylinderBetween(
        new THREE.Vector3(-radius * 0.8, -radius * 0.42, 0),
        new THREE.Vector3(radius * 0.8, -radius * 0.42, 0),
        radius * 0.025,
        rodMat
      );
      group.add(rodA);
    }

    function addMolecularVisual(record) {
      const { group, node, radius } = record;
      const p = paletteFor(node);
      const atoms = [
        [-0.52, 0.05, 0.1],
        [-0.16, 0.36, -0.18],
        [0.25, 0.12, 0.2],
        [0.48, -0.25, -0.08],
        [-0.05, -0.38, 0.22],
        [0.05, 0.02, -0.42],
      ].map(values => new THREE.Vector3(values[0] * radius * 1.5, values[1] * radius * 1.5, values[2] * radius * 1.5));

      const atomMats = [
        physicalMaterial(node, { color: p.surface, roughness: 0.09, metalness: 0.06, transmission: 0.22, opacity: 0.78, emissiveIntensity: 0.1 }),
        additiveMaterial(p.accent, 0.7),
        additiveMaterial(p.edge, 0.58),
      ];

      atoms.forEach((position, index) => {
        const atom = new THREE.Mesh(
          new THREE.SphereGeometry(radius * (index === 0 ? 0.27 : 0.18), 26, 18),
          atomMats[index % atomMats.length]
        );
        atom.position.copy(position);
        group.add(atom);
        if (atom.material.isMeshPhysicalMaterial) record.materials.push(atom.material);
      });

      const bondMat = additiveMaterial(p.line, 0.38);
      [[0, 1], [1, 2], [2, 3], [2, 5], [0, 4], [4, 3]].forEach(([a, b]) => {
        group.add(makeCylinderBetween(atoms[a], atoms[b], radius * 0.025, bondMat.clone(), 8));
      });

      const shell = new THREE.Mesh(
        new THREE.IcosahedronGeometry(radius * 1.05, 1),
        new THREE.MeshBasicMaterial({
          color: p.edge,
          transparent: true,
          opacity: 0.1,
          wireframe: true,
          depthWrite: false,
        })
      );
      group.add(shell);
      record.spinObjects.push({ object: shell, speed: -0.00011, axis: "y" });
    }

    function addProcessVisual(record) {
      const { group, node, radius } = record;
      const p = paletteFor(node);
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(radius * 0.45, radius * 1.16, 8, 24),
        physicalMaterial(node, {
          color: p.surface,
          roughness: 0.18,
          metalness: 0.58,
          clearcoat: 0.72,
          emissiveIntensity: 0.035,
          opacity: record.prominence > 0.6 ? 1 : 0.78,
        })
      );
      body.rotation.z = Math.PI / 2;
      body.scale.set(1.05, 0.8, 0.8);
      group.add(body);
      record.materials.push(body.material);

      const path = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.9, radius * 0.012, 8, 120),
        additiveMaterial(p.edge, 0.28)
      );
      path.scale.set(1.55, 0.42, 1);
      path.rotation.set(Math.PI / 2, 0, -0.18);
      group.add(path);
      record.spinObjects.push({ object: path, speed: 0.00008, axis: "z" });

      for (let i = -1; i <= 1; i++) {
        const gate = new THREE.Mesh(
          new THREE.BoxGeometry(radius * 0.1, radius * 0.72, radius * 0.72),
          additiveMaterial(i === 0 ? p.edge : p.accent, i === 0 ? 0.42 : 0.24)
        );
        gate.position.x = i * radius * 0.48;
        group.add(gate);
      }
    }

    function addOutputVisual(record) {
      const { group, node, radius } = record;
      const p = paletteFor(node);
      for (let i = 0; i < 3; i++) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(radius * 1.0, radius * 1.24, radius * 0.035),
          physicalMaterial(node, {
            color: i === 1 ? p.surface : p.deep,
            roughness: 0.08,
            metalness: 0.04,
            clearcoat: 0.88,
            transmission: 0.18,
            opacity: 0.38,
            emissive: p.accent,
            emissiveIntensity: i === 1 ? 0.09 : 0.04,
          })
        );
        panel.position.set((i - 1) * radius * 0.22, (1 - i) * radius * 0.08, i * radius * 0.12);
        panel.rotation.set(0.08, -0.25 + i * 0.11, 0.04);
        group.add(panel);
        record.materials.push(panel.material);
      }

      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(radius * 1.08, radius * 1.32, radius * 0.04)),
        lineMaterial(p.edge, 0.34)
      );
      group.add(edge);
    }

    function addNodeVisual(record) {
      switch (record.archetype) {
        case "core":
          addCoreVisual(record);
          break;
        case "theme-composite":
          addCompositeThemeVisual(record);
          break;
        case "theme-battery":
          addBatteryThemeVisual(record);
          break;
        case "molecular":
          addMolecularVisual(record);
          break;
        case "experimental":
          addExperimentalVisual(record);
          break;
        case "process":
          addProcessVisual(record);
          break;
        case "output":
          addOutputVisual(record);
          break;
        case "simulation":
        default:
          addSimulationVisual(record);
      }
    }

    function addHitArea(record) {
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(record.radius * 1.85, 18, 12),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      hit.userData.nodeId = record.node.id;
      hit.name = `hit-${record.node.id}`;
      record.group.add(hit);
      interactiveMeshes.push(hit);
    }

    function addLabel(record) {
      const { group, node, depth, radius } = record;
      const p = paletteFor(node);
      const label = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeLabelTexture(node.name, p.edge, depth),
        transparent: true,
        depthTest: false,
        opacity: depth <= 1 ? 0.92 : 0.72,
        toneMapped: false,
      }));
      const labelWidth = depth === 0 ? 5.4 : depth === 1 ? 7.4 : 5.1;
      label.position.set(0, radius + (depth <= 1 ? 1.12 : 0.88), 0);
      label.scale.set(labelWidth, labelWidth * 0.235, 1);
      group.add(label);
      labelRecords.push({ nodeId: node.id, sprite: label, depth, baseOpacity: label.material.opacity });
    }

    function fitPlane(record, imageSize) {
      const aspect = Math.max(0.25, Math.min(4, imageSize.width / Math.max(1, imageSize.height)));
      let width = record.maxWidth;
      let height = width / aspect;
      if (height > record.maxHeight) {
        height = record.maxHeight;
        width = height * aspect;
      }

      record.plane.scale.set(width, height, 1);
      record.glow.scale.set(width * 1.04, height * 1.06, 1);
      record.edge.scale.set(width * 1.012, height * 1.012, 1);
      record.caption.position.y = -height * 0.5 - 0.34;
    }

    function addImagePreview(record) {
      const { item, node, radius, group } = record;
      const src = node.preview || (node.images && node.images[0] && node.images[0].src);
      const p = paletteFor(node);
      const compact = isCompactView();
      const maxWidth = compact ? (item.depth === 1 ? 2.35 : 1.72) : (item.depth === 1 ? 3.65 : 2.78);
      const maxHeight = maxWidth * 0.64;
      const side = item.depth >= 2
        ? (item.pos.x < 0 ? 1 : -1)
        : (item.pos.x < 0 ? -1 : 1);

      const display = new THREE.Group();
      display.position.set(side * (radius + (compact ? 1.18 : 2.05)), -0.03, item.depth === 1 ? 0.14 : 0.06);
      display.userData.nodeId = node.id;
      group.add(display);

      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          map: makeFallbackPreviewTexture(node),
          transparent: true,
          opacity: node.id === selectedId ? 0.96 : 0.68,
          side: THREE.DoubleSide,
          toneMapped: false,
        })
      );
      display.add(plane);

      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        additiveMaterial(p.accent, node.id === selectedId ? 0.2 : 0.035)
      );
      glow.position.z = -0.035;
      display.add(glow);

      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)),
        lineMaterial(p.edge, node.id === selectedId ? 0.48 : 0.1)
      );
      edge.position.z = 0.018;
      display.add(edge);

      const firstCaption = node.images?.[0]?.caption || node.name;
      const caption = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeCaptionTexture(firstCaption, p.edge),
        transparent: true,
        depthTest: false,
        opacity: node.id === selectedId ? 0.84 : 0,
        toneMapped: false,
      }));
      caption.scale.set(maxWidth * 0.95, maxWidth * 0.14, 1);
      display.add(caption);

      const previewRecord = {
        nodeId: node.id,
        group: display,
        plane,
        glow,
        edge,
        caption,
        maxWidth,
        maxHeight,
        side,
      };
      fitPlane(previewRecord, { width: 1400, height: 900 });
      previewRecords.push(previewRecord);

      loadTextureSafe(src, node, (texture, imageSize) => {
        if (plane.material.map) plane.material.map.dispose();
        plane.material.map = texture;
        plane.material.needsUpdate = true;
        fitPlane(previewRecord, imageSize);
      });
    }

    function addConnection(parentItem, childItem) {
      const parent = parentItem.node;
      const child = childItem.node;
      const active = selectedPath.has(parent.id) && selectedPath.has(child.id);
      const childPalette = paletteFor(child);
      const color = active ? childPalette.edge : childPalette.line;
      const from = parentItem.pos.clone();
      const to = childItem.pos.clone();
      const distance = from.distanceTo(to);
      const mid = from.clone().lerp(to, 0.5);
      mid.y += 0.42 + distance * 0.045;
      mid.z += (childItem.pos.x < 0 ? -1 : 1) * 0.42;
      const curve = new THREE.QuadraticBezierCurve3(from, mid, to);

      const radius = active ? 0.036 : 0.023;
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 58, radius, 8, false),
        new THREE.MeshPhysicalMaterial({
          color,
          emissive: color,
          emissiveIntensity: active ? 0.72 : 0.22,
          metalness: 0.05,
          roughness: 0.38,
          transparent: true,
          opacity: active ? 0.72 : 0.28,
          depthWrite: false,
        })
      );
      researchGroup.add(tube);

      const glow = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 58, radius * 2.8, 8, false),
        additiveMaterial(color, active ? 0.1 : 0.045)
      );
      researchGroup.add(glow);

      const pulseCount = active ? 3 : 1;
      for (let i = 0; i < pulseCount; i++) {
        const packet = new THREE.Mesh(
          new THREE.BoxGeometry(active ? 0.13 : 0.09, active ? 0.13 : 0.09, active ? 0.13 : 0.09),
          additiveMaterial(active ? 0xffffff : childPalette.edge, active ? 0.9 : 0.58)
        );
        researchGroup.add(packet);
        connectorRecords.push({
          packet,
          curve,
          phase: Math.random() + i / pulseCount,
          speed: active ? 0.00018 : 0.000075,
        });
      }
    }

    function nodeRadius(depth) {
      if (depth === 0) return 1.42;
      if (depth === 1) return 1.08;
      if (depth === 2) return 0.64;
      return 0.48;
    }

    function rebuildMap() {
      clearResearchGroup();
      selectedPath = getPathIds(selectedId);
      const items = visibleItems();
      layoutItems(items);

      items.forEach(item => {
        if (item.parentObj) addConnection(item.parentObj, item);
      });

      items.forEach(item => {
        const node = item.node;
        const depth = item.depth;
        const prominence = nodeProminence(node.id);
        const group = new THREE.Group();
        group.position.copy(item.pos);
        group.scale.setScalar(0.01);
        group.userData.nodeId = node.id;
        group.userData.birth = performance.now();
        researchGroup.add(group);

        const record = {
          item,
          node,
          depth,
          group,
          radius: nodeRadius(depth),
          prominence,
          archetype: classifyNode(node, depth),
          materials: [],
          spinObjects: [],
        };

        addNodeVisual(record);
        addHitArea(record);
        addLabel(record);
        if (depth > 0) addImagePreview(record);
        nodeRecords.set(node.id, record);
      });

      updateFocusTarget(true);
    }

    function renderDetails(id) {
      selectedId = id;
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

    function updateFocusTarget(animateCamera = true) {
      const item = itemById.get(selectedId);
      if (!item || selectedId === "core") {
        targetFocusOffset.set(0, 0, 0);
        if (animateCamera) targetCameraDistance = defaultCameraDistance();
        return;
      }

      const depth = depthById.get(selectedId) || 0;
      const compact = isCompactView();
      const selectedItems = Array.from(itemById.values()).filter(candidate => isDescendantOf(candidate.node.id, selectedId));
      const center = new THREE.Vector3();
      const min = new THREE.Vector3(Infinity, Infinity, Infinity);
      const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

      selectedItems.forEach(candidate => {
        center.add(candidate.pos);
        min.min(candidate.pos);
        max.max(candidate.pos);
      });
      center.multiplyScalar(1 / Math.max(1, selectedItems.length));

      const focusAmount = compact ? 0.16 : 0.32;
      targetFocusOffset.copy(center).multiplyScalar(-focusAmount);
      targetFocusOffset.y += compact ? -0.05 : 0.12;

      if (animateCamera) {
        const span = Math.max(max.x - min.x, max.y - min.y, max.z - min.z);
        const subtreeOpen = selectedItems.length > 1;
        const fittedDistance = subtreeOpen
          ? defaultCameraDistance() + span * (compact ? 0.62 : 0.5)
          : defaultCameraDistance() - Math.min(6, depth * 1.35);
        targetCameraDistance = Math.max(18, Math.min(maxCameraDistance(), fittedDistance));
      }
    }

    function resizeRenderer() {
      const rect = canvasWrap.getBoundingClientRect();
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();

      const compact = isCompactView();
      if (compact !== lastCompact) {
        lastCompact = compact;
        targetCameraDistance = defaultCameraDistance();
        rebuildMap();
      }
    }

    function updatePointer(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function updateHover() {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(interactiveMeshes, true)[0];
      hoveredId = hit ? hit.object.userData.nodeId : nearestNodeIdFromPointer(34);
      canvas.style.cursor = hoveredId ? "pointer" : "grab";
    }

    function nearestNodeIdFromPointer(threshold = 46) {
      const rect = canvas.getBoundingClientRect();
      let nearestId = null;
      let nearestDistance = Infinity;

      nodeRecords.forEach(record => {
        record.group.getWorldPosition(worldPosition);
        projectedPosition.copy(worldPosition).project(camera);
        if (projectedPosition.z < -1 || projectedPosition.z > 1) return;

        const sx = (projectedPosition.x * 0.5 + 0.5) * rect.width;
        const sy = (-projectedPosition.y * 0.5 + 0.5) * rect.height;
        const px = (pointer.x * 0.5 + 0.5) * rect.width;
        const py = (-pointer.y * 0.5 + 0.5) * rect.height;
        const distance = Math.hypot(px - sx, py - sy);
        const allowed = threshold + record.radius * (record.depth <= 1 ? 22 : 16);

        if (distance < allowed && distance < nearestDistance) {
          nearestDistance = distance;
          nearestId = record.node.id;
        }
      });

      return nearestId;
    }

    function selectNode(id, shouldToggleBranch) {
      const node = nodesById.get(id);
      if (!node) return;
      renderDetails(id);
      if (shouldToggleBranch && node.children?.length) {
        expanded.has(id) ? expanded.delete(id) : expanded.add(id);
      }
      rebuildMap();
    }

    function resetView() {
      targetRotationX = -0.14;
      targetRotationY = 0.18;
      targetCameraDistance = defaultCameraDistance();
      targetFocusOffset.set(0, 0, 0);
    }

    canvas.addEventListener("pointerdown", event => {
      isDragging = true;
      dragMoved = 0;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener("pointermove", event => {
      updatePointer(event);
      if (isDragging) {
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        dragMoved += Math.abs(dx) + Math.abs(dy);
        targetRotationY += dx * 0.005;
        targetRotationX = Math.max(-0.9, Math.min(0.86, targetRotationX + dy * 0.0035));
        lastX = event.clientX;
        lastY = event.clientY;
      } else {
        updateHover();
      }
    });

    canvas.addEventListener("pointerup", event => {
      isDragging = false;
      canvas.style.cursor = hoveredId ? "pointer" : "grab";
      if (dragMoved >= 8) return;
      updatePointer(event);
      updateHover();
      if (hoveredId) selectNode(hoveredId, true);
    });

    canvas.addEventListener("pointercancel", () => {
      isDragging = false;
      canvas.style.cursor = "grab";
    });

    canvas.addEventListener("wheel", event => {
      event.preventDefault();
      targetCameraDistance = Math.max(13, Math.min(maxCameraDistance(), targetCameraDistance + event.deltaY * 0.018));
    }, { passive: false });

    let lastTouchDistance = null;
    canvas.addEventListener("touchmove", event => {
      if (event.touches.length !== 2) return;
      event.preventDefault();
      const [a, b] = event.touches;
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (lastTouchDistance != null) {
        targetCameraDistance = Math.max(13, Math.min(maxCameraDistance(), targetCameraDistance + (lastTouchDistance - distance) * 0.035));
      }
      lastTouchDistance = distance;
    }, { passive: false });

    canvas.addEventListener("touchend", () => {
      lastTouchDistance = null;
    });

    resetBtn.addEventListener("click", resetView);
    expandBtn.addEventListener("click", () => {
      nodesById.forEach((node, id) => {
        if (node.children?.length) expanded.add(id);
      });
      rebuildMap();
    });
    collapseBtn.addEventListener("click", () => {
      expanded = new Set(["core"]);
      renderDetails("core");
      rebuildMap();
      resetView();
    });
    rotateBtn.addEventListener("click", () => {
      autoRotate = !autoRotate;
      rotateBtn.textContent = autoRotate ? "Pause Rotation" : "Resume Rotation";
      rotateBtn.setAttribute("aria-pressed", String(!autoRotate));
    });

    function animate(time) {
      if (autoRotate && !isDragging && !reducedMotion.matches) targetRotationY += 0.00042;

      sceneRotationX += (targetRotationX - sceneRotationX) * 0.1;
      sceneRotationY += (targetRotationY - sceneRotationY) * 0.1;
      cameraDistance += (targetCameraDistance - cameraDistance) * 0.08;
      focusOffset.lerp(targetFocusOffset, 0.07);

      camera.position.z = cameraDistance;
      camera.position.y = isCompactView() ? 2.2 : 3.75;
      camera.lookAt(0, 0, 0);
      researchGroup.position.copy(focusOffset);
      researchGroup.rotation.set(sceneRotationX, sceneRotationY, 0);

      orbitalRecords.forEach(record => {
        if (reducedMotion.matches) return;
        record.object.rotation[record.axis] += record.speed * (time > 0 ? 16 : 1);
      });

      connectorRecords.forEach(record => {
        const t = reducedMotion.matches ? record.phase % 1 : (time * record.speed + record.phase) % 1;
        record.packet.position.copy(record.curve.getPointAt(t));
      });

      nodeRecords.forEach(record => {
        const selected = record.node.id === selectedId;
        const hovered = record.node.id === hoveredId;
        const pathActive = selectedPath.has(record.node.id);
        const breathing = selected && !reducedMotion.matches ? 1 + Math.sin(time * 0.0017) * 0.018 : 1;
        const targetScale = breathing * (selected ? 1.13 : hovered ? 1.07 : pathActive ? 1.03 : 1);
        tmpScale.setScalar(targetScale);
        record.group.scale.lerp(tmpScale, 0.12);

        record.materials.forEach(material => {
          const base = selected ? 0.18 : hovered ? 0.12 : pathActive ? 0.08 : 0.035;
          material.emissiveIntensity += (base - material.emissiveIntensity) * 0.08;
        });

        record.spinObjects.forEach(spin => {
          if (!reducedMotion.matches) spin.object.rotation[spin.axis] += spin.speed * 16;
        });
      });

      labelRecords.forEach(record => {
        const selected = record.nodeId === selectedId;
        const hovered = record.nodeId === hoveredId;
        const pathActive = selectedPath.has(record.nodeId);
        const targetOpacity = selected || hovered ? 0.98 : pathActive ? Math.max(record.baseOpacity, 0.82) : record.baseOpacity;
        record.sprite.material.opacity += (targetOpacity - record.sprite.material.opacity) * 0.12;
      });

      inverseResearchQuaternion.copy(researchGroup.quaternion).invert();
      billboardQuaternion.copy(inverseResearchQuaternion).multiply(camera.quaternion);

      previewRecords.forEach(record => {
        const selected = record.nodeId === selectedId;
        const hovered = record.nodeId === hoveredId;
        const pathActive = selectedPath.has(record.nodeId);
        const targetOpacity = selected ? 0.98 : hovered ? 0.84 : pathActive ? 0.74 : 0.62;
        record.plane.material.opacity += (targetOpacity - record.plane.material.opacity) * 0.1;
        record.glow.material.opacity += ((selected ? 0.2 : hovered ? 0.12 : 0.035) - record.glow.material.opacity) * 0.1;
        record.edge.material.opacity += ((selected ? 0.52 : hovered ? 0.28 : 0.1) - record.edge.material.opacity) * 0.1;
        record.caption.material.opacity += ((selected ? 0.86 : 0) - record.caption.material.opacity) * 0.12;
        tmpScale.setScalar(selected ? 1.08 : hovered ? 1.04 : 1);
        record.group.scale.lerp(tmpScale, 0.12);
        record.group.quaternion.copy(billboardQuaternion);
        record.group.rotateY(record.side * 0.06);
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    new ResizeObserver(resizeRenderer).observe(canvasWrap);
    resizeRenderer();
    renderDetails("core");
    rebuildMap();
    if (loading) loading.classList.add("hidden");
    requestAnimationFrame(animate);
  } catch (error) {
    console.error(error);
    if (loading) {
      loading.classList.remove("hidden");
      loading.innerHTML = `<strong>Map failed to load.</strong><br><span>${String(error.message || error)}</span><br><small>Check WebGL support and confirm the Three.js CDN can load over HTTPS.</small>`;
    }
  }
})();
