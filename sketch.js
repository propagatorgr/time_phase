/****************************************************
 * Απλή Αρμονική Ταλάντωση – Καθαρή Τελική Έκδοση
 ****************************************************/

const TWO_PI = 2 * Math.PI;
const DT = 0.01;

// ---------- LAYOUT ----------
const LEFT = 80;
const TOP = 40;
const BOTTOM = 40;
const RIGHT_PANEL = 260;
const MIN_CANVAS_HEIGHT = 760;

// ---------- CONTROLS ----------
let ASelect, periodsSelect, phiSelect, TSelect;
let pauseBtn, resetBtn;

// ---------- STATE ----------
let samples = [];
let t = 0;
let paused = false;
let frozen = null;
let useTimeCircle = true;   // true: Δt–Δφ, false: φ–t
let T = 2;
let tMax = 2;

// ================= SETUP =================
function setup() {
  const holder = document.getElementById("canvas-holder");
  const h = Math.max(holder.clientHeight, MIN_CANVAS_HEIGHT);
  const c = createCanvas(holder.clientWidth, h);
  c.parent("canvas-holder");

  createP("Πλάτος A").parent("controls");
  ASelect = createSelect().parent("controls");
  [50, 100, 150].forEach(v => ASelect.option(v));

  createP("Αριθμός περιόδων").parent("controls");
  periodsSelect = createSelect().parent("controls");
  [1, 2, 3, 4].forEach(v => periodsSelect.option(v));

  createP("Αρχική φάση φ").parent("controls");
  phiSelect = createSelect().parent("controls");
  [
    ["0",0],["π/6",Math.PI/6],["π/4",Math.PI/4],["π/3",Math.PI/3],
    ["π/2",Math.PI/2],["2π/3",2*Math.PI/3],["3π/4",3*Math.PI/4],
    ["5π/6",5*Math.PI/6],["π",Math.PI],["7π/6",7*Math.PI/6],
    ["4π/3",4*Math.PI/3],["3π/2",3*Math.PI/2],
    ["5π/3",5*Math.PI/3],["11π/6",11*Math.PI/6],["2π",2*Math.PI]
  ].forEach(p => phiSelect.option(p[0], p[1]));

  createP("Περίοδος T").parent("controls");
  TSelect = createSelect().parent("controls");
  [["T = 1 s",1],["T = 2 s",2],["T = 4 s",4]]
    .forEach(p => TSelect.option(p[0], p[1]));
  const timeCircleCheckbox = createCheckbox(
  "Χρονική ερμηνεία κύκλου (Δt – Δφ)",
  true
);
timeCircleCheckbox.parent("controls");

timeCircleCheckbox.changed(() => {
  useTimeCircle = timeCircleCheckbox.checked();
});
  pauseBtn = createButton("Pause").parent("controls").mousePressed(togglePause);
  resetBtn = createButton("Reset").parent("controls").mousePressed(resetSketch);

  resetSketch();
}

// ================= RESIZE =================
function windowResized() {
  const holder = document.getElementById("canvas-holder");
  const h = Math.max(holder.clientHeight, MIN_CANVAS_HEIGHT);
  resizeCanvas(holder.clientWidth, h);
}

// ================= RESET =================
function resetSketch() {
  samples = [];
  t = 0;
  paused = false;
  frozen = null;

  pauseBtn.html("Pause");

  T = Number(TSelect.value());
  tMax = Number(periodsSelect.value()) * T;
}

// ================= PAUSE / RESUME =================
function togglePause() {
  paused = !paused;
  pauseBtn.html(paused ? "Resume" : "Pause");

  if (paused && samples.length > 0) {
    frozen = samples[samples.length - 1];
  } else {
    frozen = null;
  }
}

// ================= DRAW =================
function draw() {
  background(255);

  const A = Number(ASelect.value());
  const phi0 = Number(phiSelect.value());
  const omega = TWO_PI / T;

  if (!paused && t <= tMax + 1e-9) {
    const phi = (phi0 + omega * t) % TWO_PI;
    const x = A * sin(phi);
    const u = omega * A * cos(phi);
    const a = -omega * omega * x;

    samples.push({ t, phi, x, u, a });
    t += DT;
  }

  drawTimeGrid();
  drawTimeCursor();
  drawSignals(A);
  drawPhaseCircle();
  drawTimeLabels();
}

// ================= TIME GRID =================
function drawTimeGrid() {
  const right = width - RIGHT_PANEL;
  stroke(180);
  drawingContext.setLineDash([6,6]);

  for (let tt = 0; tt <= tMax + 1e-9; tt += T/4) {
    const x = map(tt, 0, tMax, LEFT, right);
    line(x, TOP, x, height - BOTTOM);
  }
  drawingContext.setLineDash([]);
}

