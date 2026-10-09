import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {chromium} from "playwright";

const folder="visual-qa";
await mkdir(folder,{recursive:true});
const viewports=[
 {name:"mobile",width:390,height:844},
 {name:"desktop",width:1440,height:900}
];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[],records=[],counts={mobile:0,desktop:0};
let totalChoices=0;
try{
 for(const {name,width,height} of viewports){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
  await page.locator("#startAll").click();
  const questions=await page.evaluate(()=>window.AXIOM_QA.bank.map(q=>({
   id:q.id,category:q.category,figure:q.figure.kind,clueCount:q.clues?.length||0
  })));
  assert.equal(questions.length,50,"full catalog must contain 50 puzzles");
  const screenshotCategories=new Set();
  for(const q of questions){
   await page.evaluate(id=>{
    const qa=window.AXIOM_QA;
    const found=qa.bank.find(q=>q.id===id);
    if(!found)throw Error("question not found: "+id);
    qa.state.pool=[found];
    qa.state.index=0;
    qa.render();
   },q.id);
   await page.waitForFunction(()=>document.getElementById("mainFigure").complete&&
    [...document.querySelectorAll(".answer img")].length===4&&
    [...document.querySelectorAll(".answer img")].every(x=>x.complete&&x.naturalWidth>0),{timeout:8000});
   const stats=await page.evaluate(()=>{
    function inkCount(img){
     const canvas=document.createElement("canvas");
     canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
     const context=canvas.getContext("2d",{willReadFrequently:true});
     context.drawImage(img,0,0);
     const rgba=context.getImageData(0,0,canvas.width,canvas.height).data;
     let n=0;
     for(let y=0;y<canvas.height;y+=2)for(let x=0;x<canvas.width;x+=2){
      const i=(y*canvas.width+x)*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2],a=rgba[i+3];
      // Ignore the off-white Canvas background and count dark visible geometry.
      if(a>180&&r<175&&g<175&&b<185)n++;
     }
     return n;
    }
    const main=document.getElementById("mainFigure");
    return {
     id:document.getElementById("questionId").textContent,
     main:{pixels:inkCount(main),visible:getComputedStyle(main).display!=="none"},
     options:[...document.querySelectorAll(".answer img")].map((img,i)=>({
      option:"ABCD"[i],pixels:inkCount(img),width:img.naturalWidth,height:img.naturalHeight
     })),
     clueCards:document.querySelectorAll("#clueBoard .clue-card").length,
     pageSize:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}
    };
   });
   const problems=[];
   if(stats.id!==q.id)problems.push("question id mismatch");
   if(stats.options.length!==4)problems.push("answer count not four");
   for(const choice of stats.options){
    if(choice.pixels<35)problems.push("blank/near-blank answer "+choice.option+" ("+choice.pixels+" dark pixels)");
    if(choice.width!==340||choice.height!==190)problems.push("bad answer size "+choice.option);
   }
   if(!q.clueCount&&stats.main.pixels<35)problems.push("blank/near-blank puzzle image");
   if(q.clueCount&&stats.clueCards!==q.clueCount)problems.push("missing visible clue cards");
   if(stats.pageSize.width>width+1||stats.pageSize.height>height+1)problems.push("body overflow");
   records.push({viewport:name,id:q.id,category:q.category,figure:q.figure,choices:stats.options,main:stats.main,issues:problems});
   if(problems.length)failures.push({viewport:name,id:q.id,problems});
   if(name==="mobile"||!screenshotCategories.has(q.category)){
    await page.screenshot({path:folder+"/"+name+"-"+q.id+".png",animations:"disabled"});
    screenshotCategories.add(q.category);
   }
   totalChoices+=4;counts[name]++;
   console.log((problems.length?"FAIL":"PASS")+" "+name+" "+q.id+
    " answer ink="+stats.options.map(x=>x.pixels).join(",")+
    (problems.length?" "+problems.join("; "):""));
  }
  if(errors.length)failures.push({viewport:name,pageErrors:errors});
  await page.close();
 }
} finally {
 await browser.close();
 await writeFile(folder+"/audit.json",JSON.stringify({
  recordedAt:new Date().toISOString(),counts,totalChoices,failures,records
 },null,2)+"\n");
}
console.log("AXIOM visual QA: "+JSON.stringify({
 counts,totalChoices,failures:failures.length,captureDirectory:folder
}));
assert.equal(counts.mobile,50,"mobile must render all 50 puzzles");
assert.equal(counts.desktop,50,"desktop must render all 50 puzzles");
assert.equal(totalChoices,400,"must inspect 4 choices x 50 puzzles x 2 viewports");
assert.deepEqual(failures,[],"blank images, rendering faults, or layout issues found");
