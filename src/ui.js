import * as THREE from 'three';
import { state, resetLevelState, recordLevelPoints } from './state.js';
import { stage1 } from './stages/stage1.js';
import { stage2 } from './stages/stage2.js';
import { loadCheckpoint, clearCheckpoint, saveScore } from './db.js';

// ─────────────────────────────────────────────────────
// DOM helpers
// ─────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

let onProfileDone   = null;
let onProfileResume = null;  // set when a checkpoint is found

// ─────────────────────────────────────────────────────
// Profile Screen
// ─────────────────────────────────────────────────────
/**
 * cb(name)      – called when player starts a NEW game
 * resumeCb(cp)  – called when player chooses to RESUME a saved checkpoint
 */
export function showProfileScreen(cb, resumeCb) {
  onProfileDone   = cb;
  onProfileResume = resumeCb || null;

  const checkpoint = loadCheckpoint();

  // Populate (or hide) the checkpoint banner
  const resumeSection = $('resume-section');
  if (checkpoint && resumeSection && onProfileResume) {
    const d = new Date(checkpoint.savedAt);
    const fmt = d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
              + ' ' + d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
    resumeSection.classList.remove('hidden');
    resumeSection.innerHTML = `
      <div class="resume-card">
        <div class="resume-info">
          <span class="resume-avatar">🎮</span>
          <div>
            <strong>${checkpoint.playerName}</strong>
            <div style="font-size:12px;color:#aaa;margin-top:2px">
              Level ${checkpoint.currentLevel} &nbsp;·&nbsp; ${checkpoint.totalPoints} poin &nbsp;·&nbsp; ${fmt}
            </div>
          </div>
        </div>
        <button class="btn-resume" id="btn-resume-game">▶ Lanjutkan</button>
        <button class="btn-new-checkpoint" id="btn-discard-checkpoint" title="Mulai baru">✕</button>
      </div>
    `;
    document.getElementById('btn-resume-game').onclick = () => {
      hideProfileScreen();
      onProfileResume(checkpoint);
    };
    document.getElementById('btn-discard-checkpoint').onclick = () => {
      clearCheckpoint();
      resumeSection.classList.add('hidden');
    };
  } else if (resumeSection) {
    resumeSection.classList.add('hidden');
  }

  $('profile-screen').classList.remove('hidden');
}

function hideProfileScreen() {
  $('profile-screen').classList.add('hidden');
}

// ─────────────────────────────────────────────────────
// Synopsis Screen (shown before intro video)
// ─────────────────────────────────────────────────────
export function showSynopsis(cb) {
  const screen = $('synopsis-screen');
  screen.classList.remove('hidden');

  const SEGMENTS = [
    {
      tag:    'Bagian 1 dari 3',
      title:  'Industri Etanol di Desa Bekonang',
      bubble: 'Halo! Yuk, kenali industri yang melahirkan masalah lingkungan ini.',
      text:   `Industri etanol di Desa Bekonang, Sukoharjo, adalah warisan <strong>turun-temurun</strong> yang sudah ada sejak zaman kolonial. Banyak pabrik di sini memproduksi minuman keras tradisional bernama <strong>ciu</strong> — dibuat dari tetes tebu, tape singkong, atau nira aren melalui proses fermentasi dan penyulingan.<br><br>Seiring waktu, industri ini berkembang menjadi produksi <strong>etanol medis</strong> yang digunakan untuk kebutuhan rumah sakit dan dunia kesehatan.`,
    },
    {
      tag:    'Bagian 2 dari 3',
      title:  'Masalah: Limbah Vinasse',
      bubble: 'Ini masalah serius yang mencemari lingkungan sekitar!',
      text:   `Proses produksi etanol menghasilkan limbah cair bernama <strong>vinasse</strong>. Setiap harinya, satu pabrik bisa menghasilkan <strong>150–200 liter</strong> limbah ini — tanpa sistem pengolahan yang memadai.<br><br>Vinasse berwarna <strong>hitam pekat</strong>, berbau menyengat, dan sangat berbahaya jika dibuang langsung ke sungai. Vinasse <strong>menyerap oksigen</strong> di dalam air, menyebabkan ikan-ikan mati dan sungai tercemar parah.`,
    },
    {
      tag:    'Bagian 3 dari 3',
      title:  'Solusi: Vinasse → Pupuk Organik Cair',
      bubble: 'Kita bisa mengubah limbah menjadi sesuatu yang bermanfaat!',
      text:   `Kabar baiknya, limbah vinasse bisa diolah menjadi <strong>Pupuk Organik Cair (POC)</strong>! Caranya dengan menambahkan <strong>mikroorganisme berupa ragi</strong> ke dalam vinasse yang sudah diaerasi minimal 24 jam.<br><br>Setelah ditumbuhkan selama <strong>15 hari</strong> dalam bak terbuka beraeasi, limbah berubah menjadi pupuk: tidak berbau asam, berwarna coklat muda. Diaplikasikan ke tanaman dengan perbandingan <strong>1 : 10</strong> (POC : air). Ukur kadar COD, BOD, dan pH untuk memastikan kualitasnya!`,
    },
  ];

  let current = 0;
  let mouthOpen = false;
  let mouthTimer = null;

  const tagEl     = $('syn-seg-tag');
  const titleEl   = $('syn-seg-title');
  const textEl    = $('syn-seg-text');
  const dotsEl    = $('syn-dots');
  const prevBtn   = $('btn-syn-prev');
  const nextBtn   = $('btn-syn-next');
  const skipBtn   = $('btn-syn-skip');
  const bubbleEl  = $('syn-bubble');
  const panel     = $('synopsis-content-panel');
  const mouthPath = $('syn-mouth');

  // Animate mouth open/close while "talking"
  function startMouthAnim() {
    stopMouthAnim();
    mouthTimer = setInterval(() => {
      mouthOpen = !mouthOpen;
      if (mouthPath) {
        mouthPath.setAttribute('d',
          mouthOpen
            ? 'M84 124 Q100 144 116 124'   // open
            : 'M84 126 Q100 138 116 126'   // closed / smile
        );
      }
    }, 280);
  }

  function stopMouthAnim() {
    if (mouthTimer) { clearInterval(mouthTimer); mouthTimer = null; }
    if (mouthPath)  { mouthPath.setAttribute('d', 'M84 126 Q100 138 116 126'); }
  }

  function dismiss() {
    stopMouthAnim();
    screen.classList.add('hidden');
    cb();
  }

  function render(idx) {
    const seg = SEGMENTS[idx];

    // Slide animation: remove → force reflow → add
    panel.classList.remove('synopsis-slide');
    void panel.offsetWidth;
    panel.classList.add('synopsis-slide');

    tagEl.textContent    = seg.tag;
    titleEl.textContent  = seg.title;
    textEl.innerHTML     = seg.text;
    bubbleEl.textContent = seg.bubble;

    // Dots
    dotsEl.innerHTML = SEGMENTS.map((_, k) =>
      `<span class="synopsis-dot ${k === idx ? 'active' : ''}"></span>`
    ).join('');

    // Navigation buttons
    prevBtn.style.display = idx === 0 ? 'none' : '';
    nextBtn.textContent   = idx === SEGMENTS.length - 1
      ? '🚀 Mulai Petualangan →'
      : 'Lanjutkan →';

    startMouthAnim();
  }

  render(0);

  prevBtn.onclick = () => { if (current > 0) render(--current); };
  nextBtn.onclick = () => {
    if (current < SEGMENTS.length - 1) {
      render(++current);
    } else {
      dismiss();
    }
  };
  skipBtn.onclick = () => dismiss();
}

// ─────────────────────────────────────────────────────
// YouTube Videos Screen (shown after synopsis, before 3D IPAL sim)
// ─────────────────────────────────────────────────────
const YT_VIDEOS = [
  {
    id: 'c4gsn1rkK1g',
    title: 'Video Edukasi 1: Limbah Vinasse & Dampak Lingkungan',
    subtitle: 'Pelajari dampak pencemaran vinasse terhadap lingkungan sekitar',
  },
  {
    id: 'ajNZ7FcnZvU',
    title: 'Video Edukasi 2: Teknologi Bioremediasi Azolla',
    subtitle: 'Kenali solusi bioremediasi berbasis tanaman Azolla',
  },
];

// YouTube IFrame API loader — resolves once the API script is ready
let _ytApiReady = false;
const _ytApiQueue = [];
window.onYouTubeIframeAPIReady = () => {
  _ytApiReady = true;
  _ytApiQueue.splice(0).forEach(fn => fn());
};
function _loadYTApi() {
  return new Promise(resolve => {
    if (_ytApiReady) { resolve(); return; }
    _ytApiQueue.push(resolve);
    if (!document.getElementById('yt-api-script')) {
      const s = document.createElement('script');
      s.id  = 'yt-api-script';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  });
}

export function showYoutubeVideos(cb) {
  const screen = $('youtube-screen');
  screen.classList.remove('hidden');

  // Pause background music while YouTube videos play
  if (_bgAudio) _bgAudio.pause();

  let idx = 0;
  let ytPlayer = null;

  function resetContainer() {
    const wrap = screen.querySelector('.youtube-frame-wrap');
    wrap.innerHTML = '<div id="yt-player-container"><div class="yt-loading">Memuat video…</div></div>';
  }

  function showVideo(i) {
    const v = YT_VIDEOS[i];
    $('yt-title').textContent    = v.title;
    $('yt-subtitle').textContent = v.subtitle;
    $('yt-counter').textContent  = `${i + 1} / ${YT_VIDEOS.length}`;

    const btn = $('btn-yt-next');
    btn.textContent = i < YT_VIDEOS.length - 1 ? 'Video Berikutnya →' : 'Lanjutkan ke Simulasi →';
    btn.disabled = true;
    btn.title    = 'Tonton video hingga selesai untuk melanjutkan';

    // Destroy previous player and reset the container div
    if (ytPlayer) { ytPlayer.destroy(); ytPlayer = null; }
    resetContainer();

    _loadYTApi().then(() => {
      ytPlayer = new YT.Player('yt-player-container', {
        videoId: v.id,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: e => {
            if (e.data === YT.PlayerState.ENDED) {
              btn.disabled = false;
              btn.title    = '';
            }
          },
        },
      });
    });
  }

  showVideo(0);

  $('btn-yt-next').onclick = () => {
    idx += 1;
    if (idx < YT_VIDEOS.length) {
      showVideo(idx);
    } else {
      if (ytPlayer) { ytPlayer.destroy(); ytPlayer = null; }
      screen.classList.add('hidden');
      // Resume background music
      if (_bgAudio) _bgAudio.play().catch(() => {});
      cb();
    }
  };
}

// ─────────────────────────────────────────────────────
// Intro Video Screen (shown once after profile is created)
// ─────────────────────────────────────────────────────
let _introAssetRenderer = null;  // keep ref so we can dispose it

// ─────────────────────────────────────────────────────
// Global background music (persists for the whole session)
// ─────────────────────────────────────────────────────
let _bgAudio = null;
export function startBgMusic() {
  if (_bgAudio) return;          // already playing
  _bgAudio = new Audio('/intro-music.mp3');
  _bgAudio.loop   = true;
  _bgAudio.volume = 0.45;
  _bgAudio.play().catch(() => {}); // silently handle autoplay block
}

