import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const checks=[];
await mkdir("visual-qa",{recursive:true});
const viewports=[
 {name:"tiny-phone",width:320,height:568},
 {name:"phone",width:390,height:844},
 {name:"landscape",width:667,height:375},
 {name:"desktop",width:1440,height:900}
];
async function snap(page,name){await page.screenshot({path:"visual-qa/blocks-"+name+".png",animations:"disabled"});}
try{
 for(const vp of viewports){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height}});
  const faults=[];page.on("pageerror",e=>faults.push(e.message));
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
  const start=await page.evaluate(()=>{
   const art=document.querySelector("#blockScene");
   return {mode:art.dataset.mode,count:art.children.length,
    coords:[...art.children].map(x=>[x.style.getPropertyValue("--piece-x"),x.style.getPropertyValue("--piece-y")]),
    duration:getComputedStyle(art.children[0]).transitionDuration,
    build:window.AXIOM_QA.build,visible:getComputedStyle(document.querySelector(".hero-art")).display!=="none",
    bodyWidth:document.documentElement.scrollWidth,bodyHeight:document.documentElement.scrollHeight};
  });
  assert.equal(start.build,"V0.8.0-20261009",vp.name+" stale site");
  assert.equal(start.mode,"scattered",vp.name+" should start scattered");
  assert.equal(start.count,12,vp.name+" twelve blocks");
  assert.equal(new Set(start.coords.map(x=>x.join(","))).size,12,vp.name+" scattered corners must be distinct");
  assert(start.duration!=="0s",vp.name+" pieces missing transition");
  assert(start.bodyWidth<=vp.width+1&&start.bodyHeight<=vp.height+1,vp.name+" home overflow");
  if(vp.height<=600&&vp.width>vp.height)assert.equal(start.visible,false,vp.name+" compact landscape should not crowd");
  else assert.equal(start.visible,true,vp.name+" mobile/desktop artwork missing");
  await snap(page,vp.name+"-scattered");
  await page.selectOption("#categoryFilter","圖形缺項");
  const chosen=await page.evaluate(()=>{
   const art=document.querySelector("#blockScene");
   return {mode:art.dataset.mode,pattern:art.dataset.pattern,
    coords:[...art.children].map(x=>[x.style.getPropertyValue("--piece-x"),x.style.getPropertyValue("--piece-y")]),
    status:document.querySelector("#assemblyStatus").textContent,
    enabled:!document.querySelector("#startTen").disabled};
  });
  assert.equal(chosen.mode,"assembled",vp.name+" category did not assemble");
  assert(chosen.enabled,vp.name+" empty category");
  assert.equal(new Set(chosen.coords.map(x=>x.join(","))).size,12,vp.name+" assembled block collision");
  assert(chosen.status.includes("CONNECTED"),vp.name+" status not updated");
  assert.notDeepEqual(chosen.coords,start.coords,vp.name+" no visible choreography");
  await snap(page,vp.name+"assembled");
  await page.locator("#difficultyFilter button[data-value='Expert']").click();
  const harder=await page.evaluate(()=>({
   coords:[...document.querySelectorAll(".block-piece")].map(x=>x.style.getPropertyValue("--piece-x")+"|"+x.style.getPropertyValue("--piece-y")),
   difficulty:window.AXIOM_QA.state.difficulty}));
  assert.equal(harder.difficulty,"Expert",vp.name+" difficulty state");
  assert.notDeepEqual(harder.coords,chosen.coords.map(x=>x.join("|")),vp.name+" difficulty did not recompose");
  await page.locator("#startTen").click();
  await page.waitForSelector("#game.is-active");
  const portal=await page.evaluate(()=>({visible:!document.querySelector("#blockLaunch").hidden,
    amount:document.querySelectorAll("#blockLaunch .launch-piece").length}));
  assert(portal.visible,vp.name+" missing joining portal");
  assert.equal(portal.amount,12,vp.name+" portal missing blocks");
  await page.locator("#blockLaunch").waitFor({state:"hidden",timeout:4500});
  assert.equal(await page.locator("#answerGrid .answer").count(),4,vp.name+" gameplay not ready");
  await page.locator("#answerGrid .answer").first().click();
  assert.equal(await page.locator("#confirm").isDisabled(),false,vp.name+" gameplay selection blocked");
  await snap(page,vp.name+"game");
  assert.deepEqual(faults,[],vp.name+" JS errors");
  checks.push({viewport:vp.name,start,choreography:chosen,portal,game:4});
  console.log("PASS blocks "+vp.name+": scattered → domain assembled → difficulty recomposed → portal → playable");
  await page.close();
 }
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
 const errs=[];reduced.on("pageerror",e=>errs.push(e.message));
 await reduced.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
 const duration=await reduced.locator(".block-piece").first().evaluate(el=>getComputedStyle(el).transitionDuration);
 assert(duration.split(",").every(x=>parseFloat(x)===0),"reduced-motion must remove transitions");
 await reduced.selectOption("#categoryFilter","圖形缺項");
 assert.equal(await reduced.locator("#blockScene").getAttribute("data-mode"),"assembled");
 await reduced.locator("#startTen").click();
 await reduced.waitForSelector("#game.is-active");
 assert.equal(await reduced.locator("#blockLaunch").isHidden(),true,"reduced-motion portal must remain hidden");
 assert.deepEqual(errs,[]);
 await reduced.close();
}finally{await browser.close();}
await writeFile("visual-qa/block-choreography.json",JSON.stringify({tested:checks.length,reducedMotion:true,checks},null,2)+"\n");
console.log("AXIOM V0.7 block choreography PASS: "+checks.length+" viewports and reduced-motion");