// ================= TIME LABELS =================
function drawTimeLabels() {
  const right = width - RIGHT_PANEL;
  const y = height - BOTTOM + 20;

  fill(0);
  noStroke();
  textSize(12);
  textAlign(CENTER, TOP);

  for (let tt = 0; tt <= tMax + 1e-9; tt += T/4) {
    const x = map(tt, 0, tMax, LEFT, right);
    const k = Math.round(tt / (T/4));

    let label;
    if (k === 0) label = "0";
    else if (k === 4) label = "T";
    else if (k % 4 === 0) label = `${k/4}T`;
    else label = `${k}T/4`;

    text(label, x, y);
  }
}

// ================= TIME CURSOR =================
function drawTimeCursor() {
  const right = width - RIGHT_PANEL;
  const tt = paused && frozen ? frozen.t : t;
  const x = map(tt, 0, tMax, LEFT, right);

  stroke("red");
  strokeWeight(1.5);
  line(x, TOP, x, height - BOTTOM);
  strokeWeight(1);
}

// ================= SIGNALS =================
function drawSignals(A) {
  const usableHeight = height - TOP - BOTTOM;
  const h = usableHeight / 3;
  const right = width - RIGHT_PANEL;

  const scales = {
    x: A,
    u: (TWO_PI / T) * A,
    a: (TWO_PI / T) ** 2 * A
  };

  const colors = { x:"blue", u:"green", a:"red" };
  const keys = ["x", "u", "a"];

  keys.forEach((k, i) => {
    push();
    translate(LEFT, TOP + i*h + h/2);

    stroke(150);
    line(0, 0, right - LEFT, 0);

    if (samples.length > 0) {
      const v0 = samples[0][k];
      const y0 = map(v0, -scales[k], scales[k], h/2, -h/2);
      drawingContext.setLineDash([6,6]);
      line(0, y0, right - LEFT, y0);
      drawingContext.setLineDash([]);
      fill(0);
      noStroke();
      text(`${k}₀ = ${v0.toFixed(2)}`, -40, y0 + 4);
    }

    stroke(colors[k]);
    noFill();
    beginShape();
    samples.forEach(s => {
      const x = map(s.t, 0, tMax, 0, right - LEFT);
      const y = map(s[k], -scales[k], scales[k], h/2, -h/2);
      vertex(x, y);
    });
    endShape();
    pop();
  });
}

// ================= PHASE / TIME CIRCLE =================
function drawPhaseCircle() {
  if (samples.length === 0) return;

  const state = paused && frozen ? frozen : samples[samples.length - 1];
  let theta;

if (useTimeCircle) {
  // Χρονικός κύκλος (Δt → Δφ)
  theta = TWO_PI * (state.t / T);
} else {
  // Κλασικός φ–t κύκλος
  theta = state.phi;
}

  const cx = width - RIGHT_PANEL / 2;
  const cy = height / 2;
  const R  = 100;

  stroke(0);
  fill(255);
  ellipse(cx, cy, 2*R, 2*R);
  line(cx-R, cy, cx+R, cy);
  line(cx, cy-R, cx, cy+R);

  stroke("red");
  line(cx, cy, cx + R*cos(theta), cy - R*sin(theta));

  fill("red");
  noStroke();
  circle(cx + R*cos(theta), cy - R*sin(theta), 8);

  if (paused) {
  fill("red");
  textAlign(LEFT, TOP);
  textSize(12);

  if (useTimeCircle) {
    const fracT = timeToFraction(state.t);
    text(`Δt = ${fracT.p}T/${fracT.q}`, cx - R, cy - R - 22);
    text(`Δφ = ${2*fracT.p}π/${fracT.q}`, cx - R, cy - R - 6);
  } else {
    const fracPhi = phiToFraction(state.phi);
    const fracT = timeToFraction(state.t);
    text(`φ = ${fracPhi.p}π/${fracPhi.q}`, cx - R, cy - R - 22);
    text(`t = ${fracT.p}T/${fracT.q}`, cx - R, cy - R - 6);
  }
}
}

// ================= HELPERS =================
function timeToFraction(t) {
  let best = { p: 0, q: 1, err: 1e9 };
  const x = t / T;

  for (let q = 1; q <= 24; q++) {
    const p = Math.round(x * q);
    const err = Math.abs(x - p / q);
    if (err < best.err) best = { p, q, err };
  }

  const g = gcd(Math.abs(best.p), best.q);
  return { p: best.p/g, q: best.q/g };
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}
