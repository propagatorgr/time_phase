/****************************************************
 * Απλή Αρμονική Ταλάντωση – Τελική Έκδοση
 * Ακριβής φάση + ενδείξεις φ και t στο Pause
 ****************************************************/

/* ======= ΣΤΑΘΕΡΕΣ (ΚΑΘΑΡΗ JS) ======= */
const T0 = 2;
const DT = 0.01;
const TWO_PI_JS = 2 * Math.PI;

/* ======= ΚΑΤΑΣΤΑΣΗ ======= */
let ASelect, periodsSelect, phiSelect;
let pauseBtn, resetBtn;

let samples = [];
let theta = 0;      // φάση (rad) – πρωτογενής
let t = 0;
let paused = false;

let totalTheta = TWO_PI_JS;
let totalTime = T0;

let marginLeft = 0;

// για ενδείξεις στο Pause
let showValues = false;
let frozenPQ = null;   // {p, q}

/* ======= SETUP ======= */
function setup() {
  const canvas = createCanvas(windowWidth * 0.9, windowHeight * 0.9);
  canvas.parent("canvas-holder");

  marginLeft = width * 0.07;

  createP("Πλάτος A").parent("controls");
  ASelect = createSelect().parent("controls");
  [50, 100, 150].forEach(v => ASelect.option(v));

  createP("Αριθμός περιόδων").parent("controls");
  periodsSelect = createSelect().parent("controls");
  [1, 2, 3, 4, 5, 6].forEach(v => periodsSelect.option(v));

  createP("Αρχική φάση φ").parent("controls");
  phiSelect = createSelect().parent("controls");
  [
    ["0", 0],
    ["π/6", Math.PI/6],
    ["π/4", Math.PI/4],
    ["π/3", Math.PI/3],
    ["π/2", Math.PI/2],
    ["2π/3", 2*Math.PI/3],
    ["5π/6", 5*Math.PI/6],
    ["π", Math.PI],
    ["3π/2", 3*Math.PI/2],
    ["2π", 2*Math.PI]
  ].forEach(p => phiSelect.option(p[0], p[1]));

  pauseBtn = createButton("Pause").parent("controls");
  pauseBtn.mousePressed(togglePause);

  resetBtn = createButton("Reset").parent("controls");
  resetBtn.mousePressed(resetSketch);

  resetSketch();
}

/* ======= RESIZE ======= */
function windowResized() {
  resizeCanvas(windowWidth * 0.9, windowHeight * 0.9);
  marginLeft = width * 0.07;
}

/* ======= RESET ======= */
function resetSketch() {
  samples = [];
  theta = Number(phiSelect.value());
  t = 0;
  paused = false;
  showValues = false;
  frozenPQ = null;
  pauseBtn.html("Pause");

  const N = Number(periodsSelect.value());
  totalTheta = N * TWO_PI_JS;
  totalTime  = N * T0;
}

/* ======= DRAW ======= */
function draw() {
  background(255);

  const A = Number(ASelect.value());
  const omega = TWO_PI_JS / T0;
  const plotWidth = width * 0.65;

  if (!paused && theta <= totalTheta + 1e-9) {
    samples.push({
      t: t,
      x: A * Math.sin(theta),
      u: omega * A * Math.cos(theta),
      a: -omega * omega * A * Math.sin(theta)
    });

    theta += omega * DT;
    t = theta / omega;
  }

  drawVerticalGrid(plotWidth);
  drawTimeLabels(plotWidth);

  plotSignal("x(t)", s => s.x, A,                 0,            plotWidth, "blue");
  plotSignal("u(t)", s => s.u, omega * A,         height/3,     plotWidth, "green");
  plotSignal("a(t)", s => s.a, omega*omega*A,     2*height/3,   plotWidth, "red");

  drawTimeCursor(plotWidth);
  drawPhaseCircle(plotWidth);
}

/* ======= ΔΙΑΓΡΑΜΜΑ ======= */
function plotSignal(label, f, scale, yOffset, plotWidth, col) {
  const h = height / 3;
  push();
  translate(0, yOffset + h/2);

  stroke(180);
  line(marginLeft, 0, plotWidth, 0);

  stroke(col);
  noFill();
  beginShape();
  for (const s of samples) {
    const x = map(s.t, 0, totalTime, marginLeft, plotWidth);
    const y = map(f(s), -scale, scale, h/2, -h/2);
    vertex(x, y);
  }
  endShape();

  noStroke();
  fill(0);
  text(label, marginLeft + 5, -h/2 + 15);
  pop();
}

/* ======= ΠΛΕΓΜΑ ======= */
function drawVerticalGrid(plotWidth) {
  stroke(180);
  drawingContext.setLineDash([6,6]);
  for (let tt = 0; tt <= totalTime + 1e-9; tt += T0/4) {
    const x = map(tt, 0, totalTime, marginLeft, plotWidth);
    line(x, 0, x, height);
  }
  drawingContext.setLineDash([]);
}

/* ======= ΕΝΔΕΙΞΕΙΣ ΧΡΟΝΟΥ ======= */
function drawTimeLabels(plotWidth) {
  fill(0);
  noStroke();
  textSize(12);
  for (let tt = 0; tt <= totalTime + 1e-9; tt += T0/4) {
    const x = map(tt, 0, totalTime, marginLeft, plotWidth);
    const k = tt / (T0/4);
    let label = (k === 0) ? "0" : (k % 4 === 0 ? (k/4)+"T" : k+"T/4");
    text(label, x - 10, height - 8);
  }
}

/* ======= ΧΡΟΝΙΚΟΣ ΔΕΙΚΤΗΣ ======= */
function drawTimeCursor(plotWidth) {
  stroke("red");
  const x = map(t, 0, totalTime, marginLeft, plotWidth);
  line(x, 0, x, height);
}

/* ======= ΚΥΚΛΟΣ ΦΑΣΗΣ ======= */
function drawPhaseCircle(plotWidth) {
  const cx = plotWidth + (width - plotWidth) / 2;
  const cy = height / 2;
  const R  = Math.min(width - plotWidth, height) * 0.28;

  const th = Math.min(theta, totalTheta);

  push();
  translate(cx, cy);

  stroke(0);
  noFill();
  circle(0,0,2*R);
  line(-R,0,R,0);
  line(0,-R,0,R);

  stroke("red");
  line(0,0,R*Math.cos(th),-R*Math.sin(th));
  fill("red");
  circle(R*Math.cos(th),-R*Math.sin(th),R*0.08);

  if (showValues && frozenPQ) {
    noStroke();
    fill("red");
    textSize(14);
    text(`φ = ${frozenPQ.p}π/${frozenPQ.q}`, -R, -R - 20);
    text(`t = ${frozenPQ.p}T/${2*frozenPQ.q}`, -R, -R);
  }
  pop();
}

/* ======= CONTROLS ======= */
function togglePause() {
  paused = !paused;
  pauseBtn.html(paused ? "Resume" : "Pause");

  if (paused) {
    frozenPQ = phaseToFraction(theta);
    showValues = true;
  } else {
    showValues = false;
  }
}

/* ======= ΒΟΗΘΗΤΙΚΟ ======= */
function phaseToFraction(th) {
  const x = th / Math.PI;
  let best = {p:0, q:1, err:1e9};

  for (let q = 1; q <= 24; q++) {
    const p = Math.round(x * q);
    const err = Math.abs(x - p/q);
    if (err < best.err) best = {p, q, err};
  }

  const g = gcd(Math.abs(best.p), best.q);
  return {p: best.p/g, q: best.q/g};
}

function gcd(a,b){ return b ? gcd(b,a%b) : a; }
