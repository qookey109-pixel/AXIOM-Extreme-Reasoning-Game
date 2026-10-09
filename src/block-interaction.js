/* AXIOM V0.7 — deterministic, accessible block choreography.
 * Original DOM/CSS puzzle sculpture; no canvas export, animation libraries or GPU loop.
 * Scattered until users select a domain/difficulty, then magnetically assembles.
 */
const scattered=[
 [10,14,-28],[39,7,17],[76,11,-33],[91,31,25],
 [92,64,44],[78,89,-24],[49,94,30],[21,86,-14],
 [8,69,36],[7,42,-36],[55,9,13],[90,87,29]
];
const patterns=[
 [1,2,4,5,6,7,8,9,10,11,13,14], // chiseled diamond
 [0,1,2,3,4,7,8,11,12,13,14,15], // squared spiral
 [0,3,4,5,6,7,8,9,10,11,12,15], // window
 [0,1,2,4,6,7,8,9,11,13,14,15], // kinetic glyph
 [0,1,2,3,5,6,9,10,12,13,14,15]  // split ribbons
];
const sceneColors=["blue","mint","paper","coral","navy","yellow","paper","blue","coral","mint","yellow","navy"];
const marks=["△","＋","○","↗","◇","?","×","□","↘","∞","◁","≡"];
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
function hash(text){let h=2166136261;for(const ch of text){h=Math.imul(h^ch.charCodeAt(0),16777619);}return h>>>0;}
function piece(index,cssClass){
 const s=document.createElement("span");s.className=cssClass+" tone-"+sceneColors[index];
 s.textContent=marks[index];s.dataset.piece=String(index+1);s.style.setProperty("--order",index);
 return s;
}
export function createBlockInteraction(){
 const scene=document.getElementById("blockScene"),overlay=document.getElementById("blockLaunch");
 if(!scene||!overlay)return {recompose(){},reset(){},launch(){},mode(){return "missing";}};
 const blocks=Array.from({length:12},(_,i)=>{const el=piece(i,"block-piece");scene.append(el);return el;});
 const splash=Array.from({length:12},(_,i)=>{
  const el=piece(i,"launch-piece");const [sx,sy,angle]=scattered[i];
  el.style.setProperty("--start-x",sx+"%");
  el.style.setProperty("--start-y",sy+"%");
  el.style.setProperty("--start-angle",angle+"deg");
  const col=i%4,row=Math.floor(i/4);
  el.style.setProperty("--target-x",(col-1.5)*58+"px");
  el.style.setProperty("--target-y",(row-1)*58+"px");
  overlay.append(el);return el;
 });
 let generation=0;
 let timer1=0,timer2=0;
 function layout(coordinates,assembled){
  blocks.forEach((el,i)=>{
   const [x,y,r]=coordinates[i];
   el.style.setProperty("--piece-x",x+"%");
   el.style.setProperty("--piece-y",y+"%");
   el.style.setProperty("--piece-angle",r+"deg");
  });
  scene.dataset.mode=assembled?"assembled":"scattered";
  scene.dataset.pattern=assembled?String(scene.dataset.pattern||0):"none";
  const status=document.getElementById("assemblyStatus");
  if(status)status.textContent=assembled?"STRUCTURE / CONNECTED":"STRUCTURE / DISPERSED";
 }
 function reset(){
  generation++;
  layout(scattered,false);
  scene.dataset.pattern="none";
 }
 function recompose(category="全部",difficulty="全部"){
  generation++;
  const h=hash(category+" • "+difficulty);
  const cells=patterns[h%patterns.length];
  const start=Math.floor(h/7)%12;
  const coords=cells.map((cell,i)=>{
   const col=cell%4,row=Math.floor(cell/4);
   const index=(i+start)%12;
   const sway=(hash(category+"-"+index)%5)-2;
   return [19.5+col*20.5,19.5+row*20.5,((h+i*17)%9-4)*3+sway];
  });
  // Each tile starts at its own scattered corner and moves toward a unique slot.
  const arranged=blocks.map((_,i)=>coords[(i+start)%12]);
  scene.dataset.pattern=String(h%patterns.length);
  layout(arranged,true);
 }
 function launch(){
  if(reduced.matches){overlay.hidden=true;return;}
  clearTimeout(timer1);clearTimeout(timer2);
  const epoch=++generation;
  overlay.hidden=false;
  overlay.dataset.phase="scatter";
  // Force an initial layout frame, so the corner -> center choreography is visible.
  void overlay.offsetWidth;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(epoch===generation)overlay.dataset.phase="assemble";
  }));
  timer1=setTimeout(()=>{
   if(epoch===generation)overlay.dataset.phase="release";
  },560);
  timer2=setTimeout(()=>{
   if(epoch===generation){overlay.hidden=true;overlay.dataset.phase="scatter";}
  },930);
 }
 reset();
 return {recompose,reset,launch,mode:()=>scene.dataset.mode};
}