export function showIntroVideo(cb) {
  const screen = $('intro-video-screen');
  screen.classList.remove('hidden');

  // ── Canvas / Renderer ──────────────────────────────────────────────
  const canvas = $('intro-3d-canvas');
  const W = window.innerWidth;
  const H = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // false = don't set canvas CSS style (let CSS width:100%/height:100% handle it)
  renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  _introAssetRenderer = renderer;

  // ── Scene / Camera ─────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0xb8d8f0, 90, 210);

  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 300);
  camera.position.set(0, 65, 75);
  camera.lookAt(0, 0, 0);

  // ── Lights ─────────────────────────────────────────────────────────
  scene.add(new THREE.HemisphereLight(0x9ed4f8, 0x5a7a40, 1.2));
  const sun = new THREE.DirectionalLight(0xfff7e0, 2.8);
  sun.position.set(40, 80, 50);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -90;
  sun.shadow.camera.right = sun.shadow.camera.top    =  90;
  sun.shadow.camera.far  = 220;
  scene.add(sun);
  const fillLight = new THREE.DirectionalLight(0xb0d0ff, 0.45);
  fillLight.position.set(-30, 25, -20);
  scene.add(fillLight);
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(190, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0x6aaee0, side: THREE.BackSide })
  ));

  // ── Small helpers ──────────────────────────────────────────────────
  function smat(col, rough = 0.78, metal = 0, em, emI) {
    const p = { color: col, roughness: rough, metalness: metal };
    if (em !== undefined) { p.emissive = em; p.emissiveIntensity = emI || 0.2; }
    return new THREE.MeshStandardMaterial(p);
  }
  function box(x, y, z, w, h, d, m) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y + h * 0.5, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh); return mesh;
  }
  function cyl(x, y, z, rt, rb, h, seg, m) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
    mesh.position.set(x, y + h * 0.5, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh); return mesh;
  }
  function water(x, z, w, d, col, op = 0.84) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({
        color: col, transparent: true, opacity: op, roughness: 0.04, metalness: 0.18,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.22, z);
    scene.add(mesh); return mesh;
  }
  function pipe(ax, ay, az, bx, by, bz, col = 0x556677, r = 0.24) {
    const a = new THREE.Vector3(ax, ay, az);
    const b = new THREE.Vector3(bx, by, bz);
    const d = b.clone().sub(a), len = d.length();
    if (len < 0.05) return;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), smat(col, 0.45, 0.65));
    m.position.copy(a.clone().add(b).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    scene.add(m);
  }

  // ====================================================================
  // GROUND
  // ====================================================================
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), smat(0x7a9458, 0.95));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  // Paved compound
  box(6, -0.05, 1, 82, 0.1, 68, smat(0xb2a990, 0.88));

  // ====================================================================
  // CHANNEL ARRAY  (7 parallel east-west channels, serpentine flow)
  // Each channel: length 26 (X: -13..+13), width 5 (Z), walls 1.4 tall
  // Spaced 7 units apart in Z.  Centers at Z: -21,-14,-7,0,7,14,21
  // Serpentine: ch0 W→E, ch1 E→W … ch6 W→E (exits east → clarifier)
  // ====================================================================
  const N_CH    = 7;
  const CH_HALF = 13;   // half-length in X
  const CH_W    = 5;    // width in Z
  const CH_STEP = 7;    // row spacing
  const WALL_H  = 1.4;
  const WALL_T  = 0.36;

  const chZ = i => -21 + i * CH_STEP;  // Z centre of channel i

  const waterCols = [
    0x7a3310,  // ch0 raw (dark brown)
    0x6a4a16,  // ch1 screened
    0x4a5a28,  // ch2 equalized
    0x2d6e48,  // ch3 start aeration (dark green)
    0x20787a,  // ch4 active aeration (teal)
    0x188a9a,  // ch5 secondary settled (blue-teal)
    0x0ea8cc,  // ch6 treated (clear blue)
  ];

  const channelWaterMeshes = [];  // { mesh, baseOp }
  const aeratorMeshes = [];

  for (let i = 0; i < N_CH; i++) {
    const cz  = chZ(i);
    const col = waterCols[i];
    const wm  = smat(0x7a8070, 0.78);

    // North wall
    box(0, 0, cz - CH_W / 2,              CH_HALF * 2 + WALL_T * 2, WALL_H, WALL_T, wm);
    // South wall
    box(0, 0, cz + CH_W / 2,              CH_HALF * 2 + WALL_T * 2, WALL_H, WALL_T, wm);
    // West end wall
    box(-CH_HALF, 0, cz,                  WALL_T, WALL_H, CH_W,              wm);
    // East end wall
    box( CH_HALF, 0, cz,                  WALL_T, WALL_H, CH_W,              wm);
    // Floor (concrete)
    box(0, -0.25, cz, CH_HALF * 2, 0.28, CH_W,            smat(0xa09880, 0.88));

    // Water surface
    const baseOp = 0.76 + i * 0.015;
    const wMesh = water(0, cz, CH_HALF * 2 - 0.1, CH_W - 0.12, col, baseOp);
    channelWaterMeshes.push({ mesh: wMesh, baseOp });

    // Aerators in biological channels (ch3 and ch4)
    if (i === 3 || i === 4) {
      for (let k = -1; k <= 1; k++) {
        const ae = cyl(k * 7, 0.25, cz, 0.75, 0.75, 0.28, 12,
                       smat(0xaabbcc, 0.4, 0.55, 0x3399cc, 0.3));
        aeratorMeshes.push(ae);
        box(k * 7, 0.28, cz, 0.14, 1.0, 0.14, smat(0x888999, 0.5, 0.5));
      }
    }
  }

  // Walkways between rows and perimeter paths
  const walkMat = smat(0xc2b8a2, 0.88);
  for (let i = 0; i <= N_CH; i++) {
    const wz = -21 - CH_STEP / 2 + i * CH_STEP;
    box(6, 0, wz, 82, 0.12, 2.0, walkMat);
  }
  box(-20, 0,  1, 2.2, 0.12, 70, walkMat); // west side path
  box( 32, 0,  1, 2.2, 0.12, 70, walkMat); // east side path

  // U-turn junction boxes at alternating channel ends
  // ch0→ch1: east end (+13)   ch1→ch2: west end (-13) … etc.
  for (let i = 0; i < N_CH - 1; i++) {
    const ex  = (i % 2 === 0) ? CH_HALF + 0.5 : -(CH_HALF + 0.5);
    const z1  = chZ(i), z2 = chZ(i + 1);
    box(ex, 0, (z1 + z2) * 0.5, 2.2, WALL_H, Math.abs(z2 - z1) + 0.5,
        smat(0x6a7888, 0.65, 0.3));
  }

  // ====================================================================
  // INTAKE / SCREENING BUILDING  (top-left, matches photo)
  // ====================================================================
  box(-28, 0, -30, 12, 5.5, 8,  smat(0x5a6878, 0.62, 0.1));
  box(-28, 5.5, -30, 12.5, 0.55, 8.5, smat(0x3a4858, 0.5));
  // Bar screen slots
  for (let s = -1.5; s <= 1.5; s += 0.65) {
    box(-22.8, 0, -30 + s, 0.1, 2.4, 0.1, smat(0x334455, 0.4, 0.7));
  }
  // Windows
  box(-27, 2.0, -33.7, 1.8, 1.2, 0.08, smat(0x88ddff, 0.08, 0.0, 0x003355, 0.9));
  box(-29.5, 2.0, -33.7, 1.8, 1.2, 0.08, smat(0x88ddff, 0.08, 0.0, 0x003355, 0.9));

  // Distillation column (penyulingan) — tall thin vessel + band rings
  const DISTIL_X = -34, DISTIL_Z = -30;
  cyl(DISTIL_X,      0, DISTIL_Z, 1.10, 0.90, 14.0, 16, smat(0x8899aa, 0.38, 0.55));
  cyl(DISTIL_X, 14.0, DISTIL_Z, 1.20, 1.20,  0.30, 16, smat(0xaabbcc, 0.35, 0.5));  // cap
  // Horizontal band rings along the column for a real distillation-tower look
  [2.0, 4.5, 7.5, 10.5, 13.0].forEach(hy => {
    cyl(DISTIL_X, hy, DISTIL_Z, 1.18, 1.18, 0.18, 16, smat(0x99aabb, 0.42, 0.6));
  });
  // Connecting pipe from column base → intake building
  pipe(DISTIL_X + 1.1, 1.2, DISTIL_Z, -22, 1.2, -30, 0x445566, 0.28);
  // Small condenser box at mid-height
  box(DISTIL_X - 2.2, 6, DISTIL_Z, 2.8, 1.4, 1.4, smat(0x6a7888, 0.55, 0.3));
  pipe(DISTIL_X - 1.1, 6.5, DISTIL_Z, DISTIL_X - 1.8, 6.5, DISTIL_Z, 0x556677, 0.22);

  // ====================================================================
  // EQUALIZATION TANK  (left middle, between intake and first channel)
  // ====================================================================
  const EQ_X = -24, EQ_Z = -14;
  const EQ_W = 12, EQ_D = 9;
  box(EQ_X, 0, EQ_Z, EQ_W, 1.5, EQ_D, smat(0x6e7e70, 0.75));
  box(EQ_X, 0, EQ_Z, EQ_W - WALL_T * 2, 0.24, EQ_D - WALL_T * 2, smat(0x9a9088, 0.88));
  const equalizationWater = water(EQ_X, EQ_Z, EQ_W - 0.8, EQ_D - 0.8, 0x5a7040, 0.82);
  // Pipes: intake → EQ → channel-0 west
  pipe(-22, 0.9, -28, -22, 0.9, -14, 0x445566, 0.3);
  pipe(-18.2, 0.9, -14, -13.2, 0.9, -21, 0x445566, 0.3);

  // ====================================================================
  // PUMP STATION  (left side, below EQ)
  // ====================================================================
  box(-28, 0, 8, 8, 4.5, 6.5, smat(0x6a7070, 0.65, 0.1));
  box(-28, 4.5, 8, 8.5, 0.42, 7.0, smat(0x3a4050, 0.5));
  // Chimney
  cyl(-25.5, 4.9, 6, 0.34, 0.34, 4.5, 10, smat(0x888898, 0.5, 0.3));
  // Inlet manifold pipes along west side
  for (let k = 0; k < 3; k++) {
    pipe(-18.5, 0.8, -21 + k * 14, -21, 0.8, -21 + k * 14, 0x445566, 0.2);
  }

  // ====================================================================
  // SLUDGE DRYING BEDS  (bottom-left, matching dark rectangular pads)
  // ====================================================================
  [-14, -6, 2].forEach(dx => {
    box(-32 + dx * 0.3, 0, 32, 6, 0.42, 9.5, smat(0xa09060, 0.93));
  });

  // ====================================================================
  // CIRCULAR SECONDARY CLARIFIER  (right side, mirrors the photo)
  // ====================================================================
  const CL_X = 30, CL_Z = 18, CL_R = 10;
  // Outer ring wall
  cyl(CL_X, 0, CL_Z, CL_R + 0.55, CL_R + 0.55, 1.6, 48, smat(0x7a8878, 0.70));
  // Make the outer visible as a ring by slightly shorter inner
  cyl(CL_X, 0, CL_Z, CL_R,        CL_R,        1.6, 48, smat(0x7a8878, 0.70));
  // Floor
  cyl(CL_X, -0.25, CL_Z, CL_R, CL_R, 0.28, 48, smat(0x9a8870, 0.88));
  // Water
  const clarifier = new THREE.Mesh(
    new THREE.CircleGeometry(CL_R - 0.08, 48),
    new THREE.MeshStandardMaterial({
      color: 0x2ea8b8, transparent: true, opacity: 0.86, roughness: 0.04, metalness: 0.2,
    })
  );
  clarifier.rotation.x = -Math.PI / 2;
  clarifier.position.set(CL_X, 0.22, CL_Z);
  scene.add(clarifier);
  // Centre column + rotating bridge
  cyl(CL_X, 1.6, CL_Z, 0.58, 0.58, 3.8, 10, smat(0x5a6a77, 0.5, 0.5));
  box(CL_X, 1.6, CL_Z, CL_R * 2 - 0.3, 0.22, 0.38, smat(0x8899aa, 0.45, 0.4));
  // Inverted sludge cone
  const sludgeConeM = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2.8, 32), smat(0x5a3310, 0.85));
  sludgeConeM.rotation.x = Math.PI;
  sludgeConeM.position.set(CL_X, 0.9, CL_Z);
  scene.add(sludgeConeM);
  // Feed pipe: ch6 east end → clarifier
  pipe(CH_HALF + 0.4, 0.9, chZ(6), CL_X - CL_R - 0.6, 0.9, CL_Z, 0x446688, 0.3);

  // ====================================================================
  // TERTIARY FILTER BEDS + UV DISINFECTION  (far right)
  // ====================================================================
  [[44, -10], [52, -10]].forEach(([tx, tz]) => {
    box(tx, 0, tz, 6.5, 1.1, 10,  smat(0x788898, 0.70));
    water(tx, tz, 6.0, 9.5, 0x66aacc, 0.82);
  });
  // UV column
  cyl(58, 0, -5, 0.95, 0.95, 3.4, 14, smat(0xddeeff, 0.32, 0.28, 0x8844ff, 0.40));
  pipe(CL_X + CL_R + 0.5, 0.9, CL_Z, 44, 0.9, -10, 0x446688, 0.28);
  pipe(48, 0.9, -10, 52, 0.9, -10, 0x446688, 0.25);
  pipe(55.5, 0.9, -10, 58, 0.9, -5,  0x446688, 0.25);

  // ====================================================================
  // SPARING MONITORING POLE + RIVER DISCHARGE
  // ====================================================================
  box(58, 0, 16, 0.36, 9, 0.36, smat(0x999aaa, 0.40, 0.60));
  box(58, 9, 16, 1.6, 0.9, 1.0, smat(0xcc2222, 0.50, 0.30, 0xff0000, 0.55));
  const sparingLED = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 2.5 })
  );
  sparingLED.position.set(58, 10.2, 16);
  scene.add(sparingLED);
  // TX data spheres
  const txSpheres = [];
  for (let i = 0; i < 4; i++) {
    const ts = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 6, 6),
      new THREE.MeshStandardMaterial({
        color: 0x22ffbb, emissive: 0x00cc88, emissiveIntensity: 1.8,
        transparent: true, opacity: 0.9,
      })
    );
    ts.userData.i = i;
    scene.add(ts);
    txSpheres.push(ts);
  }
  // River (discharge canal)
  const river = water(72, 8, 18, 60, 0x2288bb, 0.78);
  pipe(58, 0.9, -5, 66, 0.9, 0, 0x446688, 0.3);

  // ====================================================================
  // TREES   (dense perimeter matching aerial photo)
  // ====================================================================
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b3a0a, roughness: 0.95 });
  const foliageMats = [
    smat(0x2d7d3a, 0.9), smat(0x3a8f44, 0.88), smat(0x4a9940, 0.85),
    smat(0x22883a, 0.92), smat(0x538830, 0.87), smat(0x1e6622, 0.93),
  ];
  const treePos = [];
  for (let tx = -58; tx <= 78; tx += 6.5) { treePos.push([tx, -42]); treePos.push([tx, 44]); }
  for (let tz = -40; tz <= 42; tz += 6.5) { treePos.push([-58, tz]); treePos.push([78, tz]); }
  [[-44,-22],[-46,-8],[-44,18],[-44,30],
   [56,-28],[58,-12],[56,10],[56,30],
   [-36,38],[-18,40],[2,40],[20,40],[38,40],
   [-36,-36],[-18,-38],[2,-38],[22,-38],[42,-36],[52,-36],
  ].forEach(p => treePos.push(p));

  treePos.forEach(([tx, tz]) => {
    const s  = 0.85 + Math.random() * 0.75;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18*s, 0.30*s, 2.2*s, 7), trunkMat);
    tr.position.set(tx, 1.1*s, tz); tr.castShadow = true; scene.add(tr);
    const fm = foliageMats[Math.floor(Math.random() * foliageMats.length)];
    if (Math.random() > 0.42) {
      const fo = new THREE.Mesh(new THREE.SphereGeometry(1.5*s, 8, 7), fm);
      fo.position.set(tx, 3.8*s, tz); fo.castShadow = true; scene.add(fo);
    } else {
      for (let tier = 0; tier < 3; tier++) {
        const co = new THREE.Mesh(new THREE.ConeGeometry((1.3-tier*0.28)*s, 1.3*s, 8), fm);
        co.position.set(tx, (2.5+tier*1.2)*s, tz); co.castShadow = true; scene.add(co);
      }
    }
  });

  // ====================================================================
  // SERPENTINE FLOW PATH
  // Intake → EQ → ch0(W→E) → ch1(E→W) → … → ch6(W→E) → clarifier → filter → river
  // ====================================================================
  const flowPath = new THREE.CatmullRomCurve3([
    // Intake building → EQ
    new THREE.Vector3(-23,  0.7, -30),
    new THREE.Vector3(-23,  0.7, -21),
    new THREE.Vector3(EQ_X, 0.7, EQ_Z),
    // EQ → channel 0 (west end, flows →E)
    new THREE.Vector3(-13,  0.7, -21),
    new THREE.Vector3(  0,  0.7, -21),
    new THREE.Vector3( 13,  0.7, -21),
    // Junction east: ch0 → ch1 (east end, z=-21 to z=-14)
    new THREE.Vector3( 14,  0.7, -17.5),
    new THREE.Vector3( 13,  0.7, -14),
    // Channel 1 (E→W)
    new THREE.Vector3(  0,  0.7, -14),
    new THREE.Vector3(-13,  0.7, -14),
    // Junction west: ch1 → ch2 (z=-14 to z=-7)
    new THREE.Vector3(-14,  0.7, -10.5),
    new THREE.Vector3(-13,  0.7,  -7),
    // Channel 2 (W→E)
    new THREE.Vector3(  0,  0.7,  -7),
    new THREE.Vector3( 13,  0.7,  -7),
    // Junction east: ch2 → ch3 (z=-7 to z=0)
    new THREE.Vector3( 14,  0.7,  -3.5),
    new THREE.Vector3( 13,  0.7,   0),
    // Channel 3 (E→W)
    new THREE.Vector3(  0,  0.7,   0),
    new THREE.Vector3(-13,  0.7,   0),
    // Junction west: ch3 → ch4 (z=0 to z=7)
    new THREE.Vector3(-14,  0.7,   3.5),
    new THREE.Vector3(-13,  0.7,   7),
    // Channel 4 (W→E)
    new THREE.Vector3(  0,  0.7,   7),
    new THREE.Vector3( 13,  0.7,   7),
    // Junction east: ch4 → ch5 (z=7 to z=14)
    new THREE.Vector3( 14,  0.7,  10.5),
    new THREE.Vector3( 13,  0.7,  14),
    // Channel 5 (E→W)
    new THREE.Vector3(  0,  0.7,  14),
    new THREE.Vector3(-13,  0.7,  14),
    // Junction west: ch5 → ch6 (z=14 to z=21)
    new THREE.Vector3(-14,  0.7,  17.5),
    new THREE.Vector3(-13,  0.7,  21),
    // Channel 6 (W→E)
    new THREE.Vector3(  0,  0.7,  21),
    new THREE.Vector3( 13,  0.7,  21),
    // ch6 → Clarifier
    new THREE.Vector3( 22,  0.7,  21),
    new THREE.Vector3( CL_X, 0.7, CL_Z),
    // Clarifier → filter → UV → river
    new THREE.Vector3( 44,  0.7, -10),
    new THREE.Vector3( 58,  0.7,  -5),
    new THREE.Vector3( 66,  0.7,   0),
  ]);

  // ── Color lerp (brown → clear blue) ─────────────────────────────
  function lerpHex(c1, c2, t) {
    const r1=(c1>>16)&255, g1=(c1>>8)&255, b1=c1&255;
    const r2=(c2>>16)&255, g2=(c2>>8)&255, b2=c2&255;
    return (Math.round(r1+(r2-r1)*t)<<16)|(Math.round(g1+(g2-g1)*t)<<8)|Math.round(b1+(b2-b1)*t);
  }

  // ====================================================================
  // PARTICLES
  // ====================================================================
  // Flow ripples & foam — expanding rings + foam discs on open-channel water surface
  // 2/3 are RingGeometry (surface ripple waves), 1/3 are CircleGeometry (foam patches)
  const FLOW_N = 90;
  const flowMeshes = [];
  for (let i = 0; i < FLOW_N; i++) {
    const t0     = i / FLOW_N;
    const col    = lerpHex(0x7a2800, 0x10a8d8, t0);
    const useRing = (i % 3 !== 0);
    const geo    = useRing
      ? new THREE.RingGeometry(0.10 + (i % 6) * 0.04, 0.28 + (i % 5) * 0.07, 20)
      : new THREE.CircleGeometry(0.16 + (i % 7) * 0.03, 12);
    const fm = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: col, emissive: col,
      emissiveIntensity: useRing ? 0.65 : 0.30,
      roughness: 0.04, metalness: 0.1,
      transparent: true, opacity: useRing ? 0.72 : 0.52,
      side: THREE.DoubleSide,
    }));
    fm.rotation.x = -Math.PI / 2;   // lay flat on water surface
    fm.userData.t  = t0;
    fm.userData.ph = (i * 0.618033) % 1;  // golden-ratio spread → no clumping
    scene.add(fm);
    flowMeshes.push(fm);
  }

  // Aeration bubbles in biological channels
  const bubbles = [];
  const BUBBLE_N = 50;
  const bZones = [[-7, 0], [0, 0], [7, 0],   // ch3  (z=0)
                  [-7, 7], [0, 7], [7, 7]];    // ch4  (z=7)
  for (let i = 0; i < BUBBLE_N; i++) {
    const zone = bZones[i % bZones.length];
    const bm = new THREE.Mesh(
      new THREE.SphereGeometry(0.07 + Math.random() * 0.09, 5, 5),
      new THREE.MeshStandardMaterial({ color: 0xb8e8ff, transparent: true, opacity: 0.72 })
    );
    bm.userData.phase = (i / BUBBLE_N) * Math.PI * 2;
    bm.userData.ox = zone[0] + (Math.random() - 0.5) * 10;
    bm.userData.oz = zone[1] + (Math.random() - 0.5) * (CH_W - 1);
    scene.add(bm);
    bubbles.push(bm);
  }

  // Sludge particles settling in clarifier
  const sludgeParticles = [];
  const SLUDGE_N = 28;
  for (let i = 0; i < SLUDGE_N; i++) {
    const sp = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 5, 5),
      new THREE.MeshStandardMaterial({ color: 0x6b3311, transparent: true, opacity: 0.78 })
    );
    sp.userData.phase = i / SLUDGE_N;
    sp.userData.ang   = Math.random() * Math.PI * 2;
    sp.userData.r     = 1.5 + Math.random() * (CL_R - 3);
    scene.add(sp);
    sludgeParticles.push(sp);
  }

  // Steam / vapour from distillation column (penyulingan)
  const distilSteam = [];
  const DISTIL_STEAM_N = 36;
  for (let i = 0; i < DISTIL_STEAM_N; i++) {
    const ds = new THREE.Mesh(
      new THREE.SphereGeometry(0.30 + Math.random() * 0.22, 7, 7),
      new THREE.MeshStandardMaterial({
        color: 0xeef8ff, emissive: 0xaaddee, emissiveIntensity: 0.18,
        transparent: true, opacity: 0.55, roughness: 0.85,
      })
    );
    ds.userData.life = i / DISTIL_STEAM_N;
    ds.userData.ox   = (Math.random() - 0.5) * 1.2;
    ds.userData.oz   = (Math.random() - 0.5) * 1.2;
    scene.add(ds);
    distilSteam.push(ds);
  }

  // Chimney smoke from pump station
  const smokeMeshes = [];
  const SMOKE_N = 22;
  for (let i = 0; i < SMOKE_N; i++) {
    const sm = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 5, 5),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.38 })
    );
    sm.userData.life = i / SMOKE_N;
    sm.userData.ox   = (Math.random() - 0.5) * 0.6;
    sm.userData.oz   = (Math.random() - 0.5) * 0.6;
    scene.add(sm);
    smokeMeshes.push(sm);
  }

  // Chlorine dose drops at UV column
  const doseDrops = [];
  const DOSE_N = 12;
  for (let i = 0; i < DOSE_N; i++) {
    const dm = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 5, 5),
      new THREE.MeshStandardMaterial({ color: 0xddff88, transparent: true, opacity: 0.88 })
    );
    dm.userData.phase = i / DOSE_N;
    dm.userData.ox    = (Math.random() - 0.5) * 3.5;
    scene.add(dm);
    doseDrops.push(dm);
  }

  // ====================================================================
  // STAGES
  // Each stage = 11 seconds.  Camera eases between segments.
  // ====================================================================
  const STAGES = [
    {
      tag: 'Tahap 1 dari 5', title: 'Penampungan Awal (Bak Ekualisasi)',
      subtitle: 'Equalization Basin', waterQuality: 5,
      camPos: [-40, 32, -36], camLook: [-24, 0, -24],
      desc: 'Limbah vinasse yang pekat dari industri etanol dialirkan dan ditampung terlebih dahulu di bak penampungan awal IPAL Ciunik. Pada tahap ini, dilakukan penyamaan atau stabilisasi debit, suhu, dan tingkat keasaman (pH) limbah agar kondisinya ideal dan tidak merusak sistem pengolahan di tahap selanjutnya.',
    },
    {
      tag: 'Tahap 2 dari 5', title: 'Proses Aerasi (Injeksi Oksigen)',
      subtitle: 'Aeration Process', waterQuality: 28,
      camPos: [-10, 28, -10], camLook: [0, 0, 0],
      desc: 'Setelah stabil, limbah dialirkan ke dalam bak aerasi. Di dalam bak ini, air limbah dipompa dan disuplai dengan gelembung udara (oksigen) secara terus-menerus menggunakan mesin aerator. Oksigen ini sangat krusial untuk menjaga agar kondisi air tetap kaya oksigen terlarut.',
    },
    {
      tag: 'Tahap 3 dari 5', title: 'Penambahan Mikroorganisme (Bakteri Pengurai)',
      subtitle: 'Biological Treatment', waterQuality: 55,
      camPos: [8, 32, 16], camLook: [6, 0, 2],
      desc: 'Bersamaan dengan suplai oksigen yang melimpah, ditambahkan mikroorganisme aerobik (bakteri pengurai) ke dalam bak aerasi. Mikroorganisme ini bekerja dengan cara menguraikan polutan serta zat-zat organik berbahaya yang terkandung dalam vinasse, mengubahnya menjadi pupuk organik cair.',
    },
    {
      tag: 'Tahap 4 dari 5', title: 'Pengendapan (Clarifier)',
      subtitle: 'Secondary Clarifier', waterQuality: 80,
      camPos: [32, 28, 28], camLook: [30, 0, 18],
      desc: 'Setelah zat organik hancur terurai, campuran air limbah dan mikroorganisme dialirkan ke bak pengendap. Gumpalan bakteri dan sisa kotoran akan dibiarkan mengendap ke dasar bak, sementara air yang sudah jernih akan terpisah dan naik ke permukaan.',
    },
    {
      tag: 'Tahap 5 dari 5', title: 'Pelepasan Air Bersih (Output)',
      subtitle: 'Clean Water Discharge', waterQuality: 100,
      camPos: [62, 30, 30], camLook: [54, 0, 14],
      desc: 'Air hasil pemisahan tersebut kini memiliki kadar polutan (seperti BOD dan COD) yang sangat rendah dan sudah memenuhi standar baku mutu lingkungan. Air ini dapat dikembalikan atau dilepas ke alam tanpa mencemari ekosistem sekitarnya atau dimanfaatkan menjadi pupuk organik cair.',
    },
  ];

  const labelEl = $('intro-stage-label');
  let lastSegIdx = -1;
  const SEG_DUR   = 11;
  const TOTAL_DUR = SEG_DUR * STAGES.length;

  function easeIO(x) { return x < 0.5 ? 2*x*x : -1+(4-2*x)*x; }
  function lerp3(a, b, f) {
    return [a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f];
  }

  // ====================================================================
  // ANIMATION
  // ====================================================================
  let rafId = null;
  let introDone = false;
  const clock = new THREE.Clock();
  const continueBtn = $('btn-intro-continue');
  continueBtn.disabled = true;

  function animate() {
    rafId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (!introDone && t >= TOTAL_DUR) {
      introDone = true;
      continueBtn.disabled = false;
    }

    // Segmented camera
    const cyc    = t % TOTAL_DUR;
    const segF   = cyc / SEG_DUR;
    const segIdx = Math.min(Math.floor(segF), STAGES.length - 1);
    const segPrg = segF - Math.floor(segF);
    const prev   = (segIdx + STAGES.length - 1) % STAGES.length;
    const TRANS  = 0.15;

    let camP, camL;
    if (segPrg < TRANS) {
      const bl = easeIO(segPrg / TRANS);
      camP = lerp3(STAGES[prev].camPos,  STAGES[segIdx].camPos,  bl);
      camL = lerp3(STAGES[prev].camLook, STAGES[segIdx].camLook, bl);
    } else {
      const cp = STAGES[segIdx].camPos, cl = STAGES[segIdx].camLook;
      camP = [cp[0] + Math.sin(t*0.26)*1.4, cp[1] + Math.sin(t*0.19)*0.6, cp[2] + Math.cos(t*0.22)*1.1];
      camL = [...cl];
    }
    camera.position.set(camP[0], camP[1], camP[2]);
    camera.lookAt(camL[0], camL[1], camL[2]);

    // Stage label update
    if (segIdx !== lastSegIdx && labelEl) {
      lastSegIdx = segIdx;
      const s = STAGES[segIdx];
      const q = s.waterQuality;
      const qc = q < 40 ? '#e05020' : q < 75 ? '#d4aa20' : '#22bb55';
      labelEl.innerHTML =
        `<div class="sl-tag">${s.tag}</div>` +
        `<div class="sl-title">${s.title}</div>` +
        `<div class="sl-subtitle">${s.subtitle}</div>` +
        `<div class="sl-desc">${s.desc}</div>` +
        `<div class="sl-wq">` +
          `<span style="font-size:11px;opacity:.75;margin-right:6px">Kualitas Air</span>` +
          `<div class="sl-wq-bar"><div class="sl-wq-fill" style="width:${q}%;background:${qc}"></div></div>` +
          `<span class="sl-wq-val" style="color:${qc}">${q}%</span>` +
        `</div>` +
        `<div class="sl-dots">${STAGES.map((_,k)=>`<span class="sl-dot${k===segIdx?' active':''}"></span>`).join('')}</div>`;
    }

    // Flow ripples & foam along serpentine open-channel path
    flowMeshes.forEach(p => {
      p.userData.t = (p.userData.t + 0.00145) % 1;
      const pt = p.userData.t;
      p.position.copy(flowPath.getPoint(pt));
      p.position.y = 0.27;
      // Each particle independently cycles: expand from small → large, fade transparent
      const ph = (p.userData.ph + t * 0.32) % 1;
      p.scale.setScalar(0.4 + ph * 2.2);
      p.material.opacity = Math.max(0, 0.80 - ph * 0.88);
      const col = lerpHex(0x7a2800, 0x10a8d8, pt);
      p.material.color.setHex(col);
      p.material.emissive.setHex(col);
    });

    // Aeration bubbles rising in biological channels
    bubbles.forEach(b => {
      const life = ((t * 0.82 + b.userData.phase) % (Math.PI * 2)) / (Math.PI * 2);
      b.position.set(b.userData.ox, 0.22 + life * 1.55, b.userData.oz);
      b.material.opacity = life < 0.72 ? 0.7 : (1 - life) * 4.5;
    });

    // Sludge settling in clarifier (slow spiral)
    sludgeParticles.forEach(s => {
      const life = ((t * 0.22 + s.userData.phase) % 1);
      s.position.set(
        CL_X + Math.cos(s.userData.ang + t * 0.04) * s.userData.r,
        1.3 - life * 1.2,
        CL_Z + Math.sin(s.userData.ang + t * 0.04) * s.userData.r
      );
      s.material.opacity = life > 0.75 ? (1 - life) * 5 : 0.72;
    });

    // Aerator rotation
    aeratorMeshes.forEach((a, i) => { a.rotation.y = t * (1.5 + (i % 3) * 0.4); });

    // Distillation steam (white vapour rising from column top)
    distilSteam.forEach(ds => {
      ds.userData.life = (ds.userData.life + 0.0048) % 1;
      const l = ds.userData.life;
      ds.position.set(
        DISTIL_X + ds.userData.ox + Math.sin(l * 4.2 + t * 0.7) * 0.55,
        14.3 + l * 8.0,
        DISTIL_Z + ds.userData.oz + Math.cos(l * 3.5 + t * 0.5) * 0.55
      );
      ds.scale.setScalar(0.5 + l * 2.8);
      ds.material.opacity = Math.max(0, (0.55 - l * 0.62));
    });

    // Chimney smoke
    smokeMeshes.forEach(sm => {
      sm.userData.life = (sm.userData.life + 0.0036) % 1;
      const l = sm.userData.life;
      sm.position.set(
        -25.5 + sm.userData.ox + Math.sin(l * 3.5 + t) * 0.5,
        4.9 + l * 5.5,
        6   + sm.userData.oz + Math.cos(l * 2.8 + t * 0.6) * 0.4
      );
      sm.material.opacity = Math.max(0, (1 - l) * 0.40);
      sm.scale.setScalar(0.18 + l * 1.25);
    });

    // Chlorine drops at UV unit
    doseDrops.forEach(dd => {
      const life = ((t * 1.05 + dd.userData.phase) % 1);
      dd.position.set(58 + dd.userData.ox, 3.8 - life * 4.5, -5);
      dd.material.opacity = 0.88 * (1 - life);
    });

    // SPARING LED blink
    sparingLED.material.emissiveIntensity = 1.2 + 1.5 * Math.sin(t * 5.8);

    // TX data spheres arc from SPARING pole
    txSpheres.forEach(ts => {
      const a = ((t * 0.58 + ts.userData.i * 0.25) % 1);
      ts.position.set(58 + a * 14, 10.2 + Math.sin(a * Math.PI) * 5, 16 + a * 6);
      ts.material.opacity = (1 - a) * 0.88;
    });

    // Water shimmer
    channelWaterMeshes.forEach(cw => {
      cw.mesh.material.opacity = cw.baseOp + 0.03 * Math.sin(t * 0.75 + cw.baseOp * 14);
    });
    clarifier.material.opacity          = 0.84 + 0.05 * Math.sin(t * 1.05);
    equalizationWater.material.opacity  = 0.80 + 0.04 * Math.sin(t * 0.68);
    river.material.opacity              = 0.75 + 0.06 * Math.sin(t * 0.88);

    renderer.render(scene, camera);
  }
  animate();

  // Continue button
  $('btn-intro-continue').onclick = () => {
    cancelAnimationFrame(rafId);
    renderer.dispose();
    _introAssetRenderer = null;
    screen.classList.add('hidden');
    cb();
  };
}


