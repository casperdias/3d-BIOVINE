import * as THREE from 'three';
import { resolveCollision } from './collision.js';

export class PlayerCharacter {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this._build();
    scene.add(this.group);
    this.group.position.set(0, 0, 12);   // start in front aisle, clear of all benches

    // Movement state
    this.speed = 0.12;
    this.keys = {};
    this._moving = false;
    this._legAngle = 0;
    this._armAngle = 0;

    this._bindKeys();
  }

  _bindKeys() {
    window.addEventListener('keydown', e => { this.keys[e.code] = true; });
    window.addEventListener('keyup',   e => { this.keys[e.code] = false; });
  }

  _build() {
    const skinMat  = new THREE.MeshLambertMaterial({ color: 0xf5cba7 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0x2980b9 });
    const pantMat  = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const hairMat  = new THREE.MeshLambertMaterial({ color: 0x2c1a0e });
    const shoeMat  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.7), shirtMat);
    body.position.y = 2.2;
    body.castShadow = true;
    this.group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), skinMat);
    head.position.y = 3.5;
    head.castShadow = true;
    this.group.add(head);

    // Hair
    const hair = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.4, 1.05), hairMat);
    hair.position.y = 4.0;
    this.group.add(hair);

    // Legs
    this._legs = [];
    for (const side of [-1, 1]) {
      const legPivot = new THREE.Group();
      legPivot.position.set(side * 0.33, 1.6, 0);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.2, 0.45), pantMat);
      leg.position.y = -0.6;
      leg.castShadow = true;
      legPivot.add(leg);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.6), shoeMat);
      shoe.position.set(0, -1.25, 0.08);
      legPivot.add(shoe);
      this.group.add(legPivot);
      this._legs.push({ pivot: legPivot, side });
    }

    // Arms
    this._arms = [];
    for (const side of [-1, 1]) {
      const armPivot = new THREE.Group();
      armPivot.position.set(side * 0.85, 3.0, 0);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.35), shirtMat);
      arm.position.y = -0.6;
      arm.castShadow = true;
      armPivot.add(arm);
      this.group.add(armPivot);
      this._arms.push({ pivot: armPivot, side });
    }

    // Name label (sprite)
    this._nameLabel = null;
  }

  setName(name) {
    if (this._nameLabel) {
      this.group.remove(this._nameLabel);
    }
    if (!name) return;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = 'rgba(15,25,40,0.8)';
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.fill();
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 26px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 128, 32);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3.5, 0.9, 1);
    sprite.position.y = 5.2;
    this._nameLabel = sprite;
    this.group.add(sprite);
  }

  // Called every frame. cameraAxes = { fwd, right } from camera perspective.
  update(t, blocked = false, cameraAxes = null) {
    const k = this.keys;
    let forward = 0, strafe = 0;

    if (k['KeyW'] || k['ArrowUp'])    forward += 1;
    if (k['KeyS'] || k['ArrowDown'])  forward -= 1;
    if (k['KeyA'] || k['ArrowLeft'])  strafe  -= 1;
    if (k['KeyD'] || k['ArrowRight']) strafe  += 1;

    this._moving = (forward !== 0 || strafe !== 0);

    if (this._moving && !blocked) {
      let dx = 0, dz = 0;

      if (cameraAxes) {
        // Move relative to where the camera is looking
        dx = cameraAxes.fwd.x * forward + cameraAxes.right.x * strafe;
        dz = cameraAxes.fwd.z * forward + cameraAxes.right.z * strafe;
      } else {
        dx = strafe;
        dz = -forward;
      }

      // Normalise diagonal
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      dx = (dx / len) * this.speed;
      dz = (dz / len) * this.speed;

      // Resolve collisions (AABB obstacles + walls)
      ({ dx, dz } = resolveCollision(this.group.position, dx, dz));

      this.group.position.x += dx;
      this.group.position.z += dz;

      // Hard clamp to room bounds as a final safety net
      const HW = 28, HD = 18;
      this.group.position.x = Math.max(-HW, Math.min(HW, this.group.position.x));
      this.group.position.z = Math.max(-HD, Math.min(HD, this.group.position.z));

      // Face the actual movement direction
      this.group.rotation.y = Math.atan2(dx, dz);

      // Walk animation
      this._legAngle += 0.2;
      for (const { pivot, side } of this._legs) {
        pivot.rotation.x = Math.sin(this._legAngle + side * Math.PI) * 0.5;
      }
      for (const { pivot, side } of this._arms) {
        pivot.rotation.x = Math.sin(this._legAngle + side * Math.PI + Math.PI) * 0.4;
      }
    } else {
      // Idle: return to rest
      for (const { pivot } of this._legs) {
        pivot.rotation.x *= 0.8;
      }
      for (const { pivot } of this._arms) {
        pivot.rotation.x *= 0.8;
      }
      // Gentle idle bob
      this.group.position.y = Math.sin(t * 1.6) * 0.05;
    }

    return { x: this.group.position.x, z: this.group.position.z };
  }

  get position() {
    return this.group.position;
  }
}
