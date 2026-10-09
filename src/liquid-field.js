/* AXIOM / Liquid Logic V0.8
 * Lightweight, original GLSL light-field behind the block sculpture.
 * Inspired by abstract liquid-media art direction, not copied from ThreeUI.
 * WebGL optional: gradients provide identical layout when unavailable.
 */
const vertex = `
attribute vec2 p;
void main(){gl_Position=vec4(p,0.,1.);}
`;
const fragment = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uMood;
void main(){
 vec2 uv=gl_FragCoord.xy/uResolution.xy;
 vec2 q=uv-.5;
 q.x *= uResolution.x/uResolution.y;
 float t=uTime*.11;
 float vortex=sin(q.x*4.3+q.y*2.7+t+uMood*.15);
 float liquid=sin(q.y*6.-q.x*2.2-t*.83+sin(q.x*5.+t)*1.18);
 float fold=cos(q.x*3.4+q.y*5.3+t*.5);
 float band=.5+.5*sin(3.14*(q.y+q.x*.39)+vortex*.65+liquid*.4+t*.63);
 float plume=smoothstep(.19,.89,band);
 vec3 mint=vec3(.64,.88,.70);
 vec3 amber=vec3(.97,.70,.34);
 vec3 wine=vec3(.55,.15,.18);
 vec3 color=mix(mint,amber,smoothstep(.17,.73,plume));
 color=mix(color,wine,smoothstep(.52,.98,plume+fold*.13));
 float prism=.5+.5*sin(q.x*8.+liquid*1.8+uMood*.19);
 vec3 aqua=vec3(.66,.99,.94),lilac=vec3(.93,.79,.98);
 float glow=pow(max(0.,1.-length(q*vec2(.86,1.15))),1.5);
 color=mix(color,mix(aqua,lilac,prism),.28*glow+.04);
 float vein=pow(max(0.,sin(q.x*13.+vortex*2.7+q.y*8.2+t)),18.);
 color=mix(color,vec3(1.,.99,.95),vein*.30);
 color+=glow*.06;
 gl_FragColor=vec4(clamp(color,0.,1.),1.);
}
`;
const reduced=window.matchMedia("(prefers-reduced-motion:reduce)");
export function createLiquidField(){
 const canvas=document.getElementById("liquidField");
 if(!canvas)return {mood(){},status:()=>"missing"};
 let gl,program,uniforms,raf=0,last=0,start=performance.now(),mood=0,active=true,status="fallback";
 const root=document.body;
 function compile(type,source){
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));
  return shader;
 }
 try{
  gl=canvas.getContext("webgl",{alpha:false,antialias:false,depth:false,powerPreference:"low-power",preserveDrawingBuffer:false});
  if(!gl)throw new Error("WebGL unavailable");
  const a=compile(gl.VERTEX_SHADER,vertex),b=compile(gl.FRAGMENT_SHADER,fragment);
  program=gl.createProgram();gl.attachShader(program,a);gl.attachShader(program,b);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  gl.deleteShader(a);gl.deleteShader(b);gl.useProgram(program);
  const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const attr=gl.getAttribLocation(program,"p");
  gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
  uniforms={size:gl.getUniformLocation(program,"uResolution"),
   time:gl.getUniformLocation(program,"uTime"),mood:gl.getUniformLocation(program,"uMood")};
  status="webgl";
 }catch(err){
  status="fallback";
  canvas.dataset.renderMode="fallback";
 }
 canvas.dataset.renderMode=status;
 function frame(timestamp){
  raf=0;
  if(!active||document.hidden||root.dataset.screen!=="home")return;
  if(!gl||status!=="webgl")return;
  if(timestamp-last>=42||reduced.matches){
   last=timestamp;
   const rect=canvas.getBoundingClientRect();
   const cap=innerWidth<750?220:540;
   const w=Math.max(2,Math.min(cap,Math.floor(rect.width*.75)));
   const h=Math.max(2,Math.min(cap,Math.floor(rect.height*.75)));
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
   gl.useProgram(program);
   gl.uniform2f(uniforms.size,w,h);
   gl.uniform1f(uniforms.time,reduced.matches?0:(timestamp-start)/1000);
   gl.uniform1f(uniforms.mood,mood);
   gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  if(!reduced.matches)raf=requestAnimationFrame(frame);
 }
 function startLoop(){
  cancelAnimationFrame(raf);raf=0;
  if(root.dataset.screen==="home"&&!document.hidden&&active&&status==="webgl")raf=requestAnimationFrame(frame);
 }
 function setMood(category="全部",difficulty="全部"){
  let hash=0;
  for(const ch of category+"-"+difficulty)hash=(Math.imul(hash,31)+ch.charCodeAt(0))>>>0;
  mood=hash%37;
  canvas.dataset.mood=String(mood);
  startLoop();
 }
 const observer=new MutationObserver(startLoop);
 observer.observe(root,{attributes:true,attributeFilter:["data-screen"]});
 document.addEventListener("visibilitychange",startLoop);
 reduced.addEventListener?.("change",startLoop);
 canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();status="fallback";canvas.dataset.renderMode="fallback";cancelAnimationFrame(raf);});
 setMood();
 return {mood:setMood,status:()=>status,stop(){active=false;cancelAnimationFrame(raf);observer.disconnect();}};
}
