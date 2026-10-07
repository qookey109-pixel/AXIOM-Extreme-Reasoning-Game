import assert from "node:assert/strict";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const viewports=[[320,568],[360,640],[375,667],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[667,375]];
let passed=0;
try{
 for(const [width,height] of viewports){
  const page=await browser.newPage({viewport:{width,height}});
  const faults=[];
  page.on("pageerror",e=>faults.push(e.message));
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
  await page.locator("#startTen").click();
  await page.waitForSelector("#game.is-active");
  await page.locator(".answer img").first().waitFor({state:"visible"});
  const layout=await page.evaluate(()=>{
   const elements=["game","answerGrid","hintButton","clearButton","confirm"].map(id=>document.getElementById(id));
   elements.push(document.querySelector(".stage"));
   const bbox=elements.map(x=>{const r=x.getBoundingClientRect();return {name:x.id||x.className,
     left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};});
   const images=[document.getElementById("mainFigure"),...document.querySelectorAll(".answer img")];
   return {viewW:innerWidth,viewH:innerHeight,docW:document.documentElement.scrollWidth,
    docH:document.documentElement.scrollHeight,images:images.map(x=>({complete:x.complete,
    width:x.naturalWidth,height:x.naturalHeight})),boxes:bbox};
  });
  assert(layout.docW<=width+1,"horizontal overflow "+width+"x"+height+": "+layout.docW);
  assert(layout.docH<=height+1,"vertical overflow "+width+"x"+height+": "+layout.docH);
  for(const b of layout.boxes){
   assert(b.left>=-2&&b.right<=width+2,"offscreen horizontal "+width+"x"+height+" "+b.name+": "+JSON.stringify(b));
   assert(b.top>=-2&&b.bottom<=height+2,"offscreen vertical "+width+"x"+height+" "+b.name+": "+JSON.stringify(b));
  }
  assert.equal(layout.images.length,5,width+"x"+height+" missing graphic tiles");
  assert(layout.images.every(x=>x.complete&&x.width>0&&x.height>0),width+"x"+height+" image failed");
  await page.locator(".answer").nth(2).click();
  assert.equal(await page.locator("#confirm").isDisabled(),false);
  await page.locator("#confirm").click();
  await page.waitForTimeout(70);
  assert(!faults.length,width+"x"+height+": "+faults.join("; "));
  await page.close();
  passed++;
  console.log("PASS "+width+"x"+height+": no overflow; raster images; four answers; submit flow");
 }

 const full=await browser.newPage({viewport:{width:390,height:844}});
 const pageErrors=[];
 full.on("pageerror",e=>pageErrors.push(e.message));
 await full.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
 await full.locator("#startAll").click();
 assert.equal(await full.evaluate(()=>window.AXIOM_QA.state.pool.length),50);
 await full.locator("#detailButton").click();
 assert.equal(await full.locator("#dialog").evaluate(x=>x.open),true);
 await full.locator("#dialogClose").click();
 for(let i=0;i<50;i++){
  await full.waitForFunction(()=>{const im=document.getElementById("mainFigure");return im.complete&&im.naturalWidth>0;});
  assert.equal(await full.locator(".answer").count(),4);
  const imageCount=await full.locator(".answer img").evaluateAll(imgs=>imgs.filter(x=>x.complete&&x.naturalWidth>0).length);
  assert.equal(imageCount,4,"missing option imagery at full trial "+(i+1));
  await full.locator(".answer").first().click();
  await full.locator("#confirm").click();
 }
 await full.waitForSelector("#results.is-active");
 assert(!pageErrors.length,"50-puzzle sweep JS errors: "+pageErrors.join(";"));
 await full.locator("#reviewButton").click();
 assert.equal(await full.locator("#dialog").evaluate(x=>x.open),true);
 await full.locator("#dialogClose").click();
 await full.close();
 console.log("PASS: all 50 puzzles render 4 graphical choices and complete the full trial");
} finally {await browser.close();}
console.log("AXIOM browser QA PASS: "+passed+"/"+viewports.length+" viewports");
