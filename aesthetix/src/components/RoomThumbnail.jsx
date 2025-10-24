import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// --- RoomThumbnail improvements ---
// 1. Camera auto-fit to room bounds
// 2. Better lighting and shadow
// 3. Show more furniture (up to 10)
// 4. Add a grid floor for context

const RoomThumbnail = ({ dimensions, polygon, colors, lighting, furniture, width = 260, height = 140 }) => {
  const mountRef = useRef();

  // Updated RoomThumbnail to align with Room's createRoomFromPolygon logic
  useEffect(() => {
    const mount = mountRef.current;
    while (mount && mount.firstChild) mount.removeChild(mount.firstChild);
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f7f9fb');

    // Compute room center and bounds
    let center = { x: 0, y: 0 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    if (polygon && polygon.length > 1) {
      polygon.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
      center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    }

    // Camera auto-fit
    const camDist = 1.5 * Math.max(maxX - minX, maxY - minY, dimensions?.height || 3);
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(center.x + camDist, camDist, center.y + camDist);
    camera.lookAt(center.x, 0, center.y);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Floor
    if (polygon && polygon.length > 1) {
      const floorShape = new THREE.Shape();
      floorShape.moveTo(polygon[0].x, polygon[0].y);
      polygon.forEach((p, i) => { if (i > 0) floorShape.lineTo(p.x, p.y); });
      floorShape.lineTo(polygon[0].x, polygon[0].y);
      const geometry = new THREE.ShapeGeometry(floorShape);
      const material = new THREE.MeshStandardMaterial({ color: colors?.floor || "#e0e0e0" });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = Math.PI / 2;
      scene.add(mesh);
    }

    // Walls
    if (polygon && polygon.length > 1) {
      const wallShape = new THREE.Shape();
      wallShape.moveTo(polygon[0].x, polygon[0].y);
      polygon.forEach((p, i) => { if (i > 0) wallShape.lineTo(p.x, p.y); });
      wallShape.lineTo(polygon[0].x, polygon[0].y);
      const extrudeSettings = { depth: dimensions?.height || 3, bevelEnabled: false };
      const geometry = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);
      const material = new THREE.MeshStandardMaterial({ color: colors?.walls || "#d6d6d6", opacity: 0.85, transparent: true });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 0;
      scene.add(mesh);
    }

    // Furniture
    if (Array.isArray(furniture)) {
      furniture.forEach(item => {
        const geo = new THREE.BoxGeometry(item.dimensions?.width || 1, item.dimensions?.height || 1, item.dimensions?.depth || 1);
        const mat = new THREE.MeshStandardMaterial({ color: item.color || 0x1976d2 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(item.position?.x || 0, item.position?.y || 0, item.position?.z || 0);
        mesh.rotation.y = item.rotation || 0;
        scene.add(mesh);
      });
    }

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, lighting?.ambient || 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, lighting?.directional || 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = false;
    scene.add(dirLight);

    // Added grid floor for better context
    const gridHelper = new THREE.GridHelper(20, 20, '#cccccc', '#eeeeee');
    scene.add(gridHelper);

    renderer.render(scene, camera);
    return () => {
      renderer.dispose();
      while (mount && mount.firstChild) mount.removeChild(mount.firstChild);
    };
  }, [dimensions, polygon, colors, lighting, furniture, width, height]);

  return <div ref={mountRef} style={{ width, height, borderRadius: 12, overflow: "hidden", background: "#f8f8f8", boxShadow: '0 2px 8px #eee' }} />;
};

export default RoomThumbnail;
