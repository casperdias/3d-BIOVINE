import * as THREE from 'three';
import { resolveCollision } from './collision.js';
import { state } from './state.js';

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
    this._walkCycle = 0;   // continuously advancing walk phase (radians)
    this._legAngle = 0;    // kept for back-compat (unused in new anim)
    this._armAngle = 0;

    this._bindKeys();
  }

  _bindKeys() {
    window.addEventListener('keydown', e => { this.keys[e.code] = true; });
    window.addEventListener('keyup',   e => { this.keys[e.code] = false; });
  }

  _build() {
    const skinMat  = new THREE.MeshStandardMaterial({ color: 0xf5cba7, roughness: 0.7, metalness: 0 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2980b9, roughness: 0.6, metalness: 0.05 });
    const pantMat  = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.65, metalness: 0.05 });
    const hairMat  = new THREE.MeshStandardMaterial({ color: 0x2c1a0e, roughness: 0.8, metalness: 0 });
    const shoeMat  = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.1 });
    const coatMat  = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7, metalness: 0 });

    // ── Torso (rounded box via CapsuleGeometry trick — use bevelled cylinder) ──
    // Body: use a CylinderGeometry with enough segments to look rounded
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.52, 1.6, 16),
      shirtMat
    );
    body.position.y = 2.2;
    body.castShadow = true;
    this.group.add(body);
    this._torso = body;   // for sway

    // Lab coat overlay (thin cylinder over body)
    const coat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.50, 0.54, 1.58, 16),
      coatMat
    );
    coat.position.y = 2.2;
    this.group.add(coat);
    this._coat = coat;

    // Shoulders (sphere caps on each side)
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 10),
        coatMat
      );
      shoulder.position.set(side * 0.62, 2.9, 0);
      this.group.add(shoulder);
    }

    // ── Head (sphere, much rounder than a box) ───────────
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 20, 16),
      skinMat
    );
    head.position.y = 3.62;
    head.scale.set(1, 1.05, 1);   // slightly tall
    head.castShadow = true;
    this.group.add(head);
    this._head = head;   // for bob

    // Hair cap (slightly larger half-sphere on top)
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.54, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    hair.position.y = 3.85;
    this.group.add(hair);

    // Ears
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), skinMat);
      ear.position.set(side * 0.53, 3.65, 0);
      this.group.add(ear);
    }

    // Eyes (small dark spheres)
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeMat);
      eye.position.set(side * 0.2, 3.72, 0.47);
      this.group.add(eye);
    }

    // Nose
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xd4a88a });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), noseMat);
    nose.position.set(0, 3.58, 0.52);
    this.group.add(nose);

    // ── Legs (capsule-like: cylinder + sphere feet) ───────
    // index 0 = left (side -1), index 1 = right (side +1)
    this._legs = [];
    for (const [i, side] of [[-1, -1], [1, 1]]) {
      const legPivot = new THREE.Group();
      legPivot.position.set(side * 0.3, 1.55, 0);

      // Upper leg
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.72, 12), pantMat);
      thigh.position.y = -0.36;
      thigh.castShadow = true;
      legPivot.add(thigh);

      // Lower leg pivot (knee bend)
      const kneePivot = new THREE.Group();
      kneePivot.position.y = -0.72;
      legPivot.add(kneePivot);

      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.64, 12), pantMat);
      shin.position.y = -0.32;
      shin.castShadow = true;
      kneePivot.add(shin);

      // Shoe (rounded capsule)
      const shoe = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.13, 0.3, 6, 10),
        shoeMat
      );
      shoe.rotation.x = Math.PI / 2;
      shoe.position.set(0, -0.68, 0.12);
      kneePivot.add(shoe);

      this.group.add(legPivot);
      this._legs.push({ pivot: legPivot, kneePivot, side, i: i === -1 ? 0 : 1 });
    }

    // ── Arms (capsule-like cylinders with elbow pivot) ───
    // index 0 = left (side -1), index 1 = right (side +1)
    this._arms = [];
    for (const [i, side] of [[-1, -1], [1, 1]]) {
      const armPivot = new THREE.Group();
      armPivot.position.set(side * 0.76, 2.92, 0);

      // Upper arm
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.62, 12), coatMat);
      upper.position.y = -0.31;
      upper.castShadow = true;
      armPivot.add(upper);

      // Elbow pivot
      const elbowPivot = new THREE.Group();
      elbowPivot.position.y = -0.62;
      armPivot.add(elbowPivot);

      // Lower arm
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.56, 12), skinMat);
      lower.position.y = -0.28;
      elbowPivot.add(lower);

      // Hand
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), skinMat);
      hand.position.y = -0.60;
      elbowPivot.add(hand);

      this.group.add(armPivot);
      this._arms.push({ pivot: armPivot, elbowPivot, side, i: i === -1 ? 0 : 1 });
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
      const HW = state.currentLevel === 2 ? 33 : state.currentLevel === 3 ? 27 : 28;
      const HD = state.currentLevel === 2 ? 23 : state.currentLevel === 3 ? 22 : 18;
      this.group.position.x = Math.max(-HW, Math.min(HW, this.group.position.x));
      this.group.position.z = Math.max(-HD, Math.min(HD, this.group.position.z));

      // Face the actual movement direction
      this.group.rotation.y = Math.atan2(dx, dz);

      // ── Walk cycle accumulator ─────────────────────────
      // Advance at a rate proportional to actual speed so faster movement = faster steps
      this._walkCycle += 0.18;
      const w = this._walkCycle;

      // ── Legs: opposite phase per side (index 0 vs 1) ──
      // Left leg (i=0) leads when sin(w) > 0; right (i=1) is exactly π out of phase
      for (const { pivot, kneePivot, i } of this._legs) {
        const phase = w + i * Math.PI;          // 0° and 180° — true counter-phase
        const swing = Math.sin(phase) * 0.55;   // hip swing (forward/back)
        pivot.rotation.x = swing;

        // Knee bends on the back-swing (trailing leg bends more)
        // clamp to only positive bend (knee never hyperextends forward)
        const kneeBend = Math.max(0, -Math.sin(phase) * 0.45);
        kneePivot.rotation.x = kneeBend;
      }

      // ── Arms: opposite phase to the OPPOSITE leg (cross-gait) ──
      // Left arm (i=0) swings with right leg (i=1 phase), and vice versa
      for (const { pivot, elbowPivot, side, i } of this._arms) {
        const oppPhase = w + (1 - i) * Math.PI;   // cross-body: arm leads opposite leg
        const armSwing = Math.sin(oppPhase) * 0.42;
        pivot.rotation.x = armSwing;

        // Slight outward splay on the swing-forward arm
        pivot.rotation.z = side * (0.08 + Math.sin(oppPhase + Math.PI * 0.5) * 0.06);

        // Elbow bends slightly on the back-swing (natural carry)
        elbowPivot.rotation.x = Math.max(0, Math.sin(oppPhase + 0.4) * 0.28);
      }

      // ── Torso counter-rotation (opposes leg swing for realism) ──
      if (this._torso) this._torso.rotation.y = Math.sin(w + Math.PI) * 0.08;
      if (this._coat)  this._coat.rotation.y  = Math.sin(w + Math.PI) * 0.08;

      // ── Head bob (up-down twice per full step cycle) ──
      if (this._head) {
        this._head.position.y = 3.62 + Math.abs(Math.sin(w * 2)) * 0.06;
      }

      // ── Whole-body vertical bounce (feet leave ground feel) ──
      this.group.position.y = Math.abs(Math.sin(w * 2)) * 0.055;
    } else {
      // ── Idle: smoothly return everything to rest ──────
      this._walkCycle = 0;   // reset so next walk starts cleanly

      for (const { pivot, kneePivot } of this._legs) {
        pivot.rotation.x *= 0.75;
        kneePivot.rotation.x *= 0.75;
      }
      for (const { pivot, elbowPivot, side } of this._arms) {
        pivot.rotation.x *= 0.75;
        pivot.rotation.z += (side * 0.08 - pivot.rotation.z) * 0.15;  // return to natural splay
        elbowPivot.rotation.x *= 0.75;
      }
      if (this._torso) this._torso.rotation.y *= 0.8;
      if (this._coat)  this._coat.rotation.y  *= 0.8;

      // Gentle idle bob (breathe)
      if (this._head) this._head.position.y = 3.62 + Math.sin(t * 1.2) * 0.02;
      this.group.position.y = Math.sin(t * 1.4) * 0.04;
    }

    return { x: this.group.position.x, z: this.group.position.z };
  }

  get position() {
    return this.group.position;
  }

  // Scene transition helpers
  removeFromScene(scene) {
    scene.remove(this.group);
  }

  addToScene(scene) {
    this.scene = scene;
    scene.add(this.group);
  }
}
