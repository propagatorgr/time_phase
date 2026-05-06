/****************************************************
 * Απλή Αρμονική Ταλάντωση – Τελική Έκδοση
 * Επιλογή περιόδου Τ από drop-down
 ****************************************************/

/* ======= ΣΤΑΘΕΡΕΣ ======= */
const DT = 0.01;
const TWO_PI_JS = 2 * Math.PI;

/* ======= ΚΑΤΑΣΤΑΣΗ ======= */
let ASelect, periodsSelect, phiSelect, TSelect;
let pauseBtn, resetBtn;

let samples = [];
let thetaRel = 0;     // σχετική φάση
let t = 0;
let paused = false;

let T0 = 2;           // ✅ ΠΕΡΙΟΔΟΣ (αλλάζει από menu)
let totalThetaRel = TWO_PI_JS;
let totalTime = T0;

let marginLeft = 0;

// Pause ενδείξεις
let showValues = false;
let frozenPQ = null;

/* ======= SETUP ======= */
function setup() {
  const canvas = createCanvas(windowWidth * 0.9, windowHeight * 0.9);
  canvas.parent("canvas-holder");

  marginLeft = width * 0.07;

  /* -------- Controls -------- */

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

  /* ✅ ΝΕΟ: Επιλογή περιόδου Τ */
  createP("Περίοδος Τ").parent("controls");
  TSelect = createSelect().parent("controls");
  [
    ["T = 1 s", 1],
    ["T = 2 s", 2],
    ["T = 4 s", 4]
  ].forEach(p => TSelect.option(p[0], p[1]));

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
  thetaRel = 0;
  t = 0;
  paused = false;
  showValues = false;
  frozenPQ = null;
  pauseBtn.html("Pause");

  T0 = Number(TSelect.value());      // ✅ ΠΑΡΑΜΕΤΡΟΣ ΑΠΟ MENU
  const N = Number(periodsSelect.value());

  totalTime = N * T0;
  totalThetaRel = N * TWO_PI_JS;
}

/* ======= DRAW ======= */
function draw() {
  background(255);

  const A = Number(ASelect.value());
  const phi0 = Number(phiSelect.value());
  const omega = TWO_PI_JS / T0;      // ✅ ΌΛΑ ΑΠΟ Τ0
  const plotWidth = width * 0.65;

  if (!paused && thetaRel <= totalThetaRel + 1e-9) {
    const phiTotal = phi0 + thetaRel;

    samples.push({
      t: t,
      x: A * Math.sin(phiTotal),
      u: omega * A * Math.cos(phiTotal),
      a: -omega * omega * A * Math.sin(phiTotal)
    });

    thetaRel += omega * DT;
    t = thetaRel / omega;
  }

  drawVerticalGrid(plotWidth);
  drawTimeLabels(plotWidth);

  plotSignal("x(t)", s => s.x, A,                 0,            plotWidth, "blue");
  plotSignal("u(t)", s => s.u, omega * A,         height/3,     plotWidth, "green");
  plotSignal("a(t)", s => s.a, omega*omega*A,     2*height/3,   plotWidth, "red");

  drawTimeCursor(plotWidth);
  drawPhaseCircle(plotWidth, phi0);
}

/* ======= ΔΙΑΓΡΑΜΜΑ ======= */
function plotSignal(label, f, scale, yOffset, plotWidth, col) {
  const h = height / 3;

  push();
  translate(0, yOffset + h / 2);

  stroke(180);
  line(marginLeft, 0, plotWidth, 0);

  if (samples.length > 0) {
    const initVal = f(samples[0]);
    const yInit = map(initVal, -scale, scale, h/2, -h/2);

    stroke(150);
    drawingContext.setLineDash([6,6]);
    line(marginLeft, yInit, plotWidth, yInit);
    drawingContext.setLineDash([]);

    noStroke();
    fill(0);
    if (label === "x(t)") text(`x₀ = ${initVal.toFixed(1)}`, marginLeft - 60, yInit + 4);
    if (label === "u(t)") text(`u₀ = ${initVal.toFixed(1)}`, marginLeft - 60, yInit + 4);
    if (label === "a(t)") text(`a₀ = ${initVal.toFixed(1)}`, marginLeft - 60, yInit + 4);
  }

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

/* ======= ΠΛΕΓΜΑ & ΑΞΟΝΑΣ ΧΡΟΝΟΥ ======= */
function drawVerticalGrid(plotWidth) {
  stroke(180);
  drawingContext.setLineDash([6,6]);
  for (let tt = 0; tt <= totalTime + 1e-9; tt += T0/4) {
    const x = map(tt, 0, totalTime, marginLeft, plotWidth);
    line(x, 0, x, height);
  }
  drawingContext.setLineDash([]);
}

function drawTimeLabels(plotWidth) {
  fill(0);
  noStroke();
  for (let tt = 0; tt <= totalTime + 1e-9; tt += T0/4) {
    const x = map(tt, 0, totalTime, marginLeft, plotWidth);
    const k = tt / (T0/4);
    let label = (k === 0) ? "0" : (k % 4 === 0 ? (k/4)+"T" : k+"T/4");
    text(label, x - 10, height - 8);
  }
}

/* ======= ΔΕΙΚΤΗΣ ΧΡΟΝΟΥ ======= */
function drawTimeCursor(plotWidth) {
  stroke("red");
  const x = map(t, 0, totalTime, marginLeft, plotWidth);
  line(x, 0, x, height);
}

/* ======= ΚΥΚΛΟΣ ΦΑΣΗΣ ======= */
function drawPhaseCircle(plotWidth, phi0) {
  const cx = plotWidth + (width - plotWidth)/2;
  const cy = height/2;
  const R  = Math.min(width - plotWidth, height) * 0.28;

  const phiTotal = phi0 + Math.min(thetaRel, totalThetaRel);

  push();
  translate(cx,cy);

  stroke(0);
  noFill();
  circle(0,0,2*R);
  line(-R,0,R,0);
  line(0,-R,0,R);

  stroke("red");
  line(0,0,R*Math.cos(phiTotal),-R*Math.sin(phiTotal));
  fill("red");
  circle(R*Math.cos(phiTotal),-R*Math.sin(phiTotal),R*0.08);

  pop();
}

/* ======= CONTROLS ======= */
function togglePause() {
  paused = !paused;
  pauseBtn.html(paused ? "Resume" : "Pause");
}
