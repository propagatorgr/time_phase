// ================== ΦΥΣΙΚΕΣ ΣΤΑΘΕΡΕΣ ==================
const T0 = 2;
const dt = 0.01;
const omega = TWO_PI / T0;

// ================== ΚΑΤΑΣΤΑΣΗ ==================
let ASelect, periodsSelect, phiSelect;
let pauseBtn, resetBtn;

let samples = [];
let theta = 0;
let t = 0;
let paused = false;
let totalTime = T0;
let totalTheta = TWO_PI;

let marginLeft = 0;   // ✅ ΚΡΙΣΙΜΗ ΔΙΟΡΘΩΣΗ

// ================== SETUP ==================
function setup() {
  let canvas = createCanvas(windowWidth * 0.9, windowHeight * 0.9);
  canvas.parent("canvas-holder");

  marginLeft = width * 0.07;

  createP("Πλάτος A").parent("controls");
  ASelect = createSelect().parent("controls");
  [50, 100, 150].forEach(v => ASelect.option(v));

  createP("Αριθμός περιόδων").parent("controls");
  periodsSelect = createSelect().parent("controls");
  [1,2,3,4,5,6].forEach(v => periodsSelect.option(v));

  createP("Αρχική φάση φ").parent("controls");
  phiSelect = createSelect().parent("controls");
  [
    ["0",0],["π/6",PI/6],["π/4",PI/4],["π/3",PI/3],
    ["π/2",PI/2],["2π/3",2*PI/3],["5π/6",5*PI/6],
    ["π",PI],["3π/2",3*PI/2],["2π",2*PI]
  ].forEach(p => phiSelect.option(p[0],p[1]));

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

// ================== RESET ==================
function resetSketch() {
  samples = [];
  theta = Number(phiSelect.value());
  t = 0;
  paused = false;
  pauseBtn.html("Pause");

  let N = Number(periodsSelect.value());
  totalTime  = N * T0;
  totalTheta = N * TWO_PI;
}

// ================== DRAW ==================
function draw() {
  background(255);

  let A = Number(ASelect.value());
  let plotWidth = width * 0.65;

  // ✅ ακριβής εξέλιξη φάσης
  if (!paused && theta <= totalTheta) {
    samples.push({
      t,
      x: A * sin(theta),
      u: omega * A * cos(theta),
      a: -omega*omega*A * sin(theta)
    });
    theta += omega * dt;
    t = theta / omega;
  }

  drawVerticalGrid(plotWidth);
  drawTimeLabels(plotWidth);
  drawPlots(A, plotWidth);
  drawCursor(plotWidth);
  drawPhaseCircle(plotWidth);
}

// ================== ΥΠΟΡΟΥΤΙΝΕΣ ==================
function drawPlots(A, plotWidth) {
  plotSignal("x(t)", p=>p.x, A, 0, plotWidth, "blue");
  plotSignal("u(t)", p=>p.u, omega*A, height/3, plotWidth, "green");
  plotSignal("a(t)", p=>p.a, omega*omega*A, 2*height/3, plotWidth, "red");
}

function plotSignal(label, f, scale, yOffset, plotWidth, col) {
  let h = height/3;
  push();
  translate(0, yOffset + h/2);
  line(marginLeft, 0, plotWidth, 0);
  stroke(col); noFill(); beginShape();
  samples.forEach(s=>{
    let x=map(s.t,0,totalTime,marginLeft,plotWidth);
    vertex(x,map(f(s),-scale,scale,h/2,-h/2));
  });
  endShape(); pop();
}

function drawVerticalGrid(plotWidth){
  stroke(180); drawingContext.setLineDash([6,6]);
  for(let tt=0;tt<=totalTime+1e-6;tt+=T0/4){
    let x=map(tt,0,totalTime,marginLeft,plotWidth);
    line(x,0,x,height);
  }
  drawingContext.setLineDash([]);
}

function drawTimeLabels(plotWidth){
  fill(0); noStroke(); textSize(12);
  for(let tt=0;tt<=totalTime+1e-6;tt+=T0/4){
    let x=map(tt,0,totalTime,marginLeft,plotWidth);
    let k=tt/(T0/4);
    let label=k===0?"0":(k%4===0?(k/4)+"T":k+"T/4");
    text(label,x-10,height-8);
  }
}

function drawCursor(plotWidth){
  stroke("red");
  let x=map(t,0,totalTime,marginLeft,plotWidth);
  line(x,0,x,height);
}

function drawPhaseCircle(plotWidth){
  let cx=plotWidth+(width-plotWidth)/2;
  let cy=height/2;
  let R=min(width-plotWidth,height)*0.28;
  let θ=min(theta,totalTheta);

  push(); translate(cx,cy);
  circle(0,0,2*R); line(-R,0,R,0); line(0,-R,0,R);
  stroke("red"); line(0,0,R*cos(θ),-R*sin(θ));
  fill("red"); circle(R*cos(θ),-R*sin(θ),R*0.08);
  pop();
}

function togglePause(){
  paused=!paused;
  pauseBtn.html(paused?"Resume":"Pause");
}
