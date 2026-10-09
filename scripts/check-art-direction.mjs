import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {chromium} from "playwright";

await mkdir("visual-qa",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const sizes=[
 {name:"small-phone",width:320,height:568},
 {name:"phone",width:390,height:844},
 {name:"landscape",width:667,height:375},
 {name:"tablet",width:768,height:1024},
 {name:"desktop",width:1440,height:900}
];
const records=[];
try{
 for(const vp of sizes){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
  const home=await page.evaluate(()=>{
   const by=(selector)=>{const n=document.querySelector(selector);if(!n)return null;
    const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   const lines=[...document.querySelectorAll(".hero-line")].map(n=>({text:n.innerText,visible:n.offsetParent!==null,
    textWidth:n.scrollWidth,boxWidth:n.clientWidth}));
   return {screen:document.body.dataset.screen,viewport:{width:innerWidth,height:innerHeight},
    page:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},
    hero:by(".hero"),content:by(".hero-content"),art:by(".hero-art"),
    filters:by(".filters"),title:by(".hero h1"),start:by("#startTen"),full:by("#startAll"),
    lines,artDisplay:getComputedStyle(document.querySelector(".hero-art")).display,
    styleLink:!!document.querySelector('link[href*="art-direction.css"]'),
    titleSize:parseFloat(getComputedStyle(document.querySelector(".hero h1")).fontSize),
    animation:getComputedStyle(document.querySelector(".page.is-active")).animationName};
  });
  assert.equal(home.screen,"home",vp.name+" home screen state");
  assert(home.styleLink,vp.name+" missing art direction link");
  assert(home.page.width<=vp.width+1&&home.page.height<=vp.height+1,vp.name+" home page overflow "+JSON.stringify(home.page));
  for(const name of ["hero","filters","start","full"]){
   const r=home[name];assert(r&&r.left>=-1&&r.right<=vp.width+1&&r.top>=-1&&r.bottom<=vp.height+1,
    vp.name+" home "+name+" clipped "+JSON.stringify(r));
  }
  assert(home.lines.every(x=>x.textWidth<=x.boxWidth+2),vp.name+" headline text clipped "+JSON.stringify(home.lines));
  assert(home.titleSize>=30,vp.name+" headline too small");
  if(vp.height<=600&&vp.width>vp.height)assert.equal(home.artDisplay,"none",vp.name+" hide artwork in compact landscape");
  else assert.notEqual(home.artDisplay,"none",vp.name+" missing interactive block artwork");
  await page.screenshot({path:"visual-qa/design-"+vp.name+"-home.png",animations:"disabled"});
  await page.locator("#startTen").click();
  await page.waitForSelector("#game.is-active");
  await page.locator("#blockLaunch").waitFor({state:"hidden",timeout:4500});
  const game=await page.evaluate(()=>{
   const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
   return {screen:document.body.dataset.screen,docW:document.documentElement.scrollWidth,
    docH:document.documentElement.scrollHeight,puzzle:box("#puzzleStage"),answers:box("#answerGrid"),
    options:document.querySelectorAll("#answerGrid .answer").length,
    imgOk:[...document.querySelectorAll("#answerGrid .answer img")].every(x=>x.complete&&x.naturalWidth>0),
    prompt:document.querySelector(".prompt-kicker")?.textContent||""};
  });
  assert.equal(game.screen,"game",vp.name+" game state");
  assert.equal(game.options,4,vp.name+" answer count");
  assert(game.imgOk,vp.name+" image decode");
  assert(game.docW<=vp.width+1&&game.docH<=vp.height+1,vp.name+" game page overflow");
  for(const name of ["puzzle","answers"]){
   const r=game[name];assert(r.left>=-1&&r.right<=vp.width+1&&r.top>=-1&&r.bottom<=vp.height+1,
    vp.name+" game "+name+" clipped");
  }
  await page.locator(".answer").nth(1).click();
  assert.equal(await page.locator(".answer.selected").count(),1,vp.name+" answer selection");
  assert.equal(await page.locator("#confirm").isDisabled(),false,vp.name+" confirm state");
  await page.screenshot({path:"visual-qa/design-"+vp.name+"-game.png",animations:"disabled"});
  await page.locator("#confirm").click();
  assert.equal(errors.length,0,vp.name+" JavaScript errors: "+errors.join("; "));
  records.push({viewport:vp.name,home,game});
  await page.close();
  console.log("PASS V0.6 editorial home/game "+vp.name+" "+vp.width+"x"+vp.height+" (no clipping, interaction intact)");
 }
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
 await reduced.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
 const motion=await reduced.locator("#home").evaluate(el=>getComputedStyle(el).animationName);
 assert.equal(motion,"none","reduced-motion disables entrance animation");
 await reduced.close();
}finally{await browser.close();}
await writeFile("visual-qa/design-audit.json",JSON.stringify({build:"V0.7.0",passed:records.length,records},null,2)+"\n");
console.log("AXIOM V0.7 visual experience PASS: "+records.length+" viewports x home/game, reduced motion PASS");
