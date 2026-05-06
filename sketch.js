// ===================================================
// ΑΠΛΗ ΑΡΜΟΝΙΚΗ ΤΑΛΑΝΤΩΣΗ – ΤΕΛΙΚΗ ΕΚΔΟΣΗ ΑΝΑΦΟΡΑΣ
// ===================================================

const DT = 0.01;
const TWO_PI = 2 * Math.PI;

// -------- layout χώρος ----------
const LEFT_MARGIN = 130;
const TOP_MARGIN  = 60;

// -------- controls --------------
let ASelect, periodsSelect, phiSelect, TSelect;
let pauseBtn, resetBtn;

// -------- κατάσταση -------------
let samples = [];
let t = 0;
let paused = false;

let T = 2;
let tMax = 2;

let showPauseValues = false;

// ===================================================
function setup() {
  
const c = createCanvas(
    document.getElementById("canvas-holder").clientWidth,
    document.getElementById("canvas-holder").clientHeight
  );
  c.parent("canvas-holder");

  // ΠΟΛΥ ΣΗΜΑΝΤΙΚΟ: όλα τα controls εδώ
  createP("Πλάτος A").parent("controls");
  ASelect = createSelect().parent("controls");

   createP("Αριθμός περιόδων");
  periodsSelect = createSelect();
  [1, 2, 3, 4].forEach(v => periodsSelect.option(v));

  createP("Αρχική φάση φ");
  phiSelect = createSelect();
  [
    ["0", 0],
    ["π/6", Math.PI/6],
    ["π/4", Math.PI/4],
    ["π/3", Math.PI/3],
    ["π/2", Math.PI/2],
    ["2π/3", 2*Math.PI/3],
    ["3π/4", 3*Math.PI/4],
    ["5π/6", 5*Math.PI/6],
    ["π", Math.PI],
    ["7π/6", 7*Math.PI/6],
    ["4π/3", 4*Math.PI/3],
    ["3π/2", 3*Math.PI/2],
    ["2π", 2*Math.PI]
  ].forEach(p => phiSelect.option(p[0], p[1]));

  createP("Περίοδος T");
  TSelect = createSelect();
  [["T = 1 s",1], ["T = 2 s",2], ["T = 4 s",4]]
    .forEach(p => TSelect.option(p[0], p[1]));

  pauseBtn = createButton("Pause");
  pauseBtn.mousePressed(togglePause);

  resetBtn = createButton("Reset");
  resetBtn.mousePressed(resetSketch);

  resetSketch();
}

// ===================================================
function resetSketch() {
  samples = [];
  t = 0;
  paused = false;
  showPauseValues = false;

  T = Number(TSelect.value());
  const N = Number(periodsSelect.value());
  tMax = N * T;
}

// ===================================================
function draw() {
  background(255);

  const A = Number(ASelect.value());
  const phi0 = Number(phiSelect.value());
  const omega = TWO_PI / T;
  const plotWidth = width * 0.62;

  if (!paused && t <= tMax + 1e-9) {
    const phiRaw = phi0 + omega * t;
    const phi = ((phiRaw % TWO_PI) + TWO_PI) % TWO_PI;

    samples.push({
      t,
      x: A * Math.sin(phi),
      u: omega * A * Math.cos(phi),
      a: -omega * omega * A * Math.sin(phi),
      phi
    });

    t += DT;
  }

  drawVerticalGrid(plotWidth);
  drawTimeLabels(plotWidth);

  plotSignal("x(t)", s=>s.x, A,               0,          plotWidth, "blue");
  plotSignal("u(t)", s=>s.u, omega*A,         height/3,   plotWidth, "green");
  plotSignal("a(t)", s=>s.a, omega*omega*A,   2*height/3, plotWidth, "red");

  drawTimeCursor(plotWidth);
  drawPhaseCircle(plotWidth, phi0);
}

// ===================================================
function plotSignal(label, f, scale, yOff, plotWidth, col) {
  const h = height/3;
  push();
  translate(LEFT_MARGIN, TOP_MARGIN + yOff + h/2);

  stroke(180);
  line(0, 0, plotWidth, 0);

  if (samples.length > 0) {
    const v0 = f(samples[0]);
    const y0 = map(v0, -scale, scale, h/2, -h/2);
    drawingContext.setLineDash([6,6]);
    line(0, y0, plotWidth, y0);
    drawingContext.setLineDash([]);
    noStroke();
    fill(0);
    text(`${label[0]}₀ = ${v0.toFixed(1)}`,
         -LEFT_MARGIN + 15, y0 + 4);
  }

  stroke(col);
  noFill();
  beginShape();
  samples.forEach(s=>{
    const x = map(s.t, 0, tMax, 0, plotWidth);
    const y = map(f(s), -scale, scale, h/2, -h/2);
    vertex(x, y);
  });
  endShape();
  pop();
}

// ===================================================
function drawVerticalGrid(plotWidth) {
  drawingContext.setLineDash([6,6]);
  for (let tt=0; tt<=tMax+1e-9; tt+=T/4) {
    const x = LEFT_MARGIN + map(tt, 0, tMax, 0, plotWidth);
    line(x, TOP_MARGIN, x, height);
  }
  drawingContext.setLineDash([]);
}

function drawTimeLabels(plotWidth) {
  fill(0);
  noStroke();
  for (let tt=0; tt<=tMax+1e-9; tt+=T/4) {
    const x = LEFT_MARGIN + map(tt, 0, tMax, 0, plotWidth);
    const k = tt / (T/4);
    text(k%4===0 ? `${k/4}T` : `${k}T/4`, x-12, height-8);
  }
}

function drawTimeCursor(plotWidth) {
  stroke("red");
  const x = LEFT_MARGIN + map(t, 0, tMax, 0, plotWidth);
  line(x, TOP_MARGIN, x, height);
}

// ===================================================
function drawPhaseCircle(plotWidth, phi0) {
  const cx = LEFT_MARGIN + plotWidth +
             (width - LEFT_MARGIN - plotWidth)/2;
  const cy = height/2;
  const R  = min(width - LEFT_MARGIN - plotWidth, height) * 0.28;

  let phi = phi0;
  if (samples.length > 0) phi = samples[samples.length-1].phi;

  push();
  translate(cx, cy);
  noFill();
  stroke(0);
  circle(0,0,2*R);
  line(-R,0,R,0);
  line(0,-R,0,R);

  stroke("red");
  line(0,0,R*cos(phi),-R*sin(phi));
  fill("red");
  circle(R*cos(phi),-R*sin(phi),8);

  if (showPauseValues) {
    noStroke();
    fill("red");
    text(`φ = ${(phi/Math.PI).toFixed(2)}π`, -R, -R-20);
    text(`t = ${(samples.at(-1).t).toFixed(2)} s`, -R, -R);
  }
  pop();
}

// ===================================================
function togglePause() {
  paused = !paused;
  showPauseValues = paused;
}
