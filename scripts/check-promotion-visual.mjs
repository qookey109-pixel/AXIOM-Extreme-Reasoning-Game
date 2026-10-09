import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const out="visual-qa",records=[],errors=[];
await mkdir(out,{recursive:true});
try{
 for(const viewport of [{name:"mobile",width:390,height:844},{name:"desktop",width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
  page.on("pageerror",e=>errors.push(viewport.name+": "+e.message));
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
  const candidates=await page.evaluate(async()=>{
   const {PROMOTION_CANDIDATES}=await import("/src/promotion-candidates.js");
   return PROMOTION_CANDIDATES.map(q=>({id:q.id,family:q.family}));
  });
  assert.equal(candidates.length,3);
  for(const candidate of candidates){
   const result=await page.evaluate(async ({id,viewport})=>{
    const [{PROMOTION_CANDIDATES},{renderCandidateFigure,renderCandidateOption}]=await Promise.all([
     import("/src/promotion-candidates.js"),import("/src/candidate-graphics.js")
    ]);
    const q=PROMOTION_CANDIDATES.find(x=>x.id===id);
    if(!q||q.published!==false)throw Error("candidate missing or published "+id);
    const figure=renderCandidateFigure(q);
    const tiles=q.options.map((_,i)=>renderCandidateOption(q,i));
    document.body.innerHTML="";
    document.body.style.cssText="margin:0;padding:18px;font-family:system-ui;background:#f6f4ef;color:#17202a;box-sizing:border-box";
    const title=document.createElement("h1");title.textContent="AXIOM — "+q.id+" | UNPUBLISHED QA";title.style.cssText="font-size:21px;margin:0 0 14px";
    const prompt=document.createElement("p");prompt.textContent=q.prompt;prompt.style.cssText="font-size:17px;font-weight:800;line-height:1.5;margin:0 0 12px";
    const main=document.createElement("img");main.src=figure;main.style.cssText="display:block;object-fit:contain;max-width:100%;height:auto;max-height:210px;margin:auto";
    const clues=document.createElement("div");clues.style.cssText="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:12px 0";
    for(const [i,text] of q.clues.entries()){
     const clue=document.createElement("div");clue.textContent=(i+1)+". "+text;
     clue.style.cssText="font-size:14px;font-weight:650;padding:8px;background:#fff;border-radius:9px;overflow-wrap:anywhere";
     clues.append(clue);
    }
    const cards=document.createElement("div");
    cards.style.cssText="display:grid;grid-template-columns:repeat("+ (viewport.width<650?"2":"4")+",minmax(0,1fr));gap:8px";
    const imgNodes=[];
    tiles.forEach((src,i)=>{
     const card=document.createElement("div");card.style.cssText="min-width:0;background:#fff;border:2px solid #bac4d2;border-radius:13px;padding:6px";
     const img=document.createElement("img");img.src=src;img.alt="option "+(i+1);img.style.cssText="display:block;width:100%;height:auto";
     const label=document.createElement("div");label.textContent="ABCD"[i]+" · "+q.option_labels[i];
     label.style.cssText="font-size:12px;font-weight:750;text-align:center;overflow-wrap:anywhere";
     card.append(img,label);cards.append(card);imgNodes.push(img);
    });
    document.body.append(title,prompt,main,clues,cards);
    // Canvas pixel-level nonempty check rather than only naturalWidth or alt labels.
    function countInk(img){
     const cvs=document.createElement("canvas");cvs.width=img.naturalWidth;cvs.height=img.naturalHeight;
     const ctx=cvs.getContext("2d",{willReadFrequently:true});ctx.drawImage(img,0,0);
     const pix=ctx.getImageData(0,0,cvs.width,cvs.height).data;let n=0;
     for(let y=0;y<cvs.height;y+=2)for(let x=0;x<cvs.width;x+=2){
      const p=(y*cvs.width+x)*4;
      if(pix[p+3]>180&&pix[p]<175&&pix[p+1]<175&&pix[p+2]<190)n++;
     }return n;
    }
    return {id:q.id,kind:q.render.kind,optionCounts:imgNodes.map(countInk),
     mainInk:countInk(main),sizes:imgNodes.map(x=>[x.naturalWidth,x.naturalHeight]),
     uniqueImages:new Set(tiles).size,clueCount:clues.childElementCount,expectedClues:q.clues.length,
     docWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};
   },{id:candidate.id,viewport});
   assert.equal(result.uniqueImages,4,candidate.id+" visually duplicate card");
   assert(result.optionCounts.every(x=>x>75),candidate.id+" blank candidate option "+JSON.stringify(result.optionCounts));
   assert(result.mainInk>200,candidate.id+" blank candidate question figure");
   assert(result.sizes.every(x=>x[0]===340&&x[1]===190),candidate.id+" bad candidate raster dimensions");
   assert.equal(result.clueCount,result.expectedClues,candidate.id+" missing visible clues");
   assert(result.docWidth<=result.viewportWidth+1,candidate.id+" page overflow");
   records.push({viewport:viewport.name,...result});
   await page.screenshot({path:out+"/promotion-"+viewport.name+"-"+candidate.id+".png",fullPage:true,animations:"disabled"});
   console.log("PASS "+viewport.name+" "+candidate.id+" candidate option ink="+result.optionCounts.join(","));
  }
  await page.close();
 }
}finally{await browser.close();}
await writeFile(out+"/promotion-audit.json",JSON.stringify({total:records.length,errors,records},null,2)+"\n");
assert.equal(records.length,6,"3 candidates x 2 viewports");
assert.deepEqual(errors,[],"browser errors");
console.log("AXIOM unpublished Ω candidate visual QA PASS: "+records.length+" sheets / 24 answer tiles");