// ─────────────────────────────────────────────────────
// Instructions Screen
// ─────────────────────────────────────────────────────
export function showInstructions(cb) {
  $('instructions-screen').classList.remove('hidden');

  // Fill control hint based on device type
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
                || (navigator.maxTouchPoints > 1);
  const ctrlEl = $('instr-controls-text');
  if (ctrlEl) {
    ctrlEl.innerHTML = isMobile
      ? `Gunakan <strong>joystick virtual</strong> di kiri bawah layar untuk bergerak. Dekati objek bercahaya lalu ketuk tombol <strong>E</strong> di kanan bawah untuk berinteraksi.`
      : `Gunakan <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> atau tombol panah untuk bergerak. Dekati objek bercahaya lalu tekan <kbd>E</kbd> untuk berinteraksi.`;
  }

  // Populate level guide cards
  const levelGuideEl = $('instr-level-guide');
  if (levelGuideEl) {
    const levels = [
      { num:1, icon:'🔬', name:'Lab Sains',            desc:'Amati 3 fenomena pencemaran vinasse di laboratorium dan jawab pertanyaan ilmiah.' },
      { num:2, icon:'🏭', name:'Pabrik Etanol',         desc:'Kunjungi 3 stasiun pabrik, lakukan simulasi pengolahan COD/BOD/pH secara interaktif.' },
      { num:3, icon:'🌿', name:'Kolam Remediasi',       desc:'Pilih mikroorganisme yang tepat di toko, hitung dosis, lalu buka kran vinasse.' },
      { num:4, icon:'🔧', name:'Workshop IPAL',         desc:'Rancang prototype reaktor IPAL: pilih alat & bahan, ikuti prosedur, evaluasi hasilnya.' },
      { num:5, icon:'🔭', name:'Lab Observasi',         desc:'Analisis kegagalan reaktor dari Level 4 dan jawab soal evaluasi mikroskop.' },
    ];
    levelGuideEl.innerHTML = levels.map(l => `
      <div class="level-guide-card">
        <span class="lg-icon">${l.icon}</span>
        <div><strong>Level ${l.num} – ${l.name}</strong><div class="lg-desc">${l.desc}</div></div>
      </div>
    `).join('');
  }

  $('btn-start-game').onclick = () => {
    $('instructions-screen').classList.add('hidden');
    cb();
  };
}

