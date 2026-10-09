/* Original Canvas artwork for unpublished AXIOM Ω research candidates.
 * Images are rendered only by cloud QA until a separate publication PR.
 */
const INK="#17202a",BLUE="#2457d6",PAPER="#fffdf8",SOFT="#e8efff",LINE="#b7c5d5";
function canvas(w,h){
 const c=document.createElement("canvas");c.width=w;c.height=h;
 const g=c.getContext("2d");g.fillStyle="#faf8f2";g.fillRect(0,0,w,h);
 g.textAlign="center";g.textBaseline="middle";g.lineCap="round";g.lineJoin="round";
 return {c,g};
}
function word(g,v,x,y,size=22,ink=INK){
 g.fillStyle=ink;g.font="800 "+size+"px system-ui,sans-serif";g.fillText(String(v),x,y);
}
function round(g,x,y,w,h,r=12,fill=PAPER,stroke=LINE){
 g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();
 g.strokeStyle=stroke;g.lineWidth=3;g.stroke();
}
function circle(g,x,y,r,fill=SOFT){
 g.beginPath();g.arc(x,y,r,0,2*Math.PI);g.fillStyle=fill;g.fill();
 g.strokeStyle=INK;g.lineWidth=3;g.stroke();
}
function line(g,ax,ay,bx,by,color=INK,width=4){
 g.beginPath();g.moveTo(ax,ay);g.lineTo(bx,by);g.lineWidth=width;g.strokeStyle=color;g.stroke();
}
function polygon(g,x,y,sides,r,fill){
 g.beginPath();
 for(let i=0;i<sides;i++){
  const a=-Math.PI/2+i*2*Math.PI/sides,px=x+r*Math.cos(a),py=y+r*Math.sin(a);
  if(i===0)g.moveTo(px,py);else g.lineTo(px,py);
 }
 g.closePath();g.fillStyle=fill;g.fill();g.lineWidth=4;g.strokeStyle=INK;g.stroke();
}
function arrowEast(g,x,y){
 line(g,x-24,y,x+28,y,BLUE,6);
 line(g,x+28,y,x+10,y-15,BLUE,6);
 line(g,x+28,y,x+10,y+15,BLUE,6);
}
function optionDraw(g,candidate,option){
 const family=candidate.family;
 if(family==="proof_compression"){
  // Three distinct numbered clue tiles, never a bare label or empty answer.
  const start=69,step=101;
  option.forEach((idx,i)=>{
   round(g,start+i*step-35,51,70,84,14,SOFT,BLUE);
   word(g,String(idx+1),start+i*step,93,42);
  });
  return;
 }
 if(family==="necessary_clue"){
  round(g,123,27,94,137,20,SOFT,BLUE);
  word(g,String(option+1),170,94,62);
  return;
 }
 if(family==="counterexample_hunt"){
  const fill=option.fill===1?INK:PAPER;
  polygon(g,135,95,option.sides,61,fill);
  arrowEast(g,261,94);
  return;
 }
 throw Error("no visual renderer for "+family);
}
export function renderCandidateOption(candidate,index){
 if(candidate.published!==false)throw Error("candidate artwork is research-only");
 if(!Array.isArray(candidate.options)||index<0||index>=candidate.options.length)throw Error("bad option index");
 const {c,g}=canvas(340,190);
 optionDraw(g,candidate,candidate.options[index]);
 return c.toDataURL("image/png");
}
export function renderCandidateFigure(candidate){
 if(candidate.published!==false)throw Error("candidate artwork is research-only");
 const {c,g}=canvas(900,500);
 round(g,130,58,640,375,28,PAPER,LINE);
 if(candidate.family==="proof_compression"||candidate.family==="necessary_clue"){
  const y=240;
  ["A","B","C","D"].forEach((label,i)=>{
   const x=250+i*132;
   round(g,x-45,y-50,90,105,14,SOFT,BLUE);
   word(g,label,x,y-19,29);
   word(g,"?",x,y+21,35,BLUE);
  });
  word(g,"0 / 1",450,370,30);
 }else if(candidate.family==="counterexample_hunt"){
  round(g,253,148,130,157,20,SOFT,BLUE);
  word(g,"實心",317,225,30);
  arrowEast(g,453,227);
  round(g,517,148,130,157,20,SOFT,BLUE);
  word(g,"偶數邊?",582,225,28);
 }else throw Error("no main candidate renderer");
 return c.toDataURL("image/png");
}
