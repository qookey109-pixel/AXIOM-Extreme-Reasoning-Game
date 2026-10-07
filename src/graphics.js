/* Raster-first graphics: fixed logical canvas; <img> receives a PNG data URL.
 * No SVG/layout elements are inserted into the answer grid.
 */
const INK="#17202a",BLUE="#2457d6",PAPER="#fffdf8",SOFT="#e9efff",MUTED="#8d99a6";
function setup(width,height){
 const c=document.createElement("canvas");c.width=width;c.height=height;
 const ctx=c.getContext("2d");ctx.fillStyle="#faf8f2";ctx.fillRect(0,0,width,height);
 ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.lineJoin="round";ctx.lineCap="round";
 return {c,ctx,width,height};
}
function text(ctx,value,x,y,size=32,bold=true,color=INK){
 ctx.fillStyle=color;ctx.font=(bold?"800 ":"600 ")+size+"px system-ui, -apple-system, sans-serif";
 ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(value),x,y);
}
function line(ctx,x1,y1,x2,y2,color=INK,w=4){
 ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=w;ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}
function box(ctx,x,y,w,h,fill=PAPER,stroke=INK,rad=18,sw=3){
 ctx.beginPath();ctx.roundRect(x,y,w,h,rad);ctx.fillStyle=fill;ctx.fill();
 if(sw){ctx.strokeStyle=stroke;ctx.lineWidth=sw;ctx.stroke();}
}
function circle(ctx,x,y,r,fill=PAPER,stroke=INK,sw=4){
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
 if(sw){ctx.strokeStyle=stroke;ctx.lineWidth=sw;ctx.stroke();}
}
function polygon(ctx,x,y,n,r,fill=PAPER,rotation=-Math.PI/2){
 ctx.beginPath();
 for(let i=0;i<n;i++){let a=rotation+i*2*Math.PI/n,pX=x+Math.cos(a)*r,pY=y+Math.sin(a)*r;if(!i)ctx.moveTo(pX,pY);else ctx.lineTo(pX,pY);}
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.stroke();
}
function arrow(ctx,x,y,angle,r=58){
 const a=angle*Math.PI/180,ex=x+Math.cos(a)*r,ey=y+Math.sin(a)*r;
 const bx=x-Math.cos(a)*r*.65,by=y-Math.sin(a)*r*.65;
 line(ctx,bx,by,ex,ey,INK,5);
 for(const side of [-1,1]){const t=a+Math.PI+side*.5;line(ctx,ex,ey,ex+Math.cos(t)*20,ey+Math.sin(t)*20,INK,5);}
}
function linesFromSpec(spec){
 if(spec.mask!==undefined){
  return ["h","v","d1","d2"].filter((t,i)=>spec.mask&(1<<i));
 }
 return spec.lines||[];
}
function segments(ctx,x,y,types,scale=1){
 const m={h:[-48,0,48,0],v:[0,-48,0,48],d1:[-36,-36,36,36],d2:[-36,36,36,-36]};
 linesFromSpec({lines:types}).forEach(t=>{let a=m[t];line(ctx,x+a[0]*scale,y+a[1]*scale,x+a[2]*scale,y+a[3]*scale,INK,5*scale);});
}
function sequenceSymbol(ctx,x,y,spec,r=65){
 polygon(ctx,x,y,Math.max(3,Math.min(10,spec.sides)),r);
 arrow(ctx,x,y,spec.angle,r*.58);
 circle(ctx,x,y,Math.max(7,r*.13),spec.fill?INK:PAPER,INK,3);
}
function asym(ctx,x,y,angle=0,mirror=false,scale=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle*Math.PI/180);ctx.scale(mirror?-scale:scale,scale);
 const pts=[[-55,-70],[15,-70],[15,-12],[70,-12],[70,38],[-15,38],[-15,78],[-55,78]];
 ctx.beginPath();pts.forEach((p,i)=>{if(i===0)ctx.moveTo(...p);else ctx.lineTo(...p);});ctx.closePath();ctx.fillStyle=PAPER;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.stroke();
 circle(ctx,-38,-46,10,INK,INK,1);ctx.restore();
}
function tokenLine(ctx,labels,cx,cy,size=72){
 let start=cx-(labels.length-1)*size*.63;
 labels.forEach((x,i)=>{box(ctx,start+i*size*1.26-size*.43,cy-size*.43,size*.86,size*.86,PAPER,INK,10,3);
 text(ctx,x,start+i*size*1.26,cy,size*.42);});
}
function drawNet(ctx,ask,x0=220,y0=140,cell=112){
 const cells=[["A",1,0],["B",0,1],["C",1,1],["D",2,1],["E",3,1],["F",1,2]];
 cells.forEach(([id,xx,yy])=>{const x=x0+xx*cell,y=y0+yy*cell;box(ctx,x,y,cell,cell,id===ask?SOFT:PAPER,INK,0,3);text(ctx,id,x+cell/2,y+cell/2,36);});
}
function drawMain(ctx,q,w,h){
 let s=q.figure||{},kind=s.kind;
 if(kind==="pyramid"){
  let rows=s.rows,ys=[82,220,357,494];
  rows.forEach((row,level)=>{
   row.forEach((value,i)=>{
    const x=w/2+(i-(row.length-1)/2)*150,y=ys[level];
    if(level<3){
     let childCount=rows[level+1].length;
     for(const j of [i,i+1]){
      const cx=w/2+(j-(childCount-1)/2)*150;
      line(ctx,x,y+39,cx,ys[level+1]-39,"#b6bec8",3);
     }
    }
   });
  });
  rows.forEach((row,level)=>row.forEach((v,i)=>{
   const x=w/2+(i-(row.length-1)/2)*150,y=ys[level];
   circle(ctx,x,y,43,v==="?"?SOFT:PAPER,v==="?"?BLUE:INK,4);
   text(ctx,v,x,y,String(v).length>3?25:31);
  }));return;
 }
 if(kind==="circle"){
  const n=s.pairs.length,cx=w/2,cy=h/2,r=Math.min(w,h)*.43;
  circle(ctx,cx,cy,r,"none",INK,4);
  s.pairs.forEach((pair,i)=>{
   const a=(-Math.PI/2+(i+.5)*2*Math.PI/n),border=-Math.PI/2+i*2*Math.PI/n;
   line(ctx,cx,cy,cx+r*Math.cos(border),cy+r*Math.sin(border),"#aeb9c3",3);
   text(ctx,pair[0]+" · "+pair[1],cx+r*.75*Math.cos(a),cy+r*.75*Math.sin(a),30);
   text(ctx,pair[2],cx+r*.42*Math.cos(a),cy+r*.42*Math.sin(a),32,true,pair[2]==="?"?BLUE:INK);
  });return;
 }
 if(kind==="path"){
  const pos=[[115,185],[310,115],[310,300],[515,115],[515,300],[515,490],[790,185],[790,465]];
  (s.edges||[]).forEach(([a,b])=>line(ctx,...pos[a],...pos[b],"#a5b1be",5));
  s.vals.forEach((v,i)=>{circle(ctx,...pos[i],35);text(ctx,v,...pos[i],32);});
  return;
 }
 if(kind==="matrix"){
  const cell=154,gap=14,ox=Math.round((w-3*cell-2*gap)/2),oy=32;
  s.rows.flat().forEach((mask,i)=>{
   let x=ox+i%3*(cell+gap),y=oy+Math.floor(i/3)*(cell+gap);
   box(ctx,x,y,cell,cell,mask==="?"?SOFT:PAPER,mask==="?"?BLUE:"#c7cdd4",14,3);
   if(mask==="?")text(ctx,"?",x+cell/2,y+cell/2,52,true,BLUE);
   else segments(ctx,x+cell/2,y+cell/2,linesFromSpec({mask}),.86);
  });return;
 }
 if(kind==="sequence"){
  s.frames.forEach((f,i)=>sequenceSymbol(ctx,120+i*190,h*.5,f,62));
  text(ctx,"?",w-65,h*.5,64,true,BLUE);return;
 }
 if(kind==="rotation"){asym(ctx,w/2,h/2,0,false,1.45);return;}
 if(kind==="lights"){
  let x0=w/2-225,y0=h/2-225,size=136,gap=21;
  s.bits.forEach((v,i)=>box(ctx,x0+i%3*(size+gap),y0+Math.floor(i/3)*(size+gap),size,size,v?INK:PAPER,INK,12,4));
  return;
 }
 if(kind==="coins"){
  const denom=s.denom||[1,2,5,10,20,50];
  denom.forEach((v,i)=>{let x=110+i*135;circle(ctx,x,h/2,57,"#fff5d8","#a8730a",4);text(ctx,v,x,h/2,36);});return;
 }
 if(kind==="tokens"){tokenLine(ctx,s.labels,w/2,h/2,88);return;}
 if(kind==="logic"){
  for(let i=0;i<4;i++){let x=140+i*200;box(ctx,x,h/2-72,144,144,PAPER,INK,15,3);text(ctx,(i+1)+"",x+72,h/2-14,42);text(ctx,"?",x+72,h/2+39,28,false,MUTED);}return;
 }
 if(kind==="suspects"){
  for(let i=0;i<4;i++){let x=155+i*195;circle(ctx,x,h/2-20,50,PAPER,INK,4);text(ctx,"?",x,h/2-20,42);text(ctx,(s.labels||["A","B","C","D"])[i],x,h/2+77,32);}return;
 }
 if(kind==="cubeNet"){drawNet(ctx,s.ask||"C",215,120,108);return;}
 text(ctx,"AXIOM",w/2,h/2,64);
}
function drawChoice(ctx,spec,w,h){
 const k=spec?.kind||"letter",cx=w/2,cy=h/2;
 if(k==="number"){circle(ctx,cx,cy,76,PAPER,"#aab8ca",3);text(ctx,spec.value,cx,cy,66);return;}
 if(k==="segments"){segments(ctx,cx,cy,linesFromSpec(spec),1.2);return;}
 if(k==="sequence"){sequenceSymbol(ctx,cx,cy,spec,67);return;}
 if(k==="rotation"){asym(ctx,cx,cy,spec.angle,spec.mirror,.9);return;}
 if(k==="coins"){
  const vv=spec.values||[];let r=35;
  vv.forEach((v,i)=>{let x=42+i*74;circle(ctx,x,cy,r,"#fff5d8","#a8730a",3);text(ctx,v,x,cy,22);});return;
 }
 if(k==="tokens"){tokenLine(ctx,spec.labels||[],cx,cy,38);return;}
 if(k==="avatar"){circle(ctx,cx,cy,68,SOFT,BLUE,3);text(ctx,spec.value,cx,cy,72);return;}
 if(k==="face"){box(ctx,cx-58,cy-58,116,116,SOFT,BLUE,12,4);text(ctx,spec.value,cx,cy,69);return;}
 text(ctx,spec?.value||"?",cx,cy,66);
}
export function renderFigure(question){
 if(question.asset)return question.asset;
 const {c,ctx}=setup(900,600);drawMain(ctx,question,900,600);return c.toDataURL("image/png");
}
export function renderChoiceImage(question,index){
 const option=question.answerSpecs?.[index]||{kind:"number",value:question.options[index]};
 const {c,ctx}=setup(340,190);drawChoice(ctx,option,340,190);
 return c.toDataURL("image/png");
}
