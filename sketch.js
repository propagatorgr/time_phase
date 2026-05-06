const TWO_PI = 2 * Math.PI;
const DT = 0.01;

// layout
const LEFT = 110;
const RIGHT_MARGIN = 220;
const TOP = 40;

let ASelect, periodsSelect, phiSelect, TSelect;
let pauseBtn, resetBtn;

let samples = [];
let t = 0;
let paused = false;
let frozen = null;

let T = 2;
let tMax = 2;

function setup() {
  const holder = document.getElementById("canvas-holder");
  const c = createCanvas(holder.clientWidth, holder.clientHeight);
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

function windowResized(){
  const holder = document.getElementById("canvas-holder");
  resizeCanvas(holder.clientWidth, holder.clientHeight);
}

function resetSketch(){
  samples = [];
  t = 0;
  paused = false;
  frozen = null;

  T = Number(TSelect.value());
  tMax = Number(periodsSelect.value()) * T;
}

function togglePause(){
  paused = !paused;
  if(paused && samples.length>0) frozen = samples.at(-1);
}

function draw(){
  background(255);

  const A = Number(ASelect.value());
  const phi0 = Number(phiSelect.value());
  const omega = TWO_PI / T;

  if(!paused && t <= tMax + 1e-9){
    const phi = (phi0 + omega*t) % TWO_PI;
    samples.push({
      t, phi,
      x: A*sin(phi),
      u: omega*A*cos(phi),
      a: -omega*omega*A*sin(phi)
    });
    t += DT;
  }

  drawGrids();
  drawSignals();
  drawPhaseCircle();
}

function drawSignals(){
  const h = height/3;
  const right = width - RIGHT_MARGIN;

  ["x","u","a"].forEach((k,i)=>{
    const scale = k==="x"?50:(k==="u"?300:800);
    push();
    translate(LEFT, TOP + i*h + h/2);

    stroke(180); line(0,0,right-LEFT,0);

    if(samples.length>0){
      const v0 = samples[0][k];
      const y0 = map(v0,-scale,scale,h/2,-h/2);
      drawingContext.setLineDash([6,6]);
      line(0,y0,right-LEFT,y0);
      drawingContext.setLineDash([]);
      noStroke(); fill(0);
      text(`${k}₀ = ${v0.toFixed(1)}`, -LEFT+10, y0+4);
    }

    noFill();
    stroke(k==="x"?"blue":k==="u"?"green":"red");
    beginShape();
    samples.forEach(s=>{
      const x = map(s.t,0,tMax,0,right-LEFT);
      const y = map(s[k],-scale,scale,h/2,-h/2);
      vertex(x,y);
    });
    endShape();
    pop();
  });
}

function drawGrids(){
  const right = width - RIGHT_MARGIN;
  drawingContext.setLineDash([6,6]);
  for(let tt=0;tt<=tMax+1e-9;tt+=T/4){
    const x = map(tt,0,tMax,LEFT,right);
    line(x,TOP,x,height);
    noStroke();
    fill(0);
    text(tt.toFixed(2)+'s',x-12,height-8);
  }
  drawingContext.setLineDash([]);
}

function drawPhaseCircle(){
  const R = 120;
  const cx = width - RIGHT_MARGIN/2;
  const cy = height/2;
  const state = paused&&frozen?frozen:samples.at(-1);
  if(!state) return;

  noFill(); stroke(0);
  circle(cx,cy,2*R);
  line(cx-R,cy,cx+R,cy);
  line(cx,cy-R,cx,cy+R);

  stroke("red");
  line(cx,cy,cx+R*cos(state.phi),cy-R*sin(state.phi));
  fill("red");
  circle(cx+R*cos(state.phi),cy-R*sin(state.phi),8);

  if(paused){
    noStroke(); fill("red");
    text(`φ=${(state.phi/Math.PI).toFixed(2)}π`,cx-R,cy-R-20);
    text(`t=${state.t.toFixed(2)} s`,cx-R,cy-R);
  }
}
