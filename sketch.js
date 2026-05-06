// ========= ΣΤΑΘΕΡΕΣ =========
const T0 = 2;
const dt = 0.01;

// ========= ΚΑΤΑΣΤΑΣΗ =========
let ASelect, periodsSelect, phiSelect;
let pauseBtn, resetBtn;

let samples = [];
let t = 0;
let paused = false;
let totalTime = T0;

let phaseFrozen = false;
let frozenPQ = null;

let marginLeft;

// ========= SETUP =========
function setup() {
  let canvas = createCanvas(windowWidth * 0.9, windowHeight * 0.9);
  canvas.parent("canvas-holder");

  marginLeft = width * 0.07;

  // Controls → sidebar
  createP("Πλάτος A").parent("controls");
  ASelect = createSelect().parent("controls");
  [50, 100, 150].forEach(v => ASelect.option(v));

  createP("Αριθμός περιόδων").parent("controls");
  periodsSelect = createSelect().parent("controls");
  [1, 2, 3, 4, 5, 6].forEach(v => periodsSelect.option(v));

  createP("Αρχική φάση φ").parent("controls");
  phiSelect = createSelect().parent("controls");
  [
    ["0",0],["π/6",PI/6],["π/4",PI/4],["π/3",PI/3],
    ["π/2",PI/2],["2π/3",2*PI/3],["5π/6",5*PI/6],
    ["π",PI],["3π/2",3*PI/2],["2π",2*PI]
  ].forEach(p => phiSelect.option(p[0], p[1]));

  pauseBtn = createButton("Pause").parent("controls");
  pauseBtn.mousePressed(togglePause);

  resetBtn = createButton("Reset").parent("controls");
  resetBtn.mousePressed(resetSketch);

  resetSketch();
}

function windowResized() {
  resizeCanvas(windowWidth * 0.9, windowHeight * 0.9);
  marginLeft = width * 0.07;
}

// ========= RESET =========
function resetSketch() {
  samples = [];
  t = 0;
  paused = false;
  phaseFrozen = false;
  frozenPQ = null;
  pauseBtn.html("Pause");
  totalTime = Number(periodsSelect.value()) * T0;
}

// ========= DRAW =========
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

  let plotWidth = width * 0.65;

  drawGrid(plotWidth);
  drawPlots(A, omega, plotWidth);
  drawCursor(plotWidth);
  drawPhaseCircle(plotWidth, omega, phi0);
}

// ========= ΔΙΑΓΡΑΜΜΑΤΑ =========
function drawPlots(A, omega, plotWidth) {
  plotSignal("x(t)", p=>p.x, A, 0, plotWidth, "blue");
  plotSignal("u(t)", p=>p.u, omega*A, height/3, plotWidth, "green");
  plotSignal("a(t)", p=>p.a, omega*omega*A, 2*height/3, plotWidth, "red");
}

function plotSignal(label, accessor, scale, yOffset, plotWidth, col) {
  let h = height/3;
  push();
  translate(0, yOffset + h/2);

  line(marginLeft, 0, plotWidth, 0);

  stroke(col);
  noFill();
  beginShape();
  samples.forEach(s => {
    let x = map(s.t, 0, totalTime, marginLeft, plotWidth);
    let y = map(accessor(s), -scale, scale, h/2, -h/2);
    vertex(x, y);
  });
  endShape();

  noStroke();
  fill(0);
  text(label, marginLeft + 5, -h/2 + 15);
  pop();
}

// ========= ΠΛΕΓΜΑ =========
function drawGrid(plotWidth) {
  stroke(180);
  drawingContext.setLineDash([6,6]);
  for (let tt=0; tt<=totalTime; tt+=T0/4) {
    let x = map(tt,0,totalTime,marginLeft,plotWidth);
    line(x,0,x,height);
  }
  drawingContext.setLineDash([]);
}

// ========= CURSOR =========
function drawCursor(plotWidth) {
  stroke("red");
  let x = map(t,0,totalTime,marginLeft,plotWidth);
  line(x,0,x,height);
}

// ========= ΚΥΚΛΟΣ ΦΑΣΗΣ =========
function drawPhaseCircle(plotWidth, omega, phi0) {
  let cx = plotWidth + (width-plotWidth)/2;
  let cy = height/2;
  let R = min(width-plotWidth, height)*0.28;

  let theta = omega*t + phi0;

  push();
  translate(cx,cy);
  noFill();
  circle(0,0,2*R);
  line(-R,0,R,0); line(0,-R,0,R);

  stroke("red");
  line(0,0,R*cos(theta),-R*sin(theta));
  fill("red");
  circle(R*cos(theta),-R*sin(theta),R*0.08);

  if (phaseFrozen && frozenPQ) {
    let {p,q} = frozenPQ;
    text(`φ = ${p}π/${q}`, -R, -R*1.2);
    text(`t = ${p}T/${2*q}`, -R, -R);
  }
  pop();
}

// ========= ΚΛΙΚ =========
function mousePressed() {
  if (!paused) return;
  let omega = TWO_PI/T0;
  let phi0 = Number(phiSelect.value());
  let theta = omega*t + phi0;
  frozenPQ = phaseToFraction(theta);
  phaseFrozen = true;
}

function togglePause() {
  paused = !paused;
  phaseFrozen = false;
  pauseBtn.html(paused?"Resume":"Pause");
}

// ========= ΦΑΣΗ → pπ/q =========
function phaseToFraction(theta){
  let x = theta/PI, best={p:0,q:1,e:1};
  for(let q=1;q<=24;q++){
    let p=Math.round(x*q);
    let e=Math.abs(x-p/q);
    if(e<best.e) best={p,q,e};
  }
  let g=gcd(Math.abs(best.p),best.q);
  return {p:best.p/g,q:best.q/g};
}
function gcd(a,b){return b?gcd(b,a%b):a;}