// ─────────────────────────────────────────────────────
// HUD
// ─────────────────────────────────────────────────────
export function initHUD() {
  updateHUD();
  $('btn-glossary').onclick = () => toggleGlossary();
}

// ─────────────────────────────────────────────────────
// Pause Menu
// ─────────────────────────────────────────────────────
export function initPauseMenu(onResumeCheckpoint, onNewGame) {
  const overlay = $('pause-menu-overlay');

  $('btn-pause-menu').onclick = () => {
    // Populate checkpoint info
    const cp = loadCheckpoint();
    const infoEl = $('pause-checkpoint-info');
    const resumeBtn = $('btn-pm-resume');
    if (cp) {
      const d = new Date(cp.savedAt);
      const fmt = d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
                + ' ' + d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
      infoEl.innerHTML = `💾 Checkpoint tersimpan: <strong>${cp.playerName}</strong> · Level ${cp.currentLevel} · ${cp.totalPoints} poin<br><small style="color:#aaa">${fmt}</small>`;
      resumeBtn.disabled = false;
      resumeBtn.title = '';
    } else {
      infoEl.innerHTML = `<span style="color:#aaa">Belum ada checkpoint tersimpan.</span>`;
      resumeBtn.disabled = true;
      resumeBtn.title = 'Tidak ada checkpoint tersimpan';
    }
    overlay.classList.remove('hidden');
  };

  $('btn-pm-continue').onclick = () => {
    overlay.classList.add('hidden');
  };

  $('btn-pm-resume').onclick = () => {
    overlay.classList.add('hidden');
    onResumeCheckpoint();
  };

  $('btn-pm-newgame').onclick = () => {
    if (confirm('Yakin ingin memulai ulang? Semua progres sesi ini akan hilang.')) {
      overlay.classList.add('hidden');
      onNewGame();
    }
  };

  // Close on backdrop click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
}

