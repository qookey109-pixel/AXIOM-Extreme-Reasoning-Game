import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const sizes=[
 {name:"tiny-mobile",width:320,height:568},
 {name:"mobile",width:390,height:844},
 {name:"landscape",width:667,height:375},
 {name:"tablet",width:768,height:1024},
 {name:"desktop",width:1440,height:900}
];
await mkdir("visual-qa",{recursive:true});
const records=[];
try{
 for(const size of sizes){
  const page=await browser.newPage({viewport:{width:size.width,height:size.height}});
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
  const result=await page.evaluate(()=>{
   const box=el=>{const r=el.getBoundingClientRect();return {x:r.left,y:r.top,right:r.right,bottom:r.bottom,w:r.width,h:r.height}};
   const hero=document.querySelector("#home>.hero"),art=hero.querySelector(".hero-art");
   const filter=hero.querySelector(".filters"),canvas=hero.querySelector("#liquidField");
   const style=getComputedStyle(filter);
   const controls=[...filter.querySelectorAll(":scope > .control")];
   return {
    body:document.body.dataset.screen,
    hero:box(hero),art:box(art),canvas:box(canvas),controls:box(filter),
    css:{position:style.position,bg:style.backgroundColor,img:style.backgroundImage,
     borderTop:style.borderTopWidth,blur:style.backdropFilter,
     webkitBlur:style.webkitBackdropFilter},
    cardCount:controls.length,
    cardBoxes:controls.map(box),
    labelBoxes:controls.map(el=>box(el.querySelector("label"))),
    controlLabels:controls.map(el=>el.querySelector("label").innerText),
    clip:{w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight},
    canvasMode:canvas.dataset.renderMode,blockCount:hero.querySelectorAll(".block-piece").length,
    artBottomCaption:getComputedStyle(hero.querySelector(".art-bottom")).display,
    stylesheets:[...document.querySelectorAll("link[rel=stylesheet]")].map(x=>x.href)
   };
  });
  assert.equal(result.body,"home",size.name+" home state");
  assert.equal(result.canvasMode==="webgl"||result.canvasMode==="fallback",true,size.name+" invalid light field");
  assert.equal(result.blockCount,12,size.name+" missing blocks");
  assert.equal(result.cardCount,3,size.name+" missing floating controls");
  assert.equal(result.css.position,"absolute",size.name+" controls not floating");
  assert(["rgba(0, 0, 0, 0)","transparent"].includes(result.css.bg),size.name+" stripe background still exists: "+result.css.bg);
  assert.equal(result.css.img,"none",size.name+" shared gradient panel remains");
  assert.equal(result.css.borderTop,"0px",size.name+" separating border remains");
  assert(["none",""].includes(result.css.blur),size.name+" whole-band glass blur remains: "+result.css.blur);
  assert(Math.abs(result.hero.w-result.canvas.w)<=2&&Math.abs(result.hero.h-result.canvas.h)<=2,
   size.name+" liquid shader does not extend to controls");
  assert(Math.abs(result.hero.w-result.art.w)<=2&&Math.abs(result.hero.h-result.art.h)<=2,
   size.name+" art should cover full hero, not only upper region");
  assert(Math.abs(result.controls.y-result.hero.y)<=2,
   size.name+" entire interaction layer must cover full orbital stage");
  assert(Math.abs(result.controls.h-result.hero.h)<=2,
   size.name+" interactive field must have no separate bottom row");
  assert(Math.abs(result.controls.bottom-result.hero.bottom)<=2,
   size.name+" interaction plane should extend to stage bottom");
  assert.equal(result.artBottomCaption,"none",size.name+" ornamental divider still present");
  assert.equal(result.cardBoxes.length,3,"three instrument clusters");
  assert(result.clip.w<=size.width+1&&result.clip.h<=size.height+1,size.name+" page scroll/overflow");
  for(const [i,card] of result.cardBoxes.entries()){
   assert(card.x>=-1&&card.right<=size.width+1&&card.y>=-1&&card.bottom<=size.height+1,
    size.name+" floating group "+i+" clipped "+JSON.stringify(card));
   assert(result.labelBoxes[i].h>5,size.name+" control label invisible "+i);
  }
  await page.screenshot({path:"visual-qa/no-seam-"+size.name+"-home.png",animations:"disabled"});
  await page.selectOption("#categoryFilter","圖形缺項");
  await page.locator('#difficultyFilter [data-value="Expert"]').click();
  const condition=await page.evaluate(()=>({
    category:window.AXIOM_QA.state.category,
    difficulty:window.AXIOM_QA.state.difficulty,
    assembled:document.querySelector("#blockScene").dataset.mode,
    ready:!document.querySelector("#startTen").disabled
  }));
  assert.equal(condition.category,"圖形缺項",size.name+" category selection broken");
  assert.equal(condition.difficulty,"Expert",size.name+" difficulty selection broken");
  assert.equal(condition.assembled,"assembled",size.name+" sculpture didn't react");
  assert(condition.ready,size.name+" no playable questions");
  await page.screenshot({path:"visual-qa/no-seam-"+size.name+"-selected.png",animations:"disabled"});
  await page.locator("#startTen").click();
  await page.waitForSelector("#game.is-active");
  await page.locator("#blockLaunch").waitFor({state:"hidden",timeout:5000});
  assert.equal(await page.locator(".answer").count(),4,size.name+" question choices missing");
  await page.locator(".answer").nth(0).click();
  assert.equal(await page.locator("#confirm").isDisabled(),false,size.name+" gameplay not clickable");
  assert.deepEqual(errs,[],size.name+" runtime errors");
  records.push({viewport:size.name,home:result,afterSelection:condition});
  await page.close();
  console.log("PASS "+size.name+" seamless liquid field, no panel, floating controls and playable choices");
 }
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
 await reduced.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
 const anim=await reduced.locator(".block-piece").first().evaluate(x=>getComputedStyle(x).transitionDuration);
 assert(anim.split(",").every(x=>parseFloat(x)===0),"reduced motion still animates blocks");
 await reduced.locator("#startTen").click();
 await reduced.waitForSelector("#game.is-active");
 assert.equal(await reduced.locator("#blockLaunch").isHidden(),true);
 await reduced.close();
}finally{await browser.close();}
await writeFile("visual-qa/no-seam-audit.json",JSON.stringify({build:"V0.9.0",viewports:records.length,records},null,2)+"\n");
console.log("AXIOM V0.9.0 seamless-scene QA PASS: "+records.length+" viewport pairs and reduced motion");
