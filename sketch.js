// ================== ΣΤΑΘΕΡΕΣ ==================
const T0 = 2;
const dt = 0.01;

// ================== ΚΑΤΑΣΤΑΣΗ ==================
let ASelect, periodsSelect, phiSelect;
let pauseBtn, resetBtn;

let samples = [];
let t = 0;
let paused = false;
let totalTime = T0;

// αποθήκευση παγωμένης φάσης
let phaseFrozen = false;
let frozenPhase = 0;
let frozenPQ = null;   // {p, q}

// ================== SETUP ==================
function setup() {
  createCanvas(windowWidth, windowHeight);

  createP("Πλάτος A");
  ASelect = createSelect();
  [50, 100, 150].forEach(v => ASelect.option(v));

  createP("Αριθμός περιόδων");
  periodsSelect = createSelect();
  [1, 2, 3, 4, 5, 6].forEach(v => periodsSelect.option(v));

  createP("Αρχική φάση φ");
  phiSelect = createSelect();
  [
    ["0", 0], ["π/6", PI/6], ["π/4", PI/4], ["π/3", PI/3],
    ["π/2", PI/2], ["2π/3", 2*PI/3], ["5π/6", 5*PI/6],
    ["π", PI], ["3π/2", 3*PI/2], ["2π", 2*PI]
  ].forEach(p => phiSelect.option(p[0], p[1]));

  pauseBtn = createButton("Pause");
  pauseBtn.mousePressed(togglePause);

  resetBtn = createButton("Reset");
  resetBtn.mousePressed(resetSketch);

  resetSketch();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ================== RESET ==================
function resetSketch() {
  samples = [];
  t = 0;
  paused = false;
  phaseFrozen = false;
  frozenPQ = null;
  pauseBtn.html("Pause");

  totalTime = Number(periodsSelect.value()) * T0;
}

// ================== DRAW ==================
function draw() {
  background(255);

  let A = Number(ASelect.value());
  let phi0 = Number(phiSelect.value());
  let omega = TWO_PI / T0;

  if (!paused && t <= totalTime) {
    samples.push({
      t,
      x: A * sin(omega * t + phi0),
      u: omega * A * cos(omega * t + phi0),
      a: -omega * omega * A * sin(omega * t + phi0)
    });
    t += dt;
  }

  let plotWidth = width * 0.72;

  drawVerticalGrid(plotWidth);
  drawTimeLabels(plotWidth);

  plotSignal("x(t)", samples.map(p => p.x), A, 0, plotWidth, "blue");
  plotSignal("u(t)", samples.map(p => p.u), omega*A, height/3, plotWidth, "green");
  plotSignal("a(t)", samples.map(p => p.a), omega*omega*A, 2*height/3, plotWidth, "red");

  drawTimeCursor(plotWidth);
  drawPhaseCircle(plotWidth, omega, phi0);
}

// ================== ΔΙΑΓΡΑΜΜΑΤΑ ==================
function plotSignal(label, values, scale, yOffset, plotWidth, col) {
  let h = height / 3;
  push();
  translate(0, yOffset + h/2);

  stroke(0);
  line(0, 0, plotWidth, 0);

  stroke(col);
  noFill();
  beginShape();
  values.forEach((v, i) => {
    let x = map(samples[i].t, 0, totalTime, 0, plotWidth);
    let y = map(v, -scale, scale, h/2, -h/2);
    vertex(x, y);
  });
  endShape();

  noStroke();
  fill(0);
  text(label, 10, -h/2 + 15);
  pop();
}

// ================== ΠΛΕΓΜΑ & ΑΞΟΝΑΣ ==================
function drawVerticalGrid(plotWidth) {
  stroke(180);
  drawingContext.setLineDash([6, 6]);
  for (let tt = 0; tt <= totalTime; tt += T0/4) {
    let x = map(tt, 0, totalTime, 0, plotWidth);
    line(x, 0, x, height);
  }
  drawingContext.setLineDash([]);
}

function drawTimeLabels(plotWidth) {
  fill(0);
  noStroke();

  for (let tt = 0; tt <= totalTime; tt += T0/4) {
    let x = map(tt, 0, totalTime, 0, plotWidth);
    let k = tt / (T0/4);
    let label = (k % 4 === 0) ? (k/4) + "T" : k + "T/4";
    text(label, x + 2, height - 4);
  }
}

function drawTimeCursor(plotWidth) {
  stroke("red");
  let x = map(t, 0, totalTime, 0, plotWidth);
  line(x, 0, x, height);
}

// ================== ΚΥΚΛΟΣ ΦΑΣΗΣ ==================
function drawPhaseCircle(plotWidth, omega, phi0) {
  let sideW = width - plotWidth;
  let cx = plotWidth + sideW / 2;
  let cy = height / 2;
  let R = min(sideW, height) * 0.28;

  let theta = omega * t + phi0;

  push();
  translate(cx, cy);

  stroke(0);
  noFill();
  circle(0, 0, 2*R);
  line(-R, 0, R, 0);
  line(0, -R, 0, R);

  stroke("red");
  line(0, 0, R*cos(theta), -R*sin(theta));
  fill("red");
  circle(R*cos(theta), -R*sin(theta), R*0.08);

  // ----- ΕΜΦΑΝΙΣΗ ΦΑΣΗΣ & ΧΡΟΝΟΥ -----
  if (phaseFrozen && frozenPQ) {
    noStroke();
    fill(0);
    textSize(14);

    let p = frozenPQ.p;
    let q = frozenPQ.q;

    let phiText = (q === 1) ? `${p}π` : `${p}π/${q}`;
    let tText   = `${p}T/${2*q}`;

    text(`φ = ${phiText}`,   -R*0.9, -R*1.2);
    text(`t = ${tText}`,     -R*0.9, -R*1.0);
  }

  pop();
}

// ================== ΚΛΙΚ ΣΤΟ ΚΟΚΚΙΝΟ ΣΗΜΑΔΙ ==================
function mousePressed() {
  if (!paused) return;

  let plotWidth = width * 0.72;
  let sideW = width - plotWidth;
  let cx = plotWidth + sideW / 2;
  let cy = height / 2;
  let R = min(sideW, height) * 0.28;

  let omega = TWO_PI / T0;
  let phi0 = Number(phiSelect.value());
  frozenPhase = omega * t + phi0;

  let result = phaseToPiFraction(frozenPhase, 24);
  frozenPQ = result;

  let px = cx + R * cos(frozenPhase);
  let py = cy - R * sin(frozenPhase);

  if (dist(mouseX, mouseY, px, py) < R * 0.15) {
    phaseFrozen = true;
  }
}

// ================== PAUSE ==================
function togglePause() {
  paused = !paused;
  phaseFrozen = false;
  frozenPQ = null;
  pauseBtn.html(paused ? "Resume" : "Pause");
}

// ================== ΦΑΣΗ → pπ/q ==================
function phaseToPiFraction(theta, maxDen = 24) {
  let x = theta / PI;
  let bestP = 0, bestQ = 1, minErr = Infinity;

  for (let q = 1; q <= maxDen; q++) {
    let p = Math.round(x * q);
    let err = abs(x - p / q);
    if (err < minErr) {
      minErr = err;
      bestP = p;
      bestQ = q;
    }
  }

  let g = gcd(abs(bestP), bestQ);
  return { p: bestP/g, q: bestQ/g };
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}
