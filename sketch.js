/****************************************************
 * Απλή Αρμονική Ταλάντωση – Τελική Έκδοση Αναφοράς
 ****************************************************/

const TWO_PI = 2 * Math.PI;
const DT = 0.01;

// ----- Layout -----
const LEFT = 90;
const TOP = 40;
const RIGHT_PANEL = 260;
const MIN_CANVAS_HEIGHT = 750;

// ----- Controls -----
let ASelect, periodsSelect, phiSelect, TSelect;
let pauseBtn, resetBtn;

// ----- State -----
let samples = [];
let t = 0;
let paused = false;
let frozen = null;

let T = 2;
let tMax = 2;

//==================================================
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
  [1,2,3,4].forEach(v => periodsSelect.option(v));

  createP("Αρχική φάση φ").parent("controls");
  phiSelect = createSelect().parent("controls");
  [
    ["0",0],
    ["π/6",Math.PI/6],
    ["π/4",Math.PI/4],
    ["π/3",Math.PI/3],
    ["π/2",Math.PI/2],
    ["2π/3",2*Math.PI/3],
    ["3π/4",3*Math.PI/4],
    ["5π/6",5*Math.PI/6],
    ["π",Math.PI],
    ["7π/6",7*Math.PI/6],
    ["4π/3",4*Math.PI/3],
    ["3π/2",3*Math.PI/2],
    ["5π/3",5*Math.PI/3],
    ["11π/6",11*Math.PI/6],
    ["2π",2*Math.PI]
  ].forEach(p => phiSelect.option(p[0], p[1]));

  createP("Περίοδος T").parent("controls");
  TSelect = createSelect().parent("controls");
  [["T = 1 s",1],["T = 2 s",2],["T = 4 s",4]]
    .forEach(p => TSelect.option(p[0], p[1]));

  pauseBtn = createButton("Pause").parent("controls").mousePressed(togglePause);
  resetBtn = createButton("Reset").parent("controls").mousePressed(resetSketch);

  resetSketch();
}

//==================================================
function windowResized() {
  const holder = document.getElementById("canvas-holder");
  const h = Math.max(holder.clientHeight, MIN_CANVAS_HEIGHT);
  resizeCanvas(holder.clientWidth, h);
}

//==================================================
function resetSketch() {
  samples = [];
  t = 0;
  paused = false;
  frozen = null;

  T = Number(TSelect.value());
  tMax = Number(periodsSelect.value()) * T;
}

//==================================================
function togglePause() {
  paused = !paused;
  if (paused && samples.length > 0) {
    frozen = samples.at(-1);
  }
}

//==================================================
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
}

//==================================================
// Κατακόρυφες γραμμές Τ/4
function drawTimeGrid() {
  const right = width - RIGHT_PANEL;
  stroke(180);
  drawingContext.setLineDash([6,6]);

  for (let tt=0; tt<=tMax+1e-9; tt+=T/4) {
    const x = map(tt,0,tMax,LEFT,right);
    line(x, TOP, x, height);
  }
  drawingContext.setLineDash([]);
}

//==================================================
// Κόκκινη γραμμή χρόνου
function drawTimeCursor() {
  const right = width - RIGHT_PANEL;
  const tt = paused && frozen ? frozen.t : t;
  const x = map(tt,0,tMax,LEFT,right);

  stroke("red");
  line(x, TOP, x, height);
}

//==================================================
// Διαγράμματα x, u, a
function drawSignals(A) {
  const h = height / 3;
  const right = width - RIGHT_PANEL;

  const scales = {
    x: A,
    u: (TWO_PI/T)*A,
    a: (TWO_PI/T)*(TWO_PI/T)*A
  };
  const colors = { x:"blue", u:"green", a:"red" };
  const keys = ["x","u","a"];

  keys.forEach((k,i)=>{
    push();
    translate(LEFT, TOP + i*h + h/2);

    stroke(150);
    line(0,0,right-LEFT,0);

    if (samples.length>0){
      const v0 = samples[0][k];
      const y0 = map(v0,-scales[k],scales[k],h/2,-h/2);
      drawingContext.setLineDash([6,6]);
      line(0,y0,right-LEFT,y0);
      drawingContext.setLineDash([]);
      noStroke(); fill(0);
      text(`${k}₀ = ${v0.toFixed(2)}`, -LEFT+5, y0+4);
    }

    stroke(colors[k]);
    noFill();
    beginShape();
    samples.forEach(s=>{
      const x = map(s.t,0,tMax,0,right-LEFT);
      const y = map(s[k],-scales[k],scales[k],h/2,-h/2);
      vertex(x,y);
    });
    endShape();
    pop();
  });
}

//==================================================
// Κύκλος φάσεων
function drawPhaseCircle() {
  if (samples.length === 0) return;

  const state = paused && frozen ? frozen : samples.at(-1);
  const cx = width - RIGHT_PANEL/2;
  const cy = height/2;
  const R  = 100;

  stroke(0); noFill();
  circle(cx,cy,2*R);
  line(cx-R,cy,cx+R,cy);
  line(cx,cy-R,cx,cy+R);

  stroke("red");
  line(cx,cy,cx+R*cos(state.phi),cy-R*sin(state.phi));
  fill("red");
  circle(cx+R*cos(state.phi),cy-R*sin(state.phi),8);

  if (paused) {
    const frac = phiToFraction(state.phi);
    text(`φ = ${frac.p}π/${frac.q}`, cx-R, cy-R-20);
    text(`t = ${frac.p}T/${2*frac.q}`, cx-R, cy-R);
  }
}

//==================================================
// Μετατροπή φ → pπ/q
function phiToFraction(phi) {
  let best = {p:0,q:1,err:1e9};
  const x = phi / Math.PI;

  for (let q=1;q<=24;q++){
    const p = Math.round(x*q);
    const err = Math.abs(x - p/q);
    if (err < best.err) best = {p,q,err};
  }
  const g = gcd(Math.abs(best.p),best.q);
  return {p:best.p/g,q:best.q/g};
}

function gcd(a,b){ return b===0?a:gcd(b,a%b); }
