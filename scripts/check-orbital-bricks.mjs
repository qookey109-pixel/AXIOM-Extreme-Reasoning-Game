import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {chromium} from "playwright";

const cases=[
 {name:"small-phone",width:320,height:568},
 {name:"phone",width:390,height:844},
 {name:"landscape",width:667,height:375},
 {name:"tablet",width:768,height:1024},
 {name:"desktop",width:1440,height:900}
];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
await mkdir("visual-qa",{recursive:true});
const audits=[];
try{
 for(const s of cases){
  const page=await browser.newPage({viewport:{width:s.width,height:s.height}});
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
  const art=await page.evaluate(()=>{
   const b=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   const hero=document.querySelector("#home>.hero"),field=document.querySelector("#liquidField");
   const pieces=[...document.querySelectorAll("#blockScene>.block-piece")];
   const modes=[...document.querySelectorAll("#difficultyFilter>button")];
   const start=document.querySelector("#startTen"),select=document.querySelector("#categoryFilter");
   const category=select.closest(".control"),difficulty=document.querySelector("#difficultyFilter").closest(".control");
   const groups=[category,difficulty,start.closest(".control")];
   return {
    version:window.AXIOM_QA.build,
    blocks:pieces.length,
    material:pieces.map(p=>({
     kind:p.dataset.material,
     background:getComputedStyle(p).backgroundImage,
     blur:getComputedStyle(p).backdropFilter,
     sideHeight:getComputedStyle(p,"::before").height,
     face:!!p.querySelector(".brick-face"),
     studs:p.querySelectorAll(".brick-stud").length,
     studRadius:getComputedStyle(p.querySelector(".brick-stud")).borderRadius,
     glyph:p.querySelector(".brick-glyph").textContent.trim()
    })),
    controls:groups.map(b),hero:b(hero),field:b(field),
    modeBorders:modes.map(x=>getComputedStyle(x).borderTopWidth),
    modeActive:modes.filter(x=>x.getAttribute("aria-pressed")==="true").map(x=>x.dataset.value),
    launch:b(start),launchRadius:getComputedStyle(start).borderRadius,
    categories:select.options.length,
    body:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},
    zeroStrip:getComputedStyle(document.querySelector(".filters")).backgroundColor,
    noHeader:document.querySelectorAll(".app-header,.hero-content,.filter-heading").length===0
   };
  });
  assert.equal(art.version,"V0.9.0-20261009",s.name+" stale build");
  assert.equal(art.blocks,12,s.name+" original 12 bricks missing");
  assert(art.material.every(x=>x.kind==="molded-polymer"&&x.face&&x.studs===4&&x.glyph.length>0),
   s.name+" bricks must have individual solid faces, four studs and embossed signs");
  assert(art.material.every(x=>x.background.includes("linear-gradient")&&x.sideHeight!=="0px"),
   s.name+" physical extrusion/material missing");
  assert(art.material.every(x=>x.blur==="none"),s.name+" old glass overlay persists");
  assert(art.material.every(x=>x.studRadius==="50%"),s.name+" studs are not round");
  assert.equal(art.categories,13,s.name+" category selector must offer all 12 areas plus All");
  assert.deepEqual(art.modeActive,["全部"],s.name+" initial dial");
  assert(art.modeBorders.every(x=>x==="0px"),s.name+" separate pill outlines remain");
  assert(art.launchRadius==="50%",s.name+" start button should be a sculptural circular core");
  assert(Math.abs(art.launch.width-art.launch.height)<3,s.name+" launch control not round");
  assert(art.noHeader,s.name+" legacy panels returned");
  assert(art.zeroStrip==="rgba(0, 0, 0, 0)",s.name+" backplate returned");
  assert(art.body.width<=s.width+1&&art.body.height<=s.height+1,s.name+" viewport overflow");
  assert(Math.abs(art.field.height-art.hero.height)<3,s.name+" liquid field not full-height");
  for(const [i,b] of art.controls.entries()){
   assert(b.left>=-1&&b.right<=s.width+1&&b.top>=-1&&b.bottom<=s.height+1,
    s.name+" instrument out of bounds "+i+" "+JSON.stringify(b));
  }
  await page.screenshot({path:"visual-qa/v09-orbital-"+s.name+"-scattered.png",animations:"disabled"});
  await page.selectOption("#categoryFilter","圖形缺項");
  await page.locator("#difficultyFilter [data-value='Expert']").click();
  const selected=await page.evaluate(()=>({
   category:window.AXIOM_QA.state.category,
   difficulty:window.AXIOM_QA.state.difficulty,
   mode:document.getElementById("blockScene").dataset.mode,
   count:document.querySelectorAll("#blockScene .brick-stud").length,
   pressed:[...document.querySelectorAll("#difficultyFilter>button[aria-pressed=true]")].map(x=>x.dataset.value),
   scene:document.getElementById("blockScene").getBoundingClientRect().width
  }));
  assert.equal(selected.category,"圖形缺項");
  assert.equal(selected.difficulty,"Expert");
  assert.equal(selected.mode,"assembled");
  assert.deepEqual(selected.pressed,["Expert"]);
  assert.equal(selected.count,48);
  await page.screenshot({path:"visual-qa/v09-orbital-"+s.name+"-assembled.png",animations:"disabled"});
  await page.locator("#startTen").click();
  await page.waitForSelector("#game.is-active");
  await page.locator("#blockLaunch").waitFor({state:"hidden",timeout:4500});
  assert.equal(await page.locator("#answerGrid .answer").count(),4,s.name+" game choices");
  assert.equal(await page.locator("#blockLaunch .brick-stud").count(),48,s.name+" entry animation bricks do not match");
  await page.locator("#answerGrid .answer").first().click();
  assert.equal(await page.locator("#confirm").isDisabled(),false,s.name+" game confirm");
  await page.screenshot({path:"visual-qa/v09-orbital-"+s.name+"-game.png",animations:"disabled"});
  assert.deepEqual(errors,[],s.name+" browser exceptions");
  audits.push({viewport:s.name,art,selected});
  console.log("PASS V0.9 "+s.name+": opaque 3D bricks / 4 studs / orbital instruments / play");
  await page.close();
 }
 const low=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
 await low.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
 const move=await low.locator(".block-piece").first().evaluate(x=>getComputedStyle(x).transitionDuration);
 assert(move.split(",").every(x=>parseFloat(x)===0),"reduced motion disabled");
 await low.locator("#startTen").click();
 await low.waitForSelector("#game.is-active");
 assert.equal(await low.locator("#blockLaunch").isHidden(),true,"reduced motion portal not hidden");
 await low.close();
}finally{await browser.close();}
await writeFile("visual-qa/orbital-brick-audit.json",
 JSON.stringify({build:"V0.9.0",audits,passed:audits.length},null,2)+"\n");
console.log("AXIOM V0.9 physical-brick + orbital-control browser QA PASS: 5 viewports");
