import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import JSZip from "jszip";

// Persistent cache and state outside component
const gltfCache = {};
let persistent = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  frameId: null,
  room: null,
  placedFurniture: [],
  highlightCircle: null,
  ghost: null,
  ghostYOffset: 0,
  raycaster: null,
  mouse: { x: 0, y: 0 },
  rotation: 0,
  animateGhost: null,
  lastHideWallIdx: null,
  lastPolygon: null,
  lastColors: null,
  lastLighting: null,
  lastDimensions: null,
  lastShowAllWalls: null,
  selectedBoxHelper: null,
};

const Room = ({ dimensions, polygon, colors, lighting, showAllWalls, furniture = [], activeFurniture, selectedFurnitureIndex, onSelectFurniture, onPlaceFurniture, onRotateFurniture, onDeleteFurniture, onScaleFurniture, onMoveFurniture }) => {
  const mountRef = useRef(null);
  const cameraRef = useRef();
  const controlsRef = useRef();
  const highlightRef = useRef();
  const ghostRef = useRef();
  const raycasterRef = useRef();
  const mouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef(0);
  const [menuPosition, setMenuPosition] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [canvasRect, setCanvasRect] = useState(null);
  const menuRef = useRef();

  const selectedIndexRef = useRef(selectedFurnitureIndex);
  useEffect(() => {
    selectedIndexRef.current = selectedFurnitureIndex;
  }, [selectedFurnitureIndex]);

  // Drag state refs for robust drag-and-move, like ghost placement
  const isDraggingRef = useRef(false);
  const dragIndexRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, z: 0 });

  // Helper: point-in-polygon
  function isPointInPolygon(x, z, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, zi = poly[i].y;
      const xj = poly[j].x, zj = poly[j].y;
      const intersect = ((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi + 1e-10) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Helper: create room mesh from polygon, with option to hide a wall by index
  function createRoomFromPolygon(polygon, height, hideWallIdx = null) {
    const group = new THREE.Group();
    const wallMaterial = new THREE.MeshStandardMaterial({ color: colors.walls, roughness: 0.5, metalness: 0.1 });
    const wallThickness = 0.3;

    // Fallback to rectangle if no polygon or <3 points
    let shape, center = { x: 0, y: 0 };
    if (polygon && polygon.length >= 3) {
      // Calculate centroid for centering
      let sumX = 0, sumY = 0;
      for (const pt of polygon) { sumX += pt.x; sumY += pt.y; }
      center.x = sumX / polygon.length;
      center.y = sumY / polygon.length;
      persistent.polygonCenter = center;
      shape = new THREE.Shape();
      shape.moveTo(polygon[0].x - center.x, polygon[0].y - center.y);
      for (let i = 1; i < polygon.length; i++) {
        shape.lineTo(polygon[i].x - center.x, polygon[i].y - center.y);
      }
      shape.lineTo(polygon[0].x - center.x, polygon[0].y - center.y); // close
    } else {
      // fallback rectangle
      shape = new THREE.Shape();
      shape.moveTo(-dimensions.width / 2, -dimensions.depth / 2);
      shape.lineTo(dimensions.width / 2, -dimensions.depth / 2);
      shape.lineTo(dimensions.width / 2, dimensions.depth / 2);
      shape.lineTo(-dimensions.width / 2, dimensions.depth / 2);
      shape.lineTo(-dimensions.width / 2, -dimensions.depth / 2);
    }

    // Floor
    const extrudeSettings = { depth: 0.1, bevelEnabled: false };
    const floorGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const floor = new THREE.Mesh(
      floorGeom,
      new THREE.MeshStandardMaterial({ color: colors.floor, roughness: 0.8, metalness: 0.2 })
    );
    floor.rotation.x = Math.PI / 2;
    floor.position.y = 0;
    group.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(
      floorGeom.clone(),
      new THREE.MeshStandardMaterial({ color: colors.ceiling, roughness: 0.9, metalness: 0.1 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = height;
    group.add(ceiling);

    // Walls
    if (polygon && polygon.length >= 3) {
      for (let i = 0; i < polygon.length; i++) {
        if (hideWallIdx !== null && i === hideWallIdx) continue;
        const a = polygon[i];
        const b = polygon[(i + 1) % polygon.length];
        // Centered points
        const ax = a.x - center.x, ay = a.y - center.y;
        const bx = b.x - center.x, by = b.y - center.y;
        const wallLen = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
        const wallGeom = new THREE.BoxGeometry(wallLen, height, wallThickness);
        const wall = new THREE.Mesh(wallGeom, wallMaterial);
        // Find wall center
        const midX = (ax + bx) / 2;
        const midY = (ay + by) / 2;
        wall.position.set(midX, height / 2, midY);
        // Rotate wall
        const angle = Math.atan2(by - ay, bx - ax);
        wall.rotation.y = -angle;
        group.add(wall);
      }
    } else {
      // fallback rectangle walls (centered)
      const width = dimensions.width;
      const depth = dimensions.depth;

      // Left Wall (-x)
      const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, height, depth),
        wallMaterial
      );
      leftWall.position.set(-width / 2 + wallThickness / 2, height / 2, 0);
      group.add(leftWall);

      // Right Wall (+x)
      const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, height, depth),
        wallMaterial
      );
      rightWall.position.set(width / 2 - wallThickness / 2, height / 2, 0);
      group.add(rightWall);

      // Back Wall (-z)
      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, wallThickness),
        wallMaterial
      );
      backWall.position.set(0, height / 2, -depth / 2 + wallThickness / 2);
      group.add(backWall);

      // Front Wall (+z)
      const frontWall = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, wallThickness),
        wallMaterial
      );
      frontWall.position.set(0, height / 2, depth / 2 - wallThickness / 2);
      group.add(frontWall);
    }

    return group;
  }

  // Helper: Load GLTF from URL or ZIP (robust: detect ZIP by content, not just extension)
  async function loadGLTFFromUrlOrZip(url) {
    // Try extension-based first
    if (url.match(/\.(gltf|glb)$/i)) {
      // Direct GLTF/GLB
      return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
      });
    }
    // Otherwise, fetch and inspect content type
    try {
      const response = await fetch(url);
      const contentType = response.headers.get('Content-Type') || '';
      const blob = await response.blob();
      // If it's a ZIP (by content type or by trying to open as ZIP)
      const isZip = contentType.includes('zip') || url.match(/\.zip($|\?)/i);
      if (isZip || await isBlobZip(blob)) {
        // Try to open as ZIP
        let zip;
        try {
          zip = await JSZip.loadAsync(blob);
        } catch (e) {
          throw new Error("Could not open ZIP: " + e.message);
        }
        // Find .gltf or .glb file ANYWHERE in the ZIP (including subfolders)
        let modelFile = null;
        zip.forEach((relativePath, file) => {
          if (!modelFile && relativePath.match(/\.(gltf|glb)$/i)) {
            modelFile = file;
          }
        });
        if (!modelFile) throw new Error("No .gltf or .glb file in ZIP");
        const modelExt = modelFile.name.split('.').pop().toLowerCase();
        const modelData = await modelFile.async("arraybuffer");
        // Prepare URL map for external resources (robust: all path variants)
        const blobURLs = {};
        for (const relPath in zip.files) {
          if (relPath === modelFile.name) continue;
          const file = zip.files[relPath];
          if (!file.dir) {
            const ext = relPath.split('.').pop().toLowerCase();
            if (["bin", "jpg", "jpeg", "png", "webp", "gif", "ktx2"].includes(ext)) {
              const fileBlob = await file.async("blob");
              blobURLs[relPath] = URL.createObjectURL(fileBlob);
              blobURLs[relPath.replace(/^\.\//, "")] = blobURLs[relPath];
              blobURLs[relPath.replace(/.*\//, "")] = blobURLs[relPath]; // just filename
            }
          }
        }
        // Patch GLTFLoader to resolve resources from blobURLs
        const loader = new GLTFLoader();
        loader.setCrossOrigin('anonymous');
        loader.setResourcePath('');
        loader.setDRACOLoader && loader.setDRACOLoader(null); // No Draco
        loader.manager.setURLModifier((url) => {
          const clean = url.replace(/^\.\//, "");
          return blobURLs[url] || blobURLs[clean] || blobURLs[url.replace(/.*\//, "")] || url;
        });
        let scene;
        if (modelExt === "gltf") {
          const modelBlob = new Blob([modelData], { type: "model/gltf+json" });
          const modelUrl = URL.createObjectURL(modelBlob);
          scene = await new Promise((resolve, reject) => {
            loader.load(modelUrl, (gltf) => resolve(gltf.scene), undefined, reject);
          });
          URL.revokeObjectURL(modelUrl);
        } else if (modelExt === "glb") {
          const modelBlob = new Blob([modelData], { type: "model/gltf-binary" });
          const modelUrl = URL.createObjectURL(modelBlob);
          scene = await new Promise((resolve, reject) => {
            loader.load(modelUrl, (gltf) => resolve(gltf.scene), undefined, reject);
          });
          URL.revokeObjectURL(modelUrl);
        }
        // Clean up blob URLs after use (optional, for memory)
        setTimeout(() => { Object.values(blobURLs).forEach(URL.revokeObjectURL); }, 10000);
        return scene;
      }
      // If not a ZIP, try as GLB/GLTF by content type
      if (contentType.includes('gltf') || contentType.includes('glb')) {
        return new Promise((resolve, reject) => {
          const loader = new GLTFLoader();
          const fileUrl = URL.createObjectURL(blob);
          loader.load(fileUrl, (gltf) => {
            URL.revokeObjectURL(fileUrl);
            resolve(gltf.scene);
          }, undefined, (err) => {
            URL.revokeObjectURL(fileUrl);
            reject(err);
          });
        });
      }
      throw new Error("Unsupported model URL or file type: " + url);
    } catch (e) {
      console.error("Failed to load model:", e.message, url);
      throw new Error("Failed to load model: " + e.message);
    }
  }

  // Helper: check if blob is a ZIP by magic number
  async function isBlobZip(blob) {
    const header = await blob.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(header);
    // ZIP files start with 0x50 0x4B 0x03 0x04
    return bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04;
  }

  // Setup scene/camera/renderer ONCE
  useEffect(() => {
    const mount = mountRef.current;
    let width = mount.clientWidth;
    let height = mount.clientHeight;
    if (!persistent.scene) {
      persistent.scene = new THREE.Scene();
      persistent.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      persistent.camera.position.set(20, 15, 20);
      persistent.camera.lookAt(0, 5, 0);
      cameraRef.current = persistent.camera;
      persistent.renderer = new THREE.WebGLRenderer({ antialias: true });
      persistent.renderer.setSize(width, height);
      persistent.renderer.setClearColor(0xe8e8e8);
      persistent.renderer.shadowMap.enabled = true;
      persistent.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      persistent.renderer.toneMappingExposure = 1.5;
      mount.appendChild(persistent.renderer.domElement);
      persistent.controls = new OrbitControls(persistent.camera, persistent.renderer.domElement);
      persistent.controls.enableDamping = true;
      controlsRef.current = persistent.controls;
      const ambientLight = new THREE.AmbientLight(0xffffff, lighting.ambient + 0.5);
      persistent.scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, lighting.directional + 0.6);
      directionalLight.position.set(10, 20, 10);
      directionalLight.castShadow = true;
      persistent.scene.add(directionalLight);
      const gridHelper = new THREE.GridHelper(500, 500, 0xcccccc, 0xcccccc);
      persistent.scene.add(gridHelper);
      persistent.raycaster = new THREE.Raycaster();
      raycasterRef.current = persistent.raycaster;
    }
    mouseRef.current = persistent.mouse;
    function handleResize() {
      width = mount.clientWidth;
      height = mount.clientHeight;
      persistent.renderer.setSize(width, height);
      persistent.camera.aspect = width / height;
      persistent.camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Effect: update placed furniture when furniture changes
  useEffect(() => {
    const scene = persistent.scene;
    if (!scene) return;
    persistent.placedFurniture.forEach(obj => scene.remove(obj));
    persistent.placedFurniture = [];
    if (furniture && Array.isArray(furniture)) {
      furniture.forEach((item) => {
        let mesh;
        if (!item) return;
        if (item.gltfUrl) {
          (async () => {
            try {
              let model;
              if (gltfCache[item.gltfUrl]) {
                model = gltfCache[item.gltfUrl].clone();
              } else {
                model = await loadGLTFFromUrlOrZip(item.gltfUrl);
                gltfCache[item.gltfUrl] = model;
                model = model.clone();
              }
              const box = new THREE.Box3().setFromObject(model);
              const size = new THREE.Vector3();
              box.getSize(size);
              const maxDim = Math.max(size.x, size.y, size.z);
              let scale = 1.2 / maxDim;
              if (item.scale) scale *= item.scale;
              model.scale.set(scale, scale, scale);
              box.getCenter(model.position).multiplyScalar(-1);
              const yOffset = box.min.y * model.scale.y;
              model.position.y = -yOffset + (item.position?.[1] || 0) + 0.0001; // Add a very small adjustment to avoid floating
              model.position.x = item.position?.[0] || 0;
              model.position.z = item.position?.[2] || 0;
              model.rotation.y = item.rotation || 0;
              scene.add(model);
              persistent.placedFurniture.push(model);
            } catch (e) {
              mesh = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshStandardMaterial({ color: 0x8888ff })
              );
              mesh.position.x = item.position?.[0] || 0;
              mesh.position.z = item.position?.[2] || 0;
              mesh.position.y = 0.5;
              mesh.rotation.y = item.rotation || 0;
              if (item.scale) mesh.scale.set(item.scale, item.scale, item.scale);
              scene.add(mesh);
              persistent.placedFurniture.push(mesh);
            }
          })();
        } else {
          mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x8888ff })
          );
          mesh.position.x = item.position?.[0] || 0;
          mesh.position.z = item.position?.[2] || 0;
          mesh.position.y = 0.5;
          mesh.rotation.y = item.rotation || 0;
          if (item.scale) mesh.scale.set(item.scale, item.scale, item.scale);
          scene.add(mesh);
          persistent.placedFurniture.push(mesh);
        }
      });
    }
  }, [furniture]);

  // Sims-style placement mode (ghost, highlight, hand cursor, ESC, R, grid snap)
  useEffect(() => {
    const scene = persistent.scene;
    const camera = persistent.camera;
    const renderer = persistent.renderer;
    const controls = persistent.controls;
    const raycaster = persistent.raycaster;
    const mount = mountRef.current;
    let floorY = 0.1;
    let canPlace = true;
    let ghostYOffset = 0;
    let rotation = rotationRef.current;
    if (persistent.highlightCircle) scene.remove(persistent.highlightCircle);
    if (persistent.ghost) scene.remove(persistent.ghost);
    persistent.highlightCircle = null;
    persistent.ghost = null;
    if (activeFurniture) {
      if (mount) mount.style.cursor = 'grab';
      const circleGeom = new THREE.CircleGeometry(0.7, 32);
      const circleMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, opacity: 0.4, transparent: true });
      const highlightCircle = new THREE.Mesh(circleGeom, circleMat);
      highlightCircle.rotation.x = -Math.PI / 2;
      highlightCircle.position.y = floorY + 0.01;
      scene.add(highlightCircle);
      persistent.highlightCircle = highlightCircle;
      highlightRef.current = highlightCircle;
      (async () => {
        let ghost;
        try {
          if (activeFurniture.gltfUrl) {
            if (gltfCache[activeFurniture.gltfUrl]) {
              ghost = gltfCache[activeFurniture.gltfUrl].clone();
            } else {
              ghost = await loadGLTFFromUrlOrZip(activeFurniture.gltfUrl);
              gltfCache[activeFurniture.gltfUrl] = ghost;
              ghost = ghost.clone();
            }
            const box = new THREE.Box3().setFromObject(ghost);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
              const scale = 1.2 / maxDim;
              ghost.scale.set(scale, scale, scale);
            }
            box.getCenter(ghost.position).multiplyScalar(-1);
            ghostYOffset = box.min.y * ghost.scale.y;
            ghost.position.y = -ghostYOffset;
            ghost.traverse((child) => {
              if (child.isMesh) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = 0.7;
              }
            });
          } else {
            ghost = new THREE.Mesh(
              new THREE.BoxGeometry(1, 1, 1),
              new THREE.MeshStandardMaterial({ color: 0x00ffcc, opacity: 0.5, transparent: true })
            );
            ghost.position.y = 0.5;
          }
        } catch (e) {
          ghost = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x00ffcc, opacity: 0.5, transparent: true })
          );
          ghost.position.y = 0.5;
        }
        scene.add(ghost);
        persistent.ghost = ghost;
        ghostRef.current = ghost;
        persistent.ghostYOffset = ghostYOffset;
      })();
      function onPointerMove(e) {
        const rect = mount.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        persistent.mouse.x = x;
        persistent.mouse.y = y;
      }
      mount.addEventListener('pointermove', onPointerMove);
      function onKeyDown(e) {
        if (e.key === 'Escape') {
          if (onPlaceFurniture) onPlaceFurniture(null);
        }
        if (e.key.toLowerCase() === 'r') {
          rotationRef.current += Math.PI / 2;
        }
      }
      window.addEventListener('keydown', onKeyDown);
      function onPointerDown(e) {
  if (!persistent.ghost) return;

  const pos = persistent.ghost.position;
  const snapped = [
    Math.round(pos.x * 2) / 2,
    Math.round(pos.y * 1000) / 1000,
    Math.round(pos.z * 2) / 2
  ];

  const center = persistent.polygonCenter || { x: 0, y: 0 };
  const px = snapped[0] + center.x;
  const pz = snapped[2] + center.y;

  if (isPointInPolygon(px, pz, polygon)) {
    if (onPlaceFurniture) {
      onPlaceFurniture({
        ...activeFurniture,
        position: snapped,
        rotation: rotationRef.current
      });
    }
  }
}

      mount.addEventListener('pointerdown', onPointerDown);
      function animateGhost() {
        if (persistent.ghost && persistent.highlightCircle) {
          const raycaster = persistent.raycaster;
          raycaster.setFromCamera(persistent.mouse, persistent.camera);
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY);
          const intersect = new THREE.Vector3();
          raycaster.ray.intersectPlane(plane, intersect);
          let x = Math.round(intersect.x * 2) / 2;
          let z = Math.round(intersect.z * 2) / 2;
          const center = persistent.polygonCenter || { x: 0, y: 0 };
          const xInPoly = x + center.x;
          const zInPoly = z + center.y;
          canPlace = isPointInPolygon(xInPoly, zInPoly, polygon);
          persistent.ghost.position.x = x;
          persistent.ghost.position.z = z;
          // Raycast down from above ghost's X/Z
          const downRay = new THREE.Raycaster(
            new THREE.Vector3(x, 10, z),
            new THREE.Vector3(0, -1, 0)
          );
          const intersects = downRay.intersectObjects(persistent.placedFurniture, true);

          let targetY = floorY;
          if (intersects.length > 0) {
            const topObject = intersects[0].object;
            const bbox = new THREE.Box3().setFromObject(topObject);
            targetY = bbox.max.y; // Top surface of the object
          } 

// Place ghost just above the surface
persistent.ghost.position.y = targetY - persistent.ghostYOffset;

          persistent.ghost.rotation.y = rotationRef.current;
          persistent.highlightCircle.position.x = x;
          persistent.highlightCircle.position.z = z;
          canPlace = true;
          
          persistent.highlightCircle.material.color.set(canPlace ? 0x00ffcc : 0xff4444);
        }
        persistent.animateGhost = requestAnimationFrame(animateGhost);
      }
      animateGhost();
      return () => {
        if (mount) mount.style.cursor = '';
        mount.removeEventListener('pointermove', onPointerMove);
        mount.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('keydown', onKeyDown);
        if (persistent.animateGhost) cancelAnimationFrame(persistent.animateGhost);
      };
    } else {
      if (mount) mount.style.cursor = '';
      if (persistent.highlightCircle) {
        persistent.scene.remove(persistent.highlightCircle);
        persistent.highlightCircle = null;
      }
      if (persistent.ghost) {
        persistent.scene.remove(persistent.ghost);
        persistent.ghost = null;
      }
    }
  }, [activeFurniture, polygon, onPlaceFurniture]);

  // Animation loop with dynamic wall hiding and reactivity
  useEffect(() => {
    const scene = persistent.scene;
    const camera = persistent.camera;
    const renderer = persistent.renderer;
    const controls = persistent.controls;
    function deepEqual(a, b) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    function animate() {
      persistent.frameId = requestAnimationFrame(animate);
      if (controls && !window.dragMode && !activeFurniture) controls.update();
      // --- Dynamic wall hiding logic ---
      let hideWallIdx = null;
      if (!showAllWalls && polygon && polygon.length >= 3) {
        let minDist = Infinity;
        let center = { x: 0, y: 0 };
        for (const pt of polygon) { center.x += pt.x; center.y += pt.y; }
        center.x /= polygon.length; center.y /= polygon.length;
        for (let i = 0; i < polygon.length; i++) {
          const a = polygon[i];
          const b = polygon[(i + 1) % polygon.length];
          const ax = a.x - center.x, ay = a.y - center.y;
          const bx = b.x - center.x, by = b.y - center.y;
          const mx = (ax + bx) / 2, mz = (ay + by) / 2;
          const wallPos = new THREE.Vector3(mx, dimensions.height / 2, mz);
          const dist = camera.position.distanceTo(wallPos);
          if (dist < minDist) {
            minDist = dist;
            hideWallIdx = i;
          }
        }
      }
      // --- Reactivity: update room mesh if polygon/colors/lighting/dimensions/showAllWalls/hidden wall changes ---
      const needsRoomUpdate =
        persistent.lastHideWallIdx !== hideWallIdx ||
        !deepEqual(persistent.lastPolygon, polygon) ||
        !deepEqual(persistent.lastColors, colors) ||
        !deepEqual(persistent.lastLighting, lighting) ||
        !deepEqual(persistent.lastDimensions, dimensions) ||
        persistent.lastShowAllWalls !== showAllWalls;
      if (needsRoomUpdate) {
        if (persistent.room) scene.remove(persistent.room);
        persistent.room = createRoomFromPolygon(polygon, dimensions.height, hideWallIdx);
        scene.add(persistent.room);
        persistent.lastHideWallIdx = hideWallIdx;
        persistent.lastPolygon = JSON.parse(JSON.stringify(polygon));
        persistent.lastColors = { ...colors };
        persistent.lastLighting = { ...lighting };
        persistent.lastDimensions = { ...dimensions };
        persistent.lastShowAllWalls = showAllWalls;
        // Update lights
        // Remove all ambient/directional lights
        scene.children = scene.children.filter(obj =>
          !(obj.isAmbientLight || obj.isDirectionalLight)
        );
        const ambientLight = new THREE.AmbientLight(0xffffff, lighting.ambient + 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, lighting.directional + 0.6);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
      }
      // Ensure renderer is defined before calling render
      if (renderer) {
        renderer.render(scene, camera);
      }
    }
    animate();
    return () => {
      if (persistent.frameId) cancelAnimationFrame(persistent.frameId);
    };
  }, [polygon, colors, lighting, dimensions, showAllWalls]);

  // --- Furniture selection and hover logic ---
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !persistent.scene || !furniture || !Array.isArray(furniture)) return;
    const renderer = persistent.renderer;
    const camera = persistent.camera;
    const raycaster = new THREE.Raycaster();
    let pointer = { x: 0, y: 0 };

    function getPointer(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
      };
    }

    function onPointerMove(event) {
      if (window.dragMode && selectedIndexRef.current !== null && !activeFurniture) {
        event.preventDefault();
        event.stopPropagation();
      }
      const pt = getPointer(event);
      raycaster.setFromCamera(pt, camera);
      const intersects = raycaster.intersectObjects(persistent.placedFurniture, true);
      // --- DRAG LOGIC MIRRORING GHOST PLACEMENT ---
      if (isDraggingRef.current && dragIndexRef.current !== null) {
        if (persistent.controls) persistent.controls.enabled = false;
        renderer.domElement.style.cursor = 'grabbing';
        // Dragging selected furniture
        const yLevel = furniture[dragIndexRef.current]?.position?.[1] ?? 0;
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -yLevel);
        const intersect = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersect);
        if (intersect) {
          const newX = intersect.x - dragOffsetRef.current.x;
          const newZ = intersect.z - dragOffsetRef.current.z;
          if (typeof onMoveFurniture === 'function') {
            onMoveFurniture(dragIndexRef.current, [newX, 0, newZ]);
          }
        }
        return;
      } else {
        if (persistent.controls) persistent.controls.enabled = true;
      }
      if (intersects.length > 0) {
        let mesh = intersects[0].object;
        while (mesh.parent && !persistent.placedFurniture.includes(mesh)) {
          mesh = mesh.parent;
        }
        const idx = persistent.placedFurniture.indexOf(mesh);
        if (idx !== -1) {
          setHoveredIndex(idx);
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredIndex(null);
      renderer.domElement.style.cursor = '';
    }

    function onPointerDown(event) {
      if (window.dragMode && selectedIndexRef.current !== null && !activeFurniture) {
        event.preventDefault();
        event.stopPropagation();
      }
      const pt = getPointer(event);
      raycaster.setFromCamera(pt, camera);
      const intersects = raycaster.intersectObjects(persistent.placedFurniture, true);
      if (intersects.length > 0) {
        let mesh = intersects[0].object;
        while (mesh.parent && !persistent.placedFurniture.includes(mesh)) {
          mesh = mesh.parent;
        }
        const idx = persistent.placedFurniture.indexOf(mesh);
        if (idx !== -1 && typeof onSelectFurniture === 'function') {
          onSelectFurniture(idx);
          // Only start drag if dragMode is active and this is the selected item
          if (window.dragMode && selectedIndexRef.current === idx) {
            isDraggingRef.current = true;
            dragIndexRef.current = idx;
            if (persistent.controls) persistent.controls.enabled = false;
            renderer.domElement.style.cursor = 'grabbing';
            // Calculate offset from mesh center
            const yLevel = furniture[idx]?.position?.[1] ?? 0;
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -yLevel);
            const intersect = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, intersect);
            if (intersect && furniture[idx]?.position) {
              dragOffsetRef.current.x = intersect.x - (furniture[idx].position[0] || 0);
              dragOffsetRef.current.z = intersect.z - (furniture[idx].position[2] || 0);
            }
          }
        }
      } else {
        // Clicked outside any furniture: deselect
        if (typeof onSelectFurniture === 'function') onSelectFurniture(null);
      }
    }

    function onPointerUp(event) {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        dragIndexRef.current = null;
        if (persistent.controls) persistent.controls.enabled = true;
        renderer.domElement.style.cursor = '';
      }
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    setCanvasRect(renderer.domElement.getBoundingClientRect());
    return () => {
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.style.cursor = '';
    };
  }, [furniture, onSelectFurniture, selectedFurnitureIndex]);

  // --- Highlight selected furniture ---
  useEffect(() => {
    if (!persistent.scene) return;
    if (persistent.selectedBoxHelper) {
      persistent.scene.remove(persistent.selectedBoxHelper);
      persistent.selectedBoxHelper = null;
    }
    if (
      typeof selectedFurnitureIndex === 'number' &&
      selectedFurnitureIndex >= 0 &&
      persistent.placedFurniture[selectedFurnitureIndex]
    ) {
      const mesh = persistent.placedFurniture[selectedFurnitureIndex];
      const boxHelper = new THREE.BoxHelper(mesh, 0x00ff00);
      boxHelper.material.linewidth = 4;
      persistent.scene.add(boxHelper);
      persistent.selectedBoxHelper = boxHelper;
      if (canvasRect && persistent.camera) {
        const pos = new THREE.Vector3();
        mesh.getWorldPosition(pos);
        pos.y += 1.2;
        const projected = pos.clone().project(persistent.camera);
        const x = ((projected.x + 1) / 2) * canvasRect.width + canvasRect.left;
        const y = ((-projected.y + 1) / 2) * canvasRect.height + canvasRect.top;
        setMenuPosition({ x, y });
      }
    } else {
      setMenuPosition(null);
    }
  }, [selectedFurnitureIndex, furniture, canvasRect]);

  // --- Floating menu for selected furniture ---
  return (
    <>
      <div
        ref={mountRef}
        style={{ width: "100%", height: "100%", minHeight: 400, minWidth: 400 }}
        className="room-canvas-container"
      ></div>
      {menuPosition && typeof selectedFurnitureIndex === 'number' && selectedFurnitureIndex >= 0 && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: menuPosition.x,
            top: menuPosition.y,
            zIndex: 1000,
            background: 'rgba(255,255,255,0.97)',
            border: '2px solid #00ff00',
            borderRadius: 10,
            padding: '6px 10px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            transform: 'translate(-50%, -100%)',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* Drag button */}
          <button
            title="Drag to move"
            style={{
              background: window.dragMode ? '#e0ffe0' : 'white',
              border: window.dragMode ? '2px solid #00bb00' : '1px solid #bbb',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: window.dragMode ? '0 0 6px #00ff00' : 'none',
            }}
            onClick={() => {
              window.dragMode = !window.dragMode;
              if (window.dragMode) {
                if (typeof onPlaceFurniture === 'function') onPlaceFurniture(null);
              }
              if (persistent.controls) persistent.controls.enabled = !window.dragMode;
            }}
          >
            <span role="img" aria-label="Drag" style={{fontSize: 20}}>🖐️</span>
          </button>
          {/* Rotate */}
          <button
            title="Rotate"
            style={{
              background: 'white',
              border: '1px solid #bbb',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={() => onRotateFurniture(selectedFurnitureIndex, Math.PI / 4)}
          >
            <span role="img" aria-label="Rotate" style={{fontSize: 20}}>⟳</span>
          </button>
          {/* Bigger */}
          <button
            title="Bigger"
            style={{
              background: 'white',
              border: '1px solid #bbb',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={() => onScaleFurniture(selectedFurnitureIndex, 1.1)}
          >
            <span role="img" aria-label="Bigger" style={{fontSize: 20}}>➕</span>
          </button>
          {/* Smaller */}
          <button
            title="Smaller"
            style={{
              background: 'white',
              border: '1px solid #bbb',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={() => onScaleFurniture(selectedFurnitureIndex, 0.9)}
          >
            <span role="img" aria-label="Smaller" style={{fontSize: 20}}>➖</span>
          </button>
          {/* Delete */}
          <button
            title="Delete"
            style={{
              background: 'white',
              border: '1px solid #bbb',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={() => onDeleteFurniture(selectedFurnitureIndex)}
          >
            <span role="img" aria-label="Delete" style={{fontSize: 20, color: '#d00'}}>🗑️</span>
          </button>
        </div>
      )}
    </>
  );
};

export default Room;