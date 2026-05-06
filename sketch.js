/****************************************************
 * Απλή Αρμονική Ταλάντωση – ΤΕΛΙΚΗ ΣΩΣΤΗ ΕΚΔΟΣΗ
 ****************************************************/

const DT = 0.01;
const TWO_PI = 2 * Math.PI;

// ====== LAYOUT ======
const LEFT_MARGIN = 120;   // χώρος για x0, u0, a0
const TOP_MARGIN  = 50;    // χώρος πάνω

// ====== CONTROLS ======
let ASelect, periodsSelect, phiSelect, TSelect;
let pauseBtn, resetBtn;

// ====== STATE ======
let samples = [];
let thetaRel = 0;
let t = 0;
let paused = false;

let T0 = 2;
let totalT = 2;
let totalTheta = TWO_PI;

// Pause info
let showValues = false;
let frozenPhase = 0;
let frozenTime = 0;

function setup() {
  const canvas = createCanvas(windowWidth * 0.95, windowHeight * 0.95);
  canvas.parent("canvas-holder");

  // ----- Controls -----
  createP("Πλάτος A").parent("controls");
  ASelect = createSelect().parent("controls");
  [50, 100, 150].forEach(v => ASelect.option(v));

  createP("Αριθμός περιόδων").parent("controls");
  periodsSelect = createSelect().parent("controls");
  [1,2,3,4].forEach(v => periodsSelect.option(v));

  createP("Αρχική φάση φ").parent("controls");
  phiSelect = createSelect().parent("controls");
  [["0",0],["π/4",Math.PI/4],["π/2",Math.PI/2],["2π/3",2*Math.PI/3]]
    .forEach(p=>phiSelect.option(p[0],p[1]));

  createP("Περίοδος Τ").parent("controls");
  TSelect = createSelect().parent("controls");
  [["T = 1 s",1],["T = 2 s",2],["T = 4 s",4]]
    .forEach(p=>TSelect.option(p[0],p[1]));

  pauseBtn = createButton("Pause").parent("controls").mousePressed(togglePause);
  resetBtn = createButton("Reset").parent("controls").mousePressed(resetSketch);

  resetSketch();
}

function resetSketch() {
  samples = [];
  thetaRel = 0;
  t = 0;
  paused = false;
  showValues = false;

  T0 = Number(TSelect.value());
  const N = Number(periodsSelect.value());

  totalT = N * T0;
  totalTheta = N * TWO_PI;
}

function draw() {
  background(255);

  const A = Number(ASelect.value());
  const phi0 = Number(phiSelect.value());
  const omega = TWO_PI / T0;
  const plotWidth = width * 0.65;

  if (!paused && thetaRel <= totalTheta + 1e-9) {
    const phi = phi0 + thetaRel;
    samples.push({
      t: t,
      x: A * Math.sin(phi),
      u: omega * A * Math.cos(phi),
      a: -omega*omega*A * Math.sin(phi)
    });
    thetaRel += omega * DT;
    t = thetaRel / omega;
  }

  drawVerticalGrid(plotWidth);
  drawTimeLabels(plotWidth);

  plotSignal("x(t)", s=>s.x, A,                 0,           plotWidth, "blue");
  plotSignal("u(t)", s=>s.u, omega*A,           height/3,    plotWidth, "green");
  plotSignal("a(t)", s=>s.a, omega*omega*A,     2*height/3,  plotWidth, "red");

  drawTimeCursor(plotWidth);
  drawPhaseCircle(plotWidth, phi0);
}

// ====== PLOTS ======
function plotSignal(label, f, scale, yOffset, plotWidth, col) {
  const h = height/3;

  push();
  translate(LEFT_MARGIN, TOP_MARGIN + yOffset + h/2);

  // άξονας
  stroke(180);
  line(0, 0, plotWidth, 0);

  // αρχική τιμή
  if (samples.length > 0) {
    const v0 = f(samples[0]);
    const y0 = map(v0, -scale, scale, h/2, -h/2);

    drawingContext.setLineDash([6,6]);
    line(0, y0, plotWidth, y0);
    drawingContext.setLineDash([]);

    noStroke();
    fill(0);
    text(`${label[0]}₀ = ${v0.toFixed(1)}`, -LEFT_MARGIN+10, y0+4);
  }

  stroke(col);
  noFill();
  beginShape();
  samples.forEach(s=>{
    const x = map(s.t, 0, totalT, 0, plotWidth);
    const y = map(f(s), -scale, scale, h/2, -h/2);
    vertex(x,y);
  });
  endShape();

  pop();
}

// ====== GRID & TIME ======
function drawVerticalGrid(plotWidth) {
  drawingContext.setLineDash([6,6]);
  for (let tt=0; tt<=totalT+1e-9; tt+=T0/4) {
    const x = LEFT_MARGIN + map(tt,0,totalT,0,plotWidth);
    line(x, TOP_MARGIN, x, height);
  }
  drawingContext.setLineDash([]);
}

function drawTimeLabels(plotWidth) {
  fill(0); noStroke();
  for (let tt=0; tt<=totalT+1e-9; tt+=T0/4) {
    const x = LEFT_MARGIN + map(tt,0,totalT,0,plotWidth);
    const k = tt/(T0/4);
    text(k%4===0?`${k/4}T`:`${k}T/4`, x-12, height-8);
  }
}

function drawTimeCursor(plotWidth) {
  stroke("red");
  const x = LEFT_MARGIN + map(t,0,totalT,0,plotWidth);
  line(x, TOP_MARGIN, x, height);
}

// ====== PHASE CIRCLE ======
function drawPhaseCircle(plotWidth, phi0) {
  const cx = LEFT_MARGIN + plotWidth + (width-LEFT_MARGIN-plotWidth)/2;
  const cy = height/2;
  const R  = min(width-LEFT_MARGIN-plotWidth, height)*0.28;

  const phi = phi0 + thetaRel;

  push();
  translate(cx,cy);
  noFill(); stroke(0);
  circle(0,0,2*R);
  line(-R,0,R,0);
  line(0,-R,0,R);

  stroke("red");
  line(0,0,R*cos(phi),-R*sin(phi));
  fill("red");
  circle(R*cos(phi),-R*sin(phi),8);

  if(showValues){
    noStroke(); fill("red");
    text(`φ = ${(phi/Math.PI).toFixed(2)}π`, -R, -R-20);
    text(`t = ${frozenTime.toFixed(2)} s`, -R, -R);
  }
  pop();
}

function togglePause(){
  paused=!paused;
  if(paused){
    frozenPhase = thetaRel + Number(phiSelect.value());
    frozenTime = t;
    showValues = true;
  } else showValues = false;
}
``
