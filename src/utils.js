import * as THREE from 'three';

// Utility: show a brief toast notification
export function showToast(message, type = 'info', duration = 2500) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// Utility: create a labeled box mesh
export function createLabeledBox(w, h, d, color, label, scene) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  if (label) {
    // Create a sprite for the label
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.roundRect(4, 4, 248, 56, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2, 0.5, 1);
    sprite.position.set(0, h / 2 + 0.5, 0);
    mesh.add(sprite);
  }

  scene.add(mesh);
  return mesh;
}

// Utility: create ground plane
export function createGround(scene, color = 0x4a7c59, size = 60) {
  const geo = new THREE.PlaneGeometry(size, size);
  const mat = new THREE.MeshLambertMaterial({ color });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  return ground;
}

// Utility: create basic lighting
export function createLighting(scene, ambientColor = 0x404060, dirColor = 0xffeedd) {
  const ambient = new THREE.AmbientLight(ambientColor, 0.8);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(dirColor, 1.2);
  dir.position.set(10, 20, 10);
  dir.castShadow = true;
  dir.shadow.mapSize.width = 1024;
  dir.shadow.mapSize.height = 1024;
  scene.add(dir);
  return { ambient, dir };
}

// Utility: text sprite
export function makeTextSprite(text, opts = {}) {
  const {
    fontSize = 20,
    fontColor = '#ffffff',
    bgColor = 'rgba(0,0,0,0.7)',
    width = 300,
    height = 60
  } = opts;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.roundRect(0, 0, width, height, 8);
  ctx.fill();
  ctx.fillStyle = fontColor;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  return sprite;
}

// Highlight meshes on hover
export function setupHoverHighlight(renderer, camera, scene, interactives, onHover, onClick) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hovered = null;
  const originalColors = new Map();

  function getTargets() {
    return interactives.map(i => i.mesh).filter(Boolean);
  }

  renderer.domElement.addEventListener('mousemove', e => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const targets = getTargets();
    const hits = raycaster.intersectObjects(targets, true);

    const newHovered = hits.length > 0 ? hits[0].object : null;
    const newItem = newHovered ? interactives.find(i => i.mesh === newHovered || i.mesh.getObjectById(newHovered.id)) : null;
    const resolvedMesh = newItem ? newItem.mesh : null;

    if (hovered !== resolvedMesh) {
      // Restore old
      if (hovered && originalColors.has(hovered)) {
        hovered.material.color.setHex(originalColors.get(hovered));
        hovered.material.emissive.setHex(0x000000);
      }
      hovered = resolvedMesh;
      if (hovered) {
        if (!originalColors.has(hovered)) originalColors.set(hovered, hovered.material.color.getHex());
        hovered.material.emissive.setHex(0x444444);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        renderer.domElement.style.cursor = 'default';
      }
      if (onHover) onHover(newItem || null);
    }
  });

  renderer.domElement.addEventListener('click', e => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const targets = getTargets();
    const hits = raycaster.intersectObjects(targets, true);
    if (hits.length > 0) {
      const clickedMesh = hits[0].object;
      const item = interactives.find(i => i.mesh === clickedMesh || i.mesh.getObjectById(clickedMesh.id));
      if (item && onClick) onClick(item);
    }
  });
}