export function updateHUD() {
  $('hud-player').textContent = state.playerName || 'Pemain';
  $('hud-level').textContent  = `Level ${state.currentLevel}`;
  $('hud-points').textContent = state.totalPoints;

  // Attempts dots
  const attemptsEl = $('hud-attempts');
  attemptsEl.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'attempt-dot' + (i < state.levelAttempts ? ' used' : '');
    attemptsEl.appendChild(dot);
  }
}

// ─────────────────────────────────────────────────────
// Interact Prompt (floating "Press E" hint)
// ─────────────────────────────────────────────────────
export function setInteractPrompt(html) {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
                || (navigator.maxTouchPoints > 1);
  let el = $('interact-prompt');
  if (!el) {
    el = document.createElement('div');
    el.id = 'interact-prompt';
    el.style.cssText = `
      position:fixed; bottom:${isMobile ? '200px' : '120px'}; left:50%; transform:translateX(-50%);
      background:rgba(10,20,40,0.88); color:#fff; padding:10px 22px;
      border-radius:24px; font-size:15px; pointer-events:none;
      border:2px solid #00d4ff; box-shadow:0 0 18px #00d4ff88;
      transition:opacity 0.25s; z-index:200; white-space:nowrap;
    `;
    document.body.appendChild(el);
  }
  // On mobile replace keyboard hint with tap hint
  if (isMobile && html) {
    html = html.replace(/Tekan <kbd>E<\/kbd>/g, '👆 Ketuk tombol <b>E</b>');
  }
  if (html) {
    el.innerHTML = html;
    el.style.opacity = '1';
    el.style.display = 'block';
  } else {
    el.style.opacity = '0';
    setTimeout(() => { el.style.display = 'none'; }, 260);
  }
}

// ─────────────────────────────────────────────────────
// Stage / Quiz Panel
// ─────────────────────────────────────────────────────
export function showStagePanel(onComplete) {
  const screen = $('stage-screen');
  screen.classList.remove('hidden');
  renderPhenomenon(state.phenomenonIndex, onComplete);
}

// Open a single phenomenon by index (used by 3D object interaction)
// Always shows ONLY that one question, then calls onDone — no chaining.
export function showQuestionPanel(phenomenonIdx, onDone, onDismiss) {
  const screen = $('stage-screen');
  screen.classList.remove('hidden');
  screen.style.pointerEvents = 'all';

  state.phenomenonIndex = phenomenonIdx;

  renderPhenomenon(phenomenonIdx, () => {
    screen.classList.add('hidden');
    screen.style.pointerEvents = 'none';
    if (onDone) onDone();
  }, () => {
    screen.classList.add('hidden');
    screen.style.pointerEvents = 'none';
    if (onDismiss) onDismiss();
  }, /* standalone= */ true);
}

// Open a Level 2 (Stage 2) phenomenon by index
export function showLevel2QuestionPanel(phenomenonIdx, onDone, onDismiss) {
  const screen = $('stage-screen');
  screen.classList.remove('hidden');
  screen.style.pointerEvents = 'all';

  state.phenomenonIndex = phenomenonIdx;

  renderLevel2Phenomenon(phenomenonIdx, () => {
    screen.classList.add('hidden');
    screen.style.pointerEvents = 'none';
    if (onDone) onDone();
  }, () => {
    screen.classList.add('hidden');
    screen.style.pointerEvents = 'none';
    if (onDismiss) onDismiss();
  }, /* standalone= */ true);
}

// ─────────────────────────────────────────────────────
// Level Complete banner (all 3 phenomena done)
// ─────────────────────────────────────────────────────
export function showLevelComplete(onAdvance) {
  state.levelAttempts++;
  // Record how many points were earned this level (already added per-question)
  recordLevelPoints(state.currentLevel);
  const earned = state.levelBreakdown.at(-1)?.points ?? 0;
  showLevelResult(earned, `🏠 Kembali ke Pilihan Ruangan →`, () => {
    resetLevelState();
    updateHUD();
    if (onAdvance) onAdvance();
  });
}

// ─────────────────────────────────────────────────────
// Room Hub — player picks which level/room to enter
// ─────────────────────────────────────────────────────
const ROOM_CONFIG = [
  {
    level: 1,
    icon: '🔬',
    name: 'Lab Sains',
    desc: 'Analisis fenomena pencemaran vinasse melalui kuis MCQ',
    color: '#2980b9',
  },
  {
    level: 2,
    icon: '🏭',
    name: 'Pabrik Etanol',
    desc: 'Simulasi pengukuran COD, BOD & pH limbah vinasse',
    color: '#e67e22',
  },
  {
    level: 3,
    icon: '🌿',
    name: 'Kolam Remediasi',
    desc: 'Pilih mikroorganisme & buka kran bioremediasi',
    color: '#27ae60',
  },
  {
    level: 4,
    icon: '⚙️',
    name: 'Workshop IPAL',
    desc: 'Rancang reaktor pengolahan limbah IPAL',
    color: '#8e44ad',
  },
  {
    level: 5,
    icon: '🔭',
    name: 'Lab Observasi',
    desc: 'Analisis hasil reaktor & evaluasi akhir',
    color: '#c0392b',
  },
];

export function showRoomSelect(onSelectRoom) {
  const overlay = document.getElementById('room-select-overlay');
  overlay.classList.remove('hidden');

  function render() {
    const grid = document.getElementById('room-select-grid');
    grid.innerHTML = ROOM_CONFIG.map(r => {
      const done = state.completedRooms.includes(r.level);
      return `
        <button class="room-card ${done ? 'room-card--done' : ''}" data-level="${r.level}"
          style="--room-color:${r.color}">
          <div class="room-card-icon">${r.icon}</div>
          <div class="room-card-body">
            <div class="room-card-name">Level ${r.level} — ${r.name}</div>
            <div class="room-card-desc">${r.desc}</div>
          </div>
          <div class="room-card-status">${done ? '✅ Selesai' : '▶ Mulai'}</div>
        </button>
      `;
    }).join('');

    // Update total points display
    document.getElementById('room-hub-points').textContent = `🪙 ${state.totalPoints} poin`;
    document.getElementById('room-hub-progress').textContent =
      `${state.completedRooms.length} / 5 ruangan selesai`;

    grid.querySelectorAll('.room-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const lvl = parseInt(btn.dataset.level);
        overlay.classList.add('hidden');
        onSelectRoom(lvl);
      });
    });
  }

  render();
  // Expose re-render so main.js can refresh after room completion
  overlay._refresh = render;
}

