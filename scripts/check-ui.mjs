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
  assert.equal(await page.evaluate(()=>window.AXIOM_QA?.build),"V0.8.1-20261009",
    "stale browser JavaScript in "+width+"x"+height);
  assert.equal(await page.locator(".app-header, .hero-content, .filter-heading").count(),0,"requested panels still present "+width+"x"+height);
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
 assert.equal(await full.evaluate(()=>window.AXIOM_QA.state.pool.length),62);
 assert.equal(await full.locator("#detailButton").count(),0,"題意 button must be removed");
 assert.equal(await full.locator("#hintButton").count(),1);
 assert.equal(await full.locator("#clearButton").count(),1);
 const firstHintQuestion=await full.evaluate(()=>window.AXIOM_QA.state.pool[window.AXIOM_QA.state.index]);
 assert.equal(firstHintQuestion.hint_steps.length,2,"expected two progressive hint stages");
 assert((await full.locator("#hintButton").innerText()).includes("1 / 2"));
 await full.locator("#hintButton").click();
 assert.equal(await full.locator("#dialog").evaluate(x=>x.open),true);
 assert((await full.locator("#dialogTitle").innerText()).includes("提示 1 / 2"));
 assert.equal(await full.locator("#dialogText").innerText(),firstHintQuestion.hint_steps[0].text);
 await full.locator("#dialogClose").click();
 assert.equal(await full.locator("#hintButton").isDisabled(),false);
 assert((await full.locator("#hintButton").innerText()).includes("2 / 2"));
 await full.locator("#hintButton").click();
 assert((await full.locator("#dialogTitle").innerText()).includes("提示 2 / 2"));
 assert.equal(await full.locator("#dialogText").innerText(),firstHintQuestion.hint_steps[1].text);
 await full.locator("#dialogClose").click();
 assert.equal(await full.locator("#hintButton").isDisabled(),true);
 assert.equal(await full.evaluate(()=>window.AXIOM_QA.state.hints),2);
 for(let i=0;i<62;i++){
  await full.waitForFunction(()=>{const im=document.getElementById("mainFigure");return im.complete&&im.naturalWidth>0;});
  assert.equal(await full.locator(".answer").count(),4);
  const imageCount=await full.locator(".answer img").evaluateAll(imgs=>imgs.filter(x=>x.complete&&x.naturalWidth>0).length);
  assert.equal(imageCount,4,"missing option imagery at full trial "+(i+1));
  await full.locator(".answer").first().click();
  await full.locator("#confirm").click();
 }
 await full.waitForSelector("#results.is-active");
 assert(!pageErrors.length,"62-puzzle sweep JS errors: "+pageErrors.join(";"));
 await full.locator("#reviewButton").click();
 assert.equal(await full.locator("#dialog").evaluate(x=>x.open),true);
 await full.locator("#dialogClose").click();
 await full.close();
 console.log("PASS: all 62 puzzles render 4 graphical choices and complete the full trial");

 // Regression: the truth-tellers, ordering and logic-grid questions must
 // display every essential statement directly inside the puzzle stage.
 for(const [category,minCount] of [["真假命題",4],["排序／分組",5],["Logic Grid",6]]){
  for(const [width,height] of [[320,568],[390,844],[1440,900],[667,375]]){
   const p=await browser.newPage({viewport:{width,height}});
   await p.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
   await p.selectOption("#categoryFilter",category);
   await p.locator("#startAll").click();
   // Do not test only a randomly selected first puzzle: category templates may
   // legitimately contain different clue counts, e.g. ORD05 has six rather than five.
   const ids=await p.evaluate(category=>window.AXIOM_QA.bank.filter(q=>q.category===category).map(q=>q.id),category);
   for(const id of ids){
    await p.evaluate(id=>{
     const qa=window.AXIOM_QA,q=qa.bank.find(q=>q.id===id);
     qa.state.pool=[q];qa.state.index=0;qa.render();
    },id);
    const question=await p.evaluate(()=>window.AXIOM_QA.state.pool[0]);
    const expectedCount=question.clues?.length||0;
    assert(expectedCount>=minCount&&expectedCount<=6,"invalid clue count "+category+" "+id);
    if(category==="排序／分組")assert([5,6].includes(expectedCount),"ordering clue count "+id);
    assert.equal(await p.locator("#clueBoard .clue-card").count(),expectedCount,id+" clue cards");
    assert.equal(await p.locator("#clueBoard").isVisible(),true,id+" clues hidden at "+width);
    assert.equal(await p.locator("#mainFigure").isVisible(),false,id+" placeholder visible");
    const checks=await p.locator("#clueBoard .clue-card").evaluateAll(cards=>cards.map(card=>{
     const content=card.querySelector(".clue-copy"),c=content.getBoundingClientRect(),b=card.getBoundingClientRect();
     return {text:content.textContent,visible:!!content.textContent.trim(),inside:
       c.left>=b.left-1&&c.right<=b.right+1&&c.top>=b.top-2&&c.bottom<=b.bottom+2,
       fits:content.scrollHeight<=content.clientHeight+1&&card.scrollHeight<=card.clientHeight+1};
    }));
    assert(checks.every(x=>x.visible),id+" empty statement");
    assert(checks.every(x=>x.inside&&x.fits),id+" clipped statements "+width+"x"+height+" "+JSON.stringify(checks));
    const currentText=await p.locator("#clueBoard").innerText();
    for(const clue of question.clues){
     const normalized=clue.replace(/^[A-D]：/,"");
     assert(currentText.includes(normalized),id+" missing rule: "+normalized);
    }
    const doc=await p.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
    assert(doc.width<=width+1&&doc.height<=height+1,id+" document overflow "+width+"x"+height);
    await p.locator("#zoomButton").click();
    assert((await p.locator("#dialogText").innerText()).includes(question.clues[0]),id+" enlarged rules missing");
    await p.locator("#dialogClose").click();
    console.log("PASS "+category+" "+id+" @ "+width+"x"+height+": all "+expectedCount+" rules visible and unclipped");
   }
   await p.close();
  }
 }
} finally {await browser.close();}
console.log("AXIOM browser QA PASS: "+passed+"/"+viewports.length+" viewports");
