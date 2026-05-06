const DT = 0.01;
const TWO_PI = 2 * Math.PI;

let ASelect, periodsSelect, phiSelect, TSelect;
let pauseBtn, resetBtn;

let samples = [];
let t = 0;
let paused = false;

let T = 2;
let tMax = 2;

// για πραγματικό Pause
let frozenT = 0;
let frozenPhi = 0;

function setup() {
  const holder = document.getElementById("canvas-holder");
  const c = createCanvas(holder.clientWidth, holder.clientHeight);
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
    ["0", 0],
    ["π/6", Math.PI / 6],
    ["π/4", Math.PI / 4],
    ["π/3", Math.PI / 3],
    ["π/2", Math.PI / 2],
    ["2π/3", 2 * Math.PI / 3],
    ["π", Math.PI],
    ["3π/2", 3 * Math.PI / 2],
    ["2π", 2 * Math.PI]
  ].forEach(p => phiSelect.option(p[0], p[1]));

  createP("Περίοδος T").parent("controls");
  TSelect = createSelect().parent("controls");
  [["T = 1 s", 1], ["T = 2 s", 2], ["T = 4 s", 4]]
    .forEach(p => TSelect.option(p[0], p[1]));

  pauseBtn = createButton("Pause").parent("controls");
  pauseBtn.mousePressed(togglePause);

  resetBtn = createButton("Reset").parent("controls");
  resetBtn.mousePressed(resetSketch);

  resetSketch();
}

function windowResized() {
  const holder = document.getElementById("canvas-holder");
  resizeCanvas(holder.clientWidth, holder.clientHeight);
}

function resetSketch() {
  samples = [];
  t = 0;
  paused = false;
  frozenT = 0;
  frozenPhi = 0;

  T = Number(TSelect.value());
  tMax = Number(periodsSelect.value()) * T;
}

function togglePause() {
  paused = !paused;

  if (paused && samples.length > 0) {
    frozenT = samples[samples.length - 1].t;
    frozenPhi = samples[samples.length - 1].phi;
  }
}

function draw() {
  background(255);

  const A = Number(ASelect.value());
  const phi0 = Number(phiSelect.value());
  const omega = TWO_PI / T;

  if (!paused && t <= tMax + 1e-9) {
    const phiRaw = phi0 + omega * t;
    const phi = ((phiRaw % TWO_PI) + TWO_PI) % TWO_PI;

    samples.push({
      t,
      x: A * sin(phi),
      u: omega * A * cos(phi),
      a: -omega * omega * A * sin(phi),
      phi
    });

    t += DT;
  }

  drawPlots();
  drawPhaseCircle();
}

function drawPlots() {
  const h = height / 3;
  const left = 60;
  const right = width - 220;

  for (let i = 1; i < samples.length; i++) {
    const s0 = samples[i - 1];
    const s1 = samples[i];

    const x0 = map(s0.t, 0, tMax, left, right);
    const x1 = map(s1.t, 0, tMax, left, right);

    stroke("blue");
    line(x0, h / 2 - s0.x, x1, h / 2 - s1.x);

    stroke("green");
    line(x0, h + h / 2 - s0.u / 10, x1, h + h / 2 - s1.u / 10);

    stroke("red");
    line(x0, 2 * h + h / 2 - s0.a / 50, x1, 2 * h + h / 2 - s1.a / 50);
  }
}

function drawPhaseCircle() {
  const R = 120;
  const cx = width - 120;
  const cy = height / 2;

  stroke(0);
  noFill();
  circle(cx, cy, 2 * R);
  line(cx - R, cy, cx + R, cy);
  line(cx, cy - R, cx, cy + R);

  if (samples.length > 0) {
    const phi = paused ? frozenPhi : samples[samples.length - 1].phi;
    stroke("red");
    line(cx, cy, cx + R * cos(phi), cy - R * sin(phi));
    fill("red");
    circle(cx + R * cos(phi), cy - R * sin(phi), 8);

    if (paused) {
      noStroke();
      fill("red");
      text(`φ = ${(phi / Math.PI).toFixed(2)}π`, cx - R, cy - R - 16);
      text(`t = ${frozenT.toFixed(2)} s`, cx - R, cy - R);
    }
  }
}