// ─────────────────────────────────────────────────────
// Level 2 Complete (after quiz panels — before simulation)
// ─────────────────────────────────────────────────────
export function showLevel2QuizComplete(onAdvance) {
  // Points already awarded per-question; just show transition screen
  state.levelAttempts++;
  showLevelResult(0, '🔬 Mulai Simulasi Pengolahan →', () => {
    if (onAdvance) onAdvance();
  });
}

// ─────────────────────────────────────────────────────
// Game Complete — after Level 6, back to start
// ─────────────────────────────────────────────────────
export function showGameComplete() {
  // ── Persist the final level's points & save to leaderboard ──
  recordLevelPoints(state.currentLevel);
  saveScore({
    playerName:     state.playerName,
    totalPoints:    state.totalPoints,
    levelBreakdown: state.levelBreakdown,
    completedAt:    new Date().toISOString(),
  });
  clearCheckpoint();

  // ── Build per-level breakdown rows ──
  const breakdownRows = state.levelBreakdown.map(entry => `
    <tr>
      <td style="text-align:left;padding:6px 12px;color:#ccc">${entry.label}</td>
      <td style="text-align:right;padding:6px 12px;font-weight:700;color:#ffe040">+${entry.points}</td>
    </tr>
  `).join('');

  const overlay = document.createElement('div');
  overlay.id = 'game-complete-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.88);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    z-index:9999;font-family:system-ui,sans-serif;color:#fff;text-align:center;
    animation:fadeIn .5s ease;overflow-y:auto;padding:20px 0;
  `;
  overlay.innerHTML = `
    <div style="max-width:560px;width:92%;padding:36px 32px;
          background:linear-gradient(135deg,#1a2a1a,#0d1a10);
          border-radius:20px;border:2px solid #2ecc71;box-shadow:0 0 60px rgba(46,204,113,.4)">
      <div style="font-size:64px;margin-bottom:8px">🏆</div>
      <h1 style="font-size:26px;margin:0 0 6px;color:#2ecc71">Selamat, Kamu Menyelesaikan<br>3D BIOVINE!</h1>
      <p style="font-size:14px;color:#aaa;margin:0 0 20px">
        Kamu telah berhasil mengolah limbah vinasse menjadi<br>
        <strong style="color:#ffe040">Pupuk Organik Cair (POC)</strong> yang bermanfaat 🌿
      </p>

      <!-- Per-level breakdown -->
      <div style="background:rgba(0,0,0,.3);border-radius:12px;padding:16px;margin-bottom:20px;text-align:left">
        <div style="font-size:13px;font-weight:700;color:#2ecc71;margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em">📊 Rincian Poin per Level</div>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tbody>
            ${breakdownRows}
          </tbody>
          <tfoot>
            <tr style="border-top:1px solid rgba(255,255,255,.15)">
              <td style="text-align:left;padding:8px 12px;font-weight:700;color:#fff">Total</td>
              <td style="text-align:right;padding:8px 12px;font-size:22px;font-weight:700;color:#ffe040">${state.totalPoints}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <button id="btn-gc-restart" style="
          padding:12px 28px;border-radius:10px;border:none;cursor:pointer;font-size:15px;font-weight:600;
          background:linear-gradient(135deg,#2ecc71,#27ae60);color:#fff;
          box-shadow:0 4px 16px rgba(46,204,113,.4)">
          🔄 Main Lagi dari Awal
        </button>
        <button id="btn-gc-close" style="
          padding:12px 28px;border-radius:10px;border:none;cursor:pointer;font-size:15px;font-weight:600;
          background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2)">
          ✕ Tutup
        </button>
      </div>
    </div>
    <style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}</style>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#btn-gc-close').onclick = () => {
    overlay.remove();
    updateHUD();
  };

  overlay.querySelector('#btn-gc-restart').onclick = () => {
    overlay.remove();
    // Full page reload — cleanest way to restart all state
    window.location.reload();
  };
}

function renderPhenomenon(idx, onComplete, onDismiss, standalone = false) {
  const phenom = stage1.phenomena[idx];
  const screen = $('stage-screen');

  // Reset wrong-answer counter for this question
  state.wrongAnswers = 0;

  // Clear previous panel
  const existing = screen.querySelector('.stage-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.className = 'stage-panel fade-in';

  // Header — in standalone mode hide the progress counter (it's just 1 question)
  panel.innerHTML = `
    <div class="phenomenon-header">
      <span class="phenomenon-badge">${phenom.title}</span>
      ${!standalone ? `<span class="question-progress">${idx + 1} / ${stage1.phenomena.length}</span>` : ''}
      ${onDismiss ? `<button class="panel-close-btn" id="panel-close-btn" title="Tutup">✕</button>` : ''}
    </div>
    ${!standalone ? `
    <div class="progress-bar-wrap">
      ${stage1.phenomena.map((_, i) => `<div class="prog-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}"></div>`).join('')}
    </div>` : ''}
  `;

  // Wire up close button
  if (onDismiss) {
    setTimeout(() => {
      const closeBtn = panel.querySelector('#panel-close-btn');
      if (closeBtn) closeBtn.onclick = onDismiss;
    }, 0);
  }

  // Context
  const ctxDiv = document.createElement('div');
  ctxDiv.className = 'question-text';
  ctxDiv.innerHTML = phenom.context;
  panel.appendChild(ctxDiv);

  // Optional question image
  if (phenom.image) {
    const imgWrap = document.createElement('div');
    imgWrap.style.cssText = 'text-align:center;margin:10px 0';
    const img = document.createElement('img');
    img.src = phenom.image;
    img.alt = phenom.title || 'Gambar soal';
    img.style.cssText = 'max-width:100%;max-height:260px;border-radius:10px;border:2px solid rgba(255,255,255,.15);object-fit:contain';
    imgWrap.appendChild(img);
    panel.appendChild(imgWrap);
  }

  // Data table
  if (phenom.tableData) {
    panel.appendChild(buildDataTable(phenom.tableData));
  }

  // Standard/regulation table
  if (phenom.standardTable) {
    panel.appendChild(buildStandardTable(phenom.standardTable));
  }

  // Rice graph
  if (phenom.riceGraph) {
    panel.appendChild(buildRiceGraph());
  }

  // Question
  const qDiv = document.createElement('div');
  qDiv.className = 'question-text';
  qDiv.style.marginTop = '4px';
  qDiv.style.borderLeftColor = '#e67e22';
  qDiv.innerHTML = `<strong>❓ Pertanyaan:</strong><br>${phenom.question}`;
  panel.appendChild(qDiv);

  // Answer options
  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'answer-options';

  // Track whether answered
  let answered = false;
  let correct = false;

  phenom.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.innerHTML = `<strong>${opt.label}.</strong> ${opt.text}`;
    btn.dataset.correct = opt.correct;

    btn.onclick = () => {
      if (answered) return;

      if (opt.correct) {
        answered = true;
        correct = true;
        btn.classList.add('correct');
        // Award points immediately for this question
        const pts = state.wrongAnswers === 0 ? 100 : state.wrongAnswers <= 1 ? 50 : 25;
        state.totalPoints += pts;
        updateHUD();
        showFeedback(panel, true, phenom.explanation + `<br><strong>+${pts} poin!</strong>`);
        nextBtn.classList.add('visible');
        // Disable all
        optionsDiv.querySelectorAll('.answer-btn').forEach(b => (b.disabled = true));
      } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        state.wrongAnswers++;
        updateHUD();
        showFeedback(panel, false, '❌ Jawaban kurang tepat. Coba pilihan lain!');
      }
    };

    optionsDiv.appendChild(btn);
  });

  panel.appendChild(optionsDiv);

  // Feedback box
  const feedbackDiv = document.createElement('div');
  feedbackDiv.className = 'feedback-box';
  feedbackDiv.id = 'feedback-box';
  panel.appendChild(feedbackDiv);

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'next-btn';
  // In standalone mode: always "Done" — never chain to next phenomenon
  nextBtn.textContent = standalone
    ? '✅ Selesai'
    : (idx < stage1.phenomena.length - 1 ? 'Fenomena Berikutnya →' : '✅ Selesai Level 1');
  nextBtn.onclick = () => {
    if (standalone || idx >= stage1.phenomena.length - 1) {
      screen.classList.add('hidden');
      screen.style.pointerEvents = 'none';
      if (onComplete) onComplete();
    } else {
      state.phenomenonIndex++;
      renderPhenomenon(state.phenomenonIndex, onComplete, onDismiss, false);
    }
  };
  panel.appendChild(nextBtn);

  screen.appendChild(panel);
}

