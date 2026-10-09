import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {chromium} from "playwright";

await mkdir("visual-qa",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const records=[];
const viewports=[
 {label:"tiny",width:320,height:568},
 {label:"mobile",width:390,height:844},
 {label:"landscape",width:667,height:375},
 {label:"tablet",width:768,height:1024},
 {label:"desktop",width:1440,height:900}
];
try{
 for(const size of viewports){
  const page=await browser.newPage({viewport:{width:size.width,height:size.height}});
  const faults=[];page.on("pageerror",e=>faults.push(e.message));
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
  const before=await page.evaluate(()=>{
   const canvas=document.querySelector("#liquidField");
   const hero=document.querySelector(".hero"),figure=document.querySelector(".hero-art");
   const c=getComputedStyle(hero);
   return {canvas:!!canvas,mode:canvas?.dataset.renderMode,
    mood:canvas?.dataset.mood,canvasWidth:canvas?.width,
    canvasHeight:canvas?.height,htmlWidth:document.documentElement.scrollWidth,
    htmlHeight:document.documentElement.scrollHeight,
    heroRadius:c.borderTopLeftRadius,heroBackground:c.backgroundColor,
    artDisplay:getComputedStyle(figure).display,
    removedPanels:[".app-header",".hero-content",".filter-heading"].every(s=>!document.querySelector(s)),
    pageBuild:window.AXIOM_QA.build,blocks:document.querySelectorAll(".block-piece").length,
    sceneWidth:figure.getBoundingClientRect().width,heroWidth:hero.getBoundingClientRect().width,
    dockInside:hero.contains(document.querySelector(".filters"))};
  });
  assert.equal(before.pageBuild,"V0.8.3-20261009",size.label+" wrong build");
  assert(before.canvas,size.label+" missing liquid field");
  assert(["webgl","fallback"].includes(before.mode),size.label+" missing shader/fallback");
  assert.equal(before.blocks,12,size.label+" lost assembly pieces");
  assert.equal(before.heroRadius,"0px",size.label+" expected unframed editorial art");
  assert(before.removedPanels,size.label+" old panels still present");
  assert(Math.abs(before.sceneWidth-before.heroWidth)<3,size.label+" artwork must span full stage");
  assert(before.dockInside,size.label+" controls must live inside liquid hero");
  assert(before.htmlWidth<=size.width+1&&before.htmlHeight<=size.height+1,size.label+" home overflow");
  await page.screenshot({path:"visual-qa/liquid-"+size.label+"-home.png",animations:"disabled"});
  const options=await page.locator("#categoryFilter option").allTextContents();
  assert(options.includes("圖形缺項"));
  await page.selectOption("#categoryFilter","圖形缺項");
  await page.locator('#difficultyFilter [data-value="Expert"]').click();
  const after=await page.evaluate(()=>({
   mode:document.querySelector("#blockScene").dataset.mode,
   mood:document.querySelector("#liquidField").dataset.mood,
   choices:window.AXIOM_QA.state.category+"-"+window.AXIOM_QA.state.difficulty,
   width:document.documentElement.scrollWidth,
   height:document.documentElement.scrollHeight
  }));
  assert.equal(after.mode,"assembled",size.label+" blocks did not magnetize");
  assert.notEqual(after.mood,before.mood,size.label+" light field did not react to selection");
  assert(after.width<=size.width+1&&after.height<=size.height+1,size.label+" changed selection overflow");
  await page.screenshot({path:"visual-qa/liquid-"+size.label+"-assembled.png",animations:"disabled"});
  await page.locator("#startTen").click();
  await page.waitForSelector("#game.is-active");
  await page.locator("#blockLaunch").waitFor({state:"hidden",timeout:4500});
  const game=await page.evaluate(()=>({
   screen:document.body.dataset.screen,
   cardCount:document.querySelectorAll("#answerGrid .answer").length,
   docWidth:document.documentElement.scrollWidth,docHeight:document.documentElement.scrollHeight,
   stageColor:getComputedStyle(document.querySelector(".stage")).backgroundColor,
   docBg:getComputedStyle(document.querySelector("#game")).backgroundColor,
   images:[...document.querySelectorAll("#answerGrid img")].every(x=>x.complete&&x.naturalWidth>0)
  }));
  assert.equal(game.screen,"game");
  assert.equal(game.cardCount,4);
  assert(game.images,size.label+" answer missing");
  assert.equal(game.docBg,"rgb(255, 255, 255)",size.label+" game must stay light");
  assert(game.docWidth<=size.width+1&&game.docHeight<=size.height+1,size.label+" gameplay overflow");
  await page.locator("#answerGrid .answer").first().click();
  assert.equal(await page.locator("#confirm").isDisabled(),false,size.label+" confirm blocked");
  await page.screenshot({path:"visual-qa/liquid-"+size.label+"-game.png",animations:"disabled"});
  assert.deepEqual(faults,[],size.label+" browser errors");
  records.push({size:size.label,before,after,game});
  console.log("PASS liquid logic "+size.label+": editorial/field/assembly/clean gameplay");
  await page.close();
 }
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
 await reduced.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
 const initial=await reduced.locator("#liquidField").evaluate(x=>({status:x.dataset.renderMode,width:x.width}));
 assert(["webgl","fallback"].includes(initial.status));
 await reduced.selectOption("#categoryFilter","圖形缺項");
 await reduced.locator("#startTen").click();
 await reduced.waitForSelector("#game.is-active");
 assert.equal(await reduced.locator("#blockLaunch").isHidden(),true,"reduced motion portal must not appear");
 await reduced.close();
}finally{await browser.close();}
await writeFile("visual-qa/liquid-logic.json",JSON.stringify({viewports:records.length,reducedMotion:true,records},null,2)+"\n");
console.log("AXIOM V0.8.3 Liquid Logic PASS: "+records.length+" viewports and accessible low-motion state");
