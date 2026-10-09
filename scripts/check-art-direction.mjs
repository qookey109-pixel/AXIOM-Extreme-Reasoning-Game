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
],records=[];
try{
 for(const vp of sizes){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
  const home=await page.evaluate(()=>{
   const box=selector=>{const n=document.querySelector(selector);if(!n)return null;
    const r=n.getBoundingClientRect();return {x:r.left,y:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
   const art=document.querySelector(".hero-art");
   return {
    screen:document.body.dataset.screen,
    docWidth:document.documentElement.scrollWidth,
    docHeight:document.documentElement.scrollHeight,
    header:document.querySelectorAll(".app-header").length,
    editorial:document.querySelectorAll(".hero-content").length,
    filterHeading:document.querySelectorAll(".filter-heading").length,
    hero:box(".hero"),art:box(".hero-art"),filters:box(".filters"),
    start:box("#startTen"),full:box("#startAll"),
    artVisible:getComputedStyle(art).display!=="none",
    count:document.querySelectorAll(".filters>.control").length,
    stageCount:document.querySelectorAll("#blockScene .block-piece").length,
    liquid:!!document.querySelector("#liquidField"),
    app:box(".app")
   };
  });
  assert.equal(home.screen,"home",vp.name+" incorrect screen");
  assert.equal(home.header,0,"header must be removed");
  assert.equal(home.editorial,0,"left white editorial panel must be removed");
  assert.equal(home.filterHeading,0,"filter-heading tile must be removed");
  assert.equal(home.count,3,"retain category, difficulty and start controls");
  assert.equal(home.stageCount,12,"twelve blocks must remain");
  assert(home.liquid&&home.artVisible,"full artwork must remain visible");
  assert(home.hero.width>0&&home.hero.height>0,"hero collapsed");
  assert(Math.abs(home.art.width-home.hero.width)<3&&Math.abs(home.art.height-home.hero.height)<3,
   vp.name+" liquid artwork should occupy the entire hero");
  assert(home.docWidth<=vp.width+1&&home.docHeight<=vp.height+1,vp.name+" home overflow");
  for(const key of ["hero","art","filters","start","full"]){
   const b=home[key];assert(b&&b.x>=-1&&b.right<=vp.width+1&&b.y>=-1&&b.bottom<=vp.height+1,
   vp.name+" clipped "+key+" "+JSON.stringify(b));
  }
  assert(home.hero.y-home.app.y<18,vp.name+" header-sized empty row remains");
  await page.screenshot({path:"visual-qa/clean-"+vp.name+"-home.png",animations:"disabled"});
  await page.locator("#startTen").click();
  await page.waitForSelector("#game.is-active");
  await page.locator("#blockLaunch").waitFor({state:"hidden",timeout:4500});
  const game=await page.evaluate(()=>{
   const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
   return {screen:document.body.dataset.screen,docWidth:document.documentElement.scrollWidth,
    docHeight:document.documentElement.scrollHeight,puzzle:box("#puzzleStage"),answers:box("#answerGrid"),
    count:document.querySelectorAll("#answerGrid .answer").length,
    loaded:[...document.querySelectorAll("#answerGrid img")].every(x=>x.complete&&x.naturalWidth>0)};
  });
  assert.equal(game.screen,"game");assert.equal(game.count,4);
  assert(game.loaded,vp.name+" answer image missing");
  assert(game.docWidth<=vp.width+1&&game.docHeight<=vp.height+1,vp.name+" game overflow");
  for(const key of ["puzzle","answers"]){
   const b=game[key];assert(b.left>=-1&&b.right<=vp.width+1&&b.top>=-1&&b.bottom<=vp.height+1,vp.name+" game "+key+" clipped");
  }
  await page.locator(".answer").nth(1).click();
  assert.equal(await page.locator(".answer.selected").count(),1);
  assert.equal(await page.locator("#confirm").isDisabled(),false);
  await page.screenshot({path:"visual-qa/clean-"+vp.name+"-game.png",animations:"disabled"});
  await page.locator("#confirm").click();
  assert.deepEqual(errors,[],vp.name+" JS errors");
  records.push({viewport:vp.name,home,game});
  await page.close();
  console.log("PASS clean V0.8.1 "+vp.name+": three highlighted panels absent, full art and controls playable");
 }
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
 await reduced.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
 assert.equal(await reduced.locator("#home").evaluate(x=>getComputedStyle(x).animationName),"none");
 await reduced.close();
}finally{await browser.close();}
await writeFile("visual-qa/clean-panel-audit.json",JSON.stringify({build:"V0.8.1",records},null,2)+"\n");
console.log("AXIOM V0.8.1 full-bleed removal QA PASS: "+records.length+" viewports");