// ─────────────────────────────────────────────────────
// Level 2 phenomenon renderer
// ─────────────────────────────────────────────────────
function renderLevel2Phenomenon(idx, onComplete, onDismiss, standalone = false) {
  const phenom = stage2.phenomena[idx];
  const screen = $('stage-screen');

  const existing = screen.querySelector('.stage-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.className = 'stage-panel fade-in';

  panel.innerHTML = `
    <div class="phenomenon-header">
      <span class="phenomenon-badge" style="background:rgba(255,140,30,0.18);border-color:#ff8c1e;color:#ff8c1e">
        ${phenom.title}
      </span>
      ${!standalone ? `<span class="question-progress">${idx + 1} / ${stage2.phenomena.length}</span>` : ''}
      ${onDismiss ? `<button class="panel-close-btn" id="panel-close-btn2" title="Tutup">✕</button>` : ''}
    </div>
    ${!standalone ? `
    <div class="progress-bar-wrap">
      ${stage2.phenomena.map((_, i) => `
        <div class="prog-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}"></div>
      `).join('')}
    </div>` : ''}
  `;

  if (onDismiss) {
    setTimeout(() => {
      const closeBtn = panel.querySelector('#panel-close-btn2');
      if (closeBtn) closeBtn.onclick = onDismiss;
    }, 0);
  }

  // Station info text
  const ctxDiv = document.createElement('div');
  ctxDiv.className = 'question-text';
  ctxDiv.innerHTML = phenom.context;
  panel.appendChild(ctxDiv);

  // Optional image
  if (phenom.image) {
    const imgWrap = document.createElement('div');
    imgWrap.style.cssText = 'text-align:center;margin:10px 0';
    const img = document.createElement('img');
    img.src = phenom.image;
    img.alt = phenom.title || 'Gambar stasiun';
    img.style.cssText = 'max-width:100%;max-height:260px;border-radius:10px;border:2px solid rgba(255,255,255,.15);object-fit:contain';
    imgWrap.appendChild(img);
    panel.appendChild(imgWrap);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'next-btn visible';
  const isLast = idx >= stage2.phenomena.length - 1;
  nextBtn.textContent = standalone
    ? '✅ Selesai'
    : (isLast ? '🔬 Lanjut ke Simulasi →' : 'Stasiun Berikutnya →');
  nextBtn.onclick = () => {
    if (standalone || isLast) {
      screen.classList.add('hidden');
      screen.style.pointerEvents = 'none';
      if (onComplete) onComplete();
    } else {
      state.phenomenonIndex++;
      renderLevel2Phenomenon(state.phenomenonIndex, onComplete, onDismiss, false);
    }
  };
  panel.appendChild(nextBtn);

  screen.appendChild(panel);
}


function showFeedback(panel, isCorrect, message) {
  const box = panel.querySelector('#feedback-box');
  if (!box) return;
  box.className = 'feedback-box ' + (isCorrect ? 'correct' : 'wrong');
  box.innerHTML = message;
}

// ─────────────────────────────────────────────────────
// Data Table builder
// ─────────────────────────────────────────────────────
function buildDataTable(tableData) {
  const wrap = document.createElement('div');
  wrap.className = 'data-table-wrap';

  let html = '<table class="data-table"><thead><tr>';
  for (const h of tableData.headers) {
    html += `<th>${h}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (const row of tableData.rows) {
    html += `<tr><td><strong>${row.label}</strong></td>`;
    row.values.forEach((v, i) => {
      const cls = row.classes[i] ? ` class="${row.classes[i]}"` : '';
      html += `<td${cls}>${v}</td>`;
    });
    html += '</tr>';
  }

  html += '</tbody></table>';
  if (tableData.note) {
    html += `<div class="info-label" style="margin-top:6px">📌 ${tableData.note}</div>`;
  }

  wrap.innerHTML = html;
  return wrap;
}

// ─────────────────────────────────────────────────────
// Standard Table builder
// ─────────────────────────────────────────────────────
function buildStandardTable(std) {
  const wrap = document.createElement('div');
  wrap.className = 'std-table-wrap';

  let html = `<div class="info-label" style="margin-bottom:6px">📋 ${std.title}</div>`;
  html += '<table class="std-table"><thead><tr>';
  for (const h of std.headers) {
    html += `<th>${h}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (const row of std.rows) {
    html += '<tr>' + row.map(c => `<td>${c}</td>`).join('') + '</tr>';
  }
  html += '</tbody></table>';

  wrap.innerHTML = html;
  return wrap;
}

// ─────────────────────────────────────────────────────
// Rice harvest bar chart
// ─────────────────────────────────────────────────────
function buildRiceGraph() {
  const wrap = document.createElement('div');
  wrap.className = 'rice-graph-wrap';

  const img = document.createElement('img');
  img.src = '/rice-graph.png';
  img.alt = 'Grafik produktivitas panen padi';
  img.style.cssText = 'width:100%;border-radius:8px;border:1px solid rgba(255,255,255,0.1);display:block;';

  wrap.appendChild(img);
  return wrap;
}

// ─────────────────────────────────────────────────────
// Level Result Popup
// ─────────────────────────────────────────────────────
function showLevelResult(points, btnLabel, onComplete) {
  const overlay = $('result-overlay');
  overlay.classList.remove('hidden');

  const isGood = points >= 75;
  $('result-icon').textContent = isGood ? '🎉' : points >= 50 ? '👍' : '💡';
  $('result-title').textContent = isGood ? 'Luar Biasa!' : points >= 50 ? 'Bagus!' : 'Terus Belajar!';
  $('result-score').textContent = `+${points} poin`;
  $('result-total').textContent = `Total: ${state.totalPoints} poin`;

  const attempt = state.levelAttempts;
  const attemptsText = attempt === 1
    ? '🥇 Berhasil di percobaan pertama!'
    : attempt === 2
    ? '🥈 Berhasil di percobaan ke-2.'
    : '🥉 Berhasil di percobaan ke-3.';
  $('result-attempts').textContent = attemptsText;

  const contBtn = $('btn-result-continue');
  contBtn.textContent = btnLabel || 'Lanjut →';
  contBtn.onclick = () => {
    overlay.classList.add('hidden');
    onComplete();
  };
}

// ─────────────────────────────────────────────────────
// Glossary
// ─────────────────────────────────────────────────────
function toggleGlossary() {
  const modal = $('glossary-modal');
  modal.classList.toggle('hidden');
}

// ─────────────────────────────────────────────────────
// Build all static HTML into the page
// ─────────────────────────────────────────────────────
export function buildUIHTML() {
  const hud = $('hud');
  hud.innerHTML = `
    <div id="hud-bar">
      <div id="hud-left">
        <span id="hud-player">Pemain</span>
        <span id="hud-level">Level 1</span>
      </div>
      <div id="hud-center">
        <div class="progress-bar-wrap" id="level-progress">
          ${[1,2,3,4,5,6].map((l, i) => `<div class="prog-dot ${i === 0 ? 'active' : ''}" title="Level ${l}"></div>`).join('')}
        </div>
      </div>
      <div id="hud-right">
        <span id="hud-points">0</span>
        <div id="hud-attempts"></div>
        <button id="btn-glossary">📖 Buku Saku</button>
        <button id="btn-pause-menu">⚙️ Menu</button>
      </div>
    </div>
  `;
  hud.style.display = 'none';

  const ui = $('ui-overlay');
  ui.innerHTML = `
    <!-- PAUSE MENU MODAL -->
    <div id="pause-menu-overlay" class="hidden">
      <div id="pause-menu-card">
        <div id="pause-menu-title">⚙️ Menu Permainan</div>
        <div id="pause-checkpoint-info"></div>
        <button class="btn-pause-action" id="btn-pm-continue">▶ Lanjutkan Bermain</button>
        <button class="btn-pause-action btn-pause-checkpoint" id="btn-pm-resume">↩ Kembali ke Checkpoint</button>
        <button class="btn-pause-action btn-pause-newgame" id="btn-pm-newgame">🔄 Mulai Ulang (New Game)</button>
      </div>
    </div>

    <!-- PROFILE SCREEN -->
    <div class="screen" id="profile-screen">
      <div class="profile-card">
        <div class="logo">🌿</div>
        <h1>3D BIOVINE</h1>
        <p class="subtitle">Game Edukasi Penyelamatan Lingkungan<br>dari Pencemaran Limbah Vinasse</p>

        <!-- Checkpoint resume banner (populated dynamically) -->
        <div id="resume-section" class="hidden"></div>

        <label for="input-name">Nama Karakter Kamu</label>
        <input type="text" id="input-name" placeholder="Masukkan nama karakter..." maxlength="30" />
        <button class="btn-primary" id="btn-profile-start">Mulai Petualangan →</button>
      </div>
    </div>

    <!-- INSTRUCTIONS SCREEN -->
    <div class="screen hidden" id="instructions-screen">
      <div class="instructions-card">
        <h2>📋 Petunjuk Permainan</h2>

        <div class="instr-section">
          <h3>🎯 Misi Utama</h3>
          <p>Selamatkan lingkungan dari pencemaran limbah <strong>Vinasse</strong> akibat industri etanol di kawasan Bekonang. Kamu akan menjelajahi kawasan pabrik, sungai, dan persawahan untuk memahami dampak pencemaran ini.</p>
        </div>

        <div class="instr-section">
          <h3>�️ Kontrol Gerak</h3>
          <p id="instr-controls-text"></p>
        </div>

        <div class="instr-section">
          <h3>�📊 Sistem Level</h3>
          <p>Terdapat <strong>6 Level</strong> yang harus diselesaikan secara berurutan. Setiap level memiliki 3 fenomena dengan masing-masing 1 pertanyaan.</p>
        </div>

        <div class="instr-section">
          <h3>🪙 Sistem Poin</h3>
          <table class="point-table">
            <thead><tr><th>Percobaan</th><th>Poin Diperoleh</th></tr></thead>
            <tbody>
              <tr><td>✅ Percobaan ke-1 (0 salah)</td><td>100 poin</td></tr>
              <tr><td>✅ Percobaan ke-2 (≤2 salah)</td><td>50 poin</td></tr>
              <tr><td>✅ Percobaan ke-3</td><td>25 poin</td></tr>
            </tbody>
          </table>
        </div>

        <div class="instr-section">
          <h3>�️ Panduan Level</h3>
          <div id="instr-level-guide"></div>
        </div>

        <div class="instr-section">
          <h3>💡 Tips Bermain</h3>
          <ul class="instr-tips">
            <li>🔴 Jawab dengan hati-hati karena setiap jawaban salah mengurangi poin yang kamu dapatkan.</li>
            <li>🟡 Progres permainan tersimpan otomatis setiap kali kamu menyelesaikan sebuah level!</li>
            <li>🟢 Jika kamu menutup permainan, kamu bisa <strong>melanjutkan dari level terakhir</strong> kapan saja.</li>
            <li>🔵 Gunakan <strong>Buku Saku</strong> di HUD jika kamu tidak mengenal istilah kimia.</li>
          </ul>
        </div>

        <div class="instr-section">
          <h3>�📖 Bantuan</h3>
          <p>Klik ikon <strong>"Buku Saku"</strong> di pojok kanan atas jika kamu butuh penjelasan tentang istilah kimia seperti pH, BOD, COD, DO, atau Vinasse.</p>
        </div>

        <button class="btn-primary" id="btn-start-game">🚀 Mulai Level 1</button>
      </div>
    </div>

    <!-- SYNOPSIS SCREEN (shown before intro video) -->
    <div class="screen hidden" id="synopsis-screen">
      <div class="synopsis-container">
        <!-- Avatar panel -->
        <div class="synopsis-avatar-wrap">
          <div id="syn-bubble" class="synopsis-bubble">Halo! Yuk, kenali masalah lingkungan ini bersama saya.</div>
          <svg viewBox="0 0 200 400" class="synopsis-avatar" xmlns="http://www.w3.org/2000/svg">
            <!-- Shadow -->
            <ellipse cx="100" cy="393" rx="52" ry="6" fill="rgba(0,0,0,0.18)"/>
            <!-- Shoes -->
            <ellipse cx="80"  cy="387" rx="19" ry="7" fill="#1a1a2a"/>
            <ellipse cx="120" cy="387" rx="19" ry="7" fill="#1a1a2a"/>
            <!-- Legs (dark trousers) -->
            <rect x="68"  y="290" width="22" height="100" rx="9" fill="#2c3e50"/>
            <rect x="110" y="290" width="22" height="100" rx="9" fill="#2c3e50"/>
            <!-- Lab coat body -->
            <path d="M40 163 L160 163 L164 302 L36 302 Z" fill="#f0f4f8"/>
            <!-- Lab coat lapels -->
            <path d="M100 163 L76 214 L52 192 L40 163 Z" fill="#dde3e8"/>
            <path d="M100 163 L124 214 L148 192 L160 163 Z" fill="#dde3e8"/>
            <!-- Shirt / tie area -->
            <path d="M100 163 L76 214 L124 214 Z" fill="#2980b9"/>
            <polygon points="100,175 94,210 100,220 106,210" fill="#1a5276"/>
            <!-- Right arm (relaxed along side) -->
            <path d="M160 178 Q182 208 175 252" stroke="#dde3e8" stroke-width="28" fill="none" stroke-linecap="round"/>
            <path d="M160 178 Q182 208 175 252" stroke="#f5cba7" stroke-width="20" fill="none" stroke-linecap="round"/>
            <ellipse cx="174" cy="257" rx="13" ry="10" fill="#f5cba7"/>
            <!-- Left arm (raised / gesturing at viewer) -->
            <path d="M40 178 Q14 202 18 248" stroke="#f0f4f8" stroke-width="28" fill="none" stroke-linecap="round"/>
            <path d="M40 178 Q14 202 18 248" stroke="#f5cba7" stroke-width="20" fill="none" stroke-linecap="round"/>
            <ellipse cx="17" cy="253" rx="13" ry="10" fill="#f5cba7"/>
            <!-- Pointing index finger -->
            <line x1="17" y1="248" x2="4" y2="236" stroke="#f5cba7" stroke-width="7" stroke-linecap="round"/>
            <!-- Neck -->
            <rect x="87" y="140" width="26" height="28" rx="9" fill="#f5cba7"/>
            <!-- Head -->
            <ellipse cx="100" cy="98" rx="56" ry="60" fill="#f5cba7"/>
            <!-- Hair (dark, neat) -->
            <path d="M46 82 Q46 36 100 36 Q154 36 154 82 Q150 48 100 48 Q50 48 46 82 Z" fill="#1c0c02"/>
            <!-- Side hair -->
            <path d="M46 78 Q44 108 48 132" stroke="#1c0c02" stroke-width="9" fill="none" stroke-linecap="round"/>
            <path d="M154 78 Q156 108 152 132" stroke="#1c0c02" stroke-width="9" fill="none" stroke-linecap="round"/>
            <!-- Ears -->
            <ellipse cx="46"  cy="100" rx="8" ry="12" fill="#e8a87c"/>
            <ellipse cx="154" cy="100" rx="8" ry="12" fill="#e8a87c"/>
            <!-- Eyes (whites) -->
            <ellipse cx="78"  cy="98" rx="13" ry="14" fill="white"/>
            <ellipse cx="122" cy="98" rx="13" ry="14" fill="white"/>
            <!-- Irises -->
            <circle cx="80"  cy="100" r="9" fill="#2c1a0e"/>
            <circle cx="124" cy="100" r="9" fill="#2c1a0e"/>
            <!-- Pupils / highlight -->
            <circle cx="82"  cy="98" r="3.5" fill="white"/>
            <circle cx="126" cy="98" r="3.5" fill="white"/>
            <!-- Eyebrows -->
            <path d="M65 83 Q78 76 91 83" stroke="#1c0c02" stroke-width="3.2" fill="none" stroke-linecap="round"/>
            <path d="M109 83 Q122 76 135 83" stroke="#1c0c02" stroke-width="3.2" fill="none" stroke-linecap="round"/>
            <!-- Glasses frames -->
            <rect x="62"  y="87" width="30" height="22" rx="7" fill="rgba(180,220,255,0.08)" stroke="#556" stroke-width="2.5"/>
            <rect x="108" y="87" width="30" height="22" rx="7" fill="rgba(180,220,255,0.08)" stroke="#556" stroke-width="2.5"/>
            <line x1="92"  y1="98" x2="108" y2="98" stroke="#556" stroke-width="2.5"/>
            <line x1="62"  y1="98" x2="52"  y2="94" stroke="#556" stroke-width="2.5"/>
            <line x1="138" y1="98" x2="148" y2="94" stroke="#556" stroke-width="2.5"/>
            <!-- Mouth (animated by JS) -->
            <path id="syn-mouth" d="M84 126 Q100 138 116 126" stroke="#c0392b" stroke-width="2.8" fill="none" stroke-linecap="round"/>
            <!-- Cheek blush -->
            <ellipse cx="64"  cy="115" rx="9" ry="6" fill="rgba(255,150,100,0.18)"/>
            <ellipse cx="136" cy="115" rx="9" ry="6" fill="rgba(255,150,100,0.18)"/>
            <!-- Lab coat pocket with pen -->
            <rect x="116" y="212" width="30" height="36" rx="6" fill="none" stroke="#c8d0d8" stroke-width="1.5"/>
            <line x1="125" y1="212" x2="125" y2="206" stroke="#888" stroke-width="2" stroke-linecap="round"/>
            <line x1="131" y1="212" x2="131" y2="204" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
            <line x1="137" y1="212" x2="137" y2="207" stroke="#e74c3c" stroke-width="2" stroke-linecap="round"/>
            <!-- Name badge -->
            <rect x="48" y="212" width="46" height="32" rx="5" fill="rgba(41,128,185,0.18)" stroke="rgba(41,128,185,0.5)" stroke-width="1.5"/>
            <text x="71" y="226" text-anchor="middle" fill="#7ed6f7" font-size="6.5" font-family="monospace" font-weight="bold">PENELITI</text>
            <text x="71" y="236" text-anchor="middle" fill="#95a5a6" font-size="5.5" font-family="monospace">BIOVINE</text>
          </svg>
          <div class="synopsis-avatar-name">Dr. Ana Wijaya</div>
        </div>

        <!-- Text content panel -->
        <div class="synopsis-content" id="synopsis-content-panel">
          <button id="btn-syn-skip" class="synopsis-btn-skip">Lewati ⟶</button>
          <div id="syn-seg-tag"   class="synopsis-segment-tag">Bagian 1 dari 3</div>
          <div id="syn-seg-title" class="synopsis-segment-title">Industri Etanol di Desa Bekonang</div>
          <div id="syn-seg-text"  class="synopsis-text"></div>
          <div class="synopsis-photos">
            <img src="synopsis/Synopsis-1.jpeg" alt="Desa Bekonang" class="synopsis-photo" />
            <img src="synopsis/Synopsis-2.jpeg" alt="Desa Bekonang" class="synopsis-photo" />
            <img src="synopsis/Synopsis-3.jpeg" alt="Desa Bekonang" class="synopsis-photo" />
          </div>
          <div id="syn-dots" class="synopsis-dots"></div>
          <div class="synopsis-nav">
            <button id="btn-syn-prev" class="synopsis-btn-prev">← Kembali</button>
            <button id="btn-syn-next" class="synopsis-btn-next">Lanjutkan →</button>
          </div>
        </div>
      </div>
    </div>

    <!-- YOUTUBE VIDEOS SCREEN (shown before 3D IPAL sim) -->
    <div class="screen hidden" id="youtube-screen">
      <div class="youtube-container">
        <div class="youtube-header">
          <div class="youtube-logo">🎬</div>
          <div>
            <div class="youtube-title" id="yt-title">Video Edukasi</div>
            <div class="youtube-subtitle" id="yt-subtitle">Tonton video berikut sebelum melanjutkan</div>
          </div>
          <div class="youtube-counter" id="yt-counter">1 / 2</div>
        </div>
        <div class="youtube-frame-wrap">
          <div id="yt-player-container"><div class="yt-loading">Memuat video…</div></div>
        </div>
        <button class="btn-primary youtube-btn-next" id="btn-yt-next">Lanjutkan →</button>
      </div>
    </div>

    <!-- INTRO VIDEO SCREEN -->
    <div class="screen hidden" id="intro-video-screen">
      <div class="intro-scene-wrap">
        <canvas id="intro-3d-canvas"></canvas>

        <!-- Title overlay top-left -->
        <div class="intro-overlay-title">
          <div class="intro-overlay-logo">🌿</div>
          <div>
            <div class="intro-overlay-h">3D BIOVINE</div>
            <div class="intro-overlay-sub">Simulasi IPAL Kawasan Industri &amp; Sistem Pengelolaan Limbah Vinasse</div>
          </div>
        </div>

        <!-- Stage label bottom-left -->
        <div id="intro-stage-label"></div>

        <!-- Continue button bottom-right -->
        <button class="btn-primary intro-btn-continue" id="btn-intro-continue">Lanjutkan ke Petunjuk →</button>
      </div>
    </div>

    <!-- STAGE SCREEN (quiz panel appended dynamically) -->
    <div class="screen hidden" id="stage-screen" style="background:transparent; pointer-events:none;"></div>

    <!-- ROOM SELECT HUB -->
    <div class="popup-overlay hidden" id="room-select-overlay">
      <div class="room-hub-card">
        <div class="room-hub-header">
          <div>
            <div class="room-hub-title">🏫 Pilih Ruangan</div>
            <div class="room-hub-sub">Kamu bisa masuk ke ruangan mana saja, dalam urutan bebas</div>
          </div>
          <div class="room-hub-meta">
            <div id="room-hub-points">🪙 0 poin</div>
            <div id="room-hub-progress">0 / 5 ruangan selesai</div>
          </div>
        </div>
        <div id="room-select-grid" class="room-select-grid"></div>
      </div>
    </div>

    <!-- RESULT POPUP -->
    <div class="popup-overlay hidden" id="result-overlay">
      <div class="popup-card">
        <div class="result-icon" id="result-icon">🎉</div>
        <h2 id="result-title">Luar Biasa!</h2>
        <div class="result-score" id="result-score">+100 poin</div>
        <p id="result-total">Total: 100 poin</p>
        <p id="result-attempts">🥇 Berhasil di percobaan pertama!</p>
        <button class="btn-primary" id="btn-result-continue">Lanjut ke Level 2 →</button>
      </div>
    </div>

    <!-- GLOSSARY MODAL -->
    <div id="glossary-modal" class="hidden">
      <div class="glossary-card">
        <button class="glossary-close" id="btn-close-glossary">✕ Tutup</button>
        <h2>📖 Buku Saku Kimia Lingkungan</h2>

        <div class="glossary-item">
          <div class="term">Vinasse</div>
          <div class="definition">Limbah cair hasil penyulingan (distilasi) fermentasi tebu menjadi etanol. Berwarna coklat kehitaman, berbau manis menyengat, sangat asam, dan kaya bahan organik seperti asam asetat, asam laktat, gliserol, fenol, dan melanoid.</div>
        </div>
        <div class="glossary-item">
          <div class="term">COD (Chemical Oxygen Demand)</div>
          <div class="definition">Jumlah oksigen yang diperlukan untuk mengurai <em>seluruh</em> bahan organik dalam air secara kimia. Nilai tinggi menandakan banyak polutan organik. Satuan: mg/L.</div>
        </div>
        <div class="glossary-item">
          <div class="term">BOD (Biochemical Oxygen Demand)</div>
          <div class="definition">Jumlah oksigen terlarut yang dibutuhkan mikroorganisme untuk mengurai bahan organik secara biologis (aerobik). Nilai tinggi = air tercemar berat. Satuan: mg/L.</div>
        </div>
        <div class="glossary-item">
          <div class="term">DO (Dissolved Oxygen)</div>
          <div class="definition">Kadar oksigen yang terlarut dalam air. DO rendah (&lt;4 mg/L) berarti air tidak sehat bagi organisme akuatik. Air bersih normal memiliki DO ≥ 6 mg/L.</div>
        </div>
        <div class="glossary-item">
          <div class="term">TDS (Total Dissolved Solids)</div>
          <div class="definition">Total padatan (ion anorganik + senyawa organik terlarut) dalam air. Satuan mg/L. Baku mutu air minum: ≤ 500 mg/L. TDS tinggi mengindikasikan pencemaran berat.</div>
        </div>
        <div class="glossary-item">
          <div class="term">pH</div>
          <div class="definition">Derajat keasaman air. pH &lt; 7 = asam; pH 7 = netral; pH &gt; 7 = basa. Limbah vinasse bersifat sangat asam (pH rendah), merusak ekosistem perairan dan tanah pertanian.</div>
        </div>
        <div class="glossary-item">
          <div class="term">Bakteri Coliform</div>
          <div class="definition">Kelompok bakteri indikator pencemaran feses/organik. Pertumbuhannya meningkat seiring naiknya BOD & COD. Berbahaya bagi kesehatan manusia, dapat menyebabkan diare hingga kematian.</div>
        </div>
        <div class="glossary-item">
          <div class="term">Bakteri Metanogenik & Asidogenik</div>
          <div class="definition">Kelompok bakteri anaerob yang ditemukan dalam limbah vinasse. Bakteri asidogenik menghasilkan asam organik, sedangkan metanogenik menghasilkan gas metana (CH₄) dalam proses fermentasi anaerob.</div>
        </div>
      </div>
    </div>
  `;

  // Profile submit
  $('btn-profile-start').onclick = () => {
    const name = $('input-name').value.trim();
    if (!name) {
      $('input-name').style.borderColor = '#e74c3c';
      $('input-name').focus();
      return;
    }
    state.playerName = name;
    hideProfileScreen();
    if (onProfileDone) onProfileDone(name);
  };

  $('input-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('btn-profile-start').click();
  });

  // Glossary close
  setTimeout(() => {
    const closeBtn = $('btn-close-glossary');
    if (closeBtn) closeBtn.onclick = () => toggleGlossary();
  }, 100);
}
