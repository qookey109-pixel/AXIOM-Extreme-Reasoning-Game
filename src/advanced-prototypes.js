/*
 * AXIOM V0.5 — unpublished finite-proof prototypes.
 *
 * These are machine-verifiable research fixtures, not player-facing questions.
 * They exercise proof-compression, necessary-clue and counterexample semantics
 * before any new family is admitted to the published 50-puzzle catalog.
 */

function bitUniverse(size=4){
 return Array.from({length:1<<size},(_,mask)=>
  Array.from({length:size},(_,i)=>(mask>>i)&1));
}
function equalWorld(a,b){
 return a.length===b.length&&a.every((x,i)=>x===b[i]);
}
function evalBitClue(world,clue){
 if(clue.kind==="eq")return world[clue.index]===clue.value;
 if(clue.kind==="xor")return (world[clue.a]^world[clue.b])===clue.value;
 if(clue.kind==="pair_sum")return world[clue.a]+world[clue.b]===clue.value;
 if(clue.kind==="sum")return world.reduce((a,b)=>a+b,0)===clue.value;
 if(clue.kind==="implies")return !world[clue.a]||!!world[clue.b];
 throw Error("unknown bit clue "+clue.kind);
}
function solveBitWorlds(clues,size=4){
 return bitUniverse(size).filter(world=>clues.every(clue=>evalBitClue(world,clue)));
}
function subsetsOfSize(items,k){
 const out=[];
 function walk(start,prefix){
  if(prefix.length===k){out.push(prefix.slice());return;}
  for(let i=start;i<=items.length-(k-prefix.length);i++){
   prefix.push(items[i]);walk(i+1,prefix);prefix.pop();
  }
 }
 walk(0,[]);return out;
}
function minimumSufficientClueSets(proto){
 const full=solveBitWorlds(proto.clues,proto.bit_count);
 if(full.length!==1)return {full_solutions:full,minimum_size:null,minimal_sets:[]};
 const target=full[0],indices=proto.clues.map((_,i)=>i);
 for(let k=1;k<=indices.length;k++){
  const minimal_sets=subsetsOfSize(indices,k).filter(sub=>{
   const solved=solveBitWorlds(sub.map(i=>proto.clues[i]),proto.bit_count);
   return solved.length===1&&equalWorld(solved[0],target);
  });
  if(minimal_sets.length)return {full_solutions:full,minimum_size:k,minimal_sets};
 }
 return {full_solutions:full,minimum_size:null,minimal_sets:[]};
}
function necessaryClues(proto){
 const full=solveBitWorlds(proto.clues,proto.bit_count);
 if(full.length!==1)return {full_solutions:full,necessary:[],removal_counts:[]};
 const target=full[0],necessary=[],removal_counts=[];
 proto.clues.forEach((_,removed)=>{
  const solved=solveBitWorlds(proto.clues.filter((__,i)=>i!==removed),proto.bit_count);
  removal_counts.push(solved.length);
  if(solved.length!==1||!equalWorld(solved[0],target))necessary.push(removed);
 });
 return {full_solutions:full,necessary,removal_counts};
}
function popcount(mask){
 let n=0,x=mask>>>0;while(x){n+=x&1;x>>>=1;}return n;
}
function segmentCounterexamples(proto){
 const labels=proto.labels,bitOf=Object.fromEntries(labels.map((x,i)=>[x,i]));
 const masks=Array.from({length:1<<labels.length},(_,i)=>i);
 const present=(mask,label)=>!!(mask&(1<<bitOf[label]));
 const matchesPremise=mask=>proto.hypothesis.premise.all_present.every(x=>present(mask,x));
 const matchesConclusion=mask=>present(mask,proto.hypothesis.conclusion.present);
 const counterexamples=masks.filter(mask=>matchesPremise(mask)&&!matchesConclusion(mask));
 const score=mask=>popcount(mask);
 const minimum=Math.min(...counterexamples.map(score));
 return {counterexamples,minimum,minimal:counterexamples.filter(x=>score(x)===minimum)};
}
function polygonCounterexamples(proto){
 const worlds=[];
 for(let sides=proto.domain.sides[0];sides<=proto.domain.sides[1];sides++){
  for(const fill of proto.domain.fill)for(const direction of proto.domain.direction)worlds.push({sides,fill,direction});
 }
 const premise=w=>w.fill===proto.hypothesis.premise.fill&&w.direction===proto.hypothesis.premise.direction;
 const conclusion=w=>proto.hypothesis.conclusion==="even_sides"?w.sides%2===0:false;
 const counterexamples=worlds.filter(w=>premise(w)&&!conclusion(w));
 const minimum=Math.min(...counterexamples.map(w=>w.sides));
 return {counterexamples,minimum,minimal:counterexamples.filter(w=>w.sides===minimum)};
}

export const ADVANCED_PROTOTYPES=[
 {
  id:"PC-P01",family:"proof_compression",difficulty:"Ω-prototype",published:false,
  bit_count:4,
  prompt:"四個開關只可能是 0 或 1。全部線索能唯一決定狀態；最少保留哪些線索仍足以唯一證明同一狀態？",
  clues:[
   {kind:"pair_sum",a:1,b:2,value:1,text:"B + C = 1"},
   {kind:"pair_sum",a:1,b:3,value:0,text:"B + D = 0"},
   {kind:"sum",value:1,text:"四個開關合計只有 1 個為 1"},
   {kind:"implies",a:3,b:2,text:"若 D = 1，則 C = 1"}
  ],
  expected:{solution:[0,0,1,0],minimum_size:3,minimal_sets:[[0,1,2]]}
 },
 {
  id:"PC-P02",family:"proof_compression",difficulty:"Ω-prototype",published:false,
  bit_count:4,
  prompt:"找出能維持唯一解的最小線索子集；不得靠未列出的額外規則。",
  clues:[
   {kind:"xor",a:1,b:2,value:1,text:"B XOR C = 1"},
   {kind:"pair_sum",a:2,b:3,value:0,text:"C + D = 0"},
   {kind:"implies",a:0,b:2,text:"若 A = 1，則 C = 1"},
   {kind:"implies",a:2,b:1,text:"若 C = 1，則 B = 1"},
   {kind:"implies",a:3,b:2,text:"若 D = 1，則 C = 1"}
  ],
  expected:{solution:[0,1,0,0],minimum_size:3,minimal_sets:[[0,1,2]]}
 },
 {
  id:"NC-P01",family:"necessary_clue",difficulty:"Expert-prototype",published:false,
  bit_count:4,
  prompt:"全部線索有唯一解。移除哪一條會讓解不再唯一？",
  clues:[
   {kind:"eq",index:1,value:0,text:"B = 0"},
   {kind:"pair_sum",a:0,b:2,value:1,text:"A + C = 1"},
   {kind:"pair_sum",a:0,b:3,value:0,text:"A + D = 0"},
   {kind:"sum",value:1,text:"四個開關合計只有 1 個為 1"}
  ],
  expected:{solution:[0,0,1,0],necessary:[2],removal_counts:[1,1,2,1]}
 },
 {
  id:"NC-P02",family:"necessary_clue",difficulty:"Ω-prototype",published:false,
  bit_count:4,
  prompt:"找出唯一不可刪除的關鍵線索；其他線索各自移除仍維持同一唯一解。",
  clues:[
   {kind:"eq",index:0,value:0,text:"A = 0"},
   {kind:"pair_sum",a:0,b:3,value:1,text:"A + D = 1"},
   {kind:"pair_sum",a:1,b:2,value:0,text:"B + C = 0"},
   {kind:"xor",a:1,b:3,value:1,text:"B XOR D = 1"},
   {kind:"implies",a:0,b:1,text:"若 A = 1，則 B = 1"}
  ],
  expected:{solution:[0,0,0,1],necessary:[2],removal_counts:[1,1,2,1,1]}
 },
 {
  id:"CE-P01",family:"counterexample_hunt",difficulty:"Expert-prototype",published:false,
  prompt:"假說：只要圖形同時含 N 與 W 線段，就一定含 S 線段。找出線段數最少的反例。",
  kind:"segments",
  labels:["N","E","S","W"],
  hypothesis:{premise:{all_present:["N","W"]},conclusion:{present:"S"}},
  expected:{minimum_complexity:2,minimal:[9]}
 },
 {
  id:"CE-P02",family:"counterexample_hunt",difficulty:"Ω-prototype",published:false,
  prompt:"假說：實心且箭頭向東的多邊形一定有偶數邊。找出邊數最少的反例。",
  kind:"polygon",
  domain:{sides:[3,8],fill:[0,1],direction:["N","E","S","W"]},
  hypothesis:{premise:{fill:1,direction:"E"},conclusion:"even_sides"},
  expected:{minimum_complexity:3,minimal:[{sides:3,fill:1,direction:"E"}]}
 }
];

export function verifyAdvancedPrototype(proto){
 if(proto.published!==false)return {id:proto.id,pass:false,reason:"prototype must stay unpublished"};
 if(proto.family==="proof_compression"){
  const result=minimumSufficientClueSets(proto);
  const target=result.full_solutions[0];
  const pass=result.full_solutions.length===1&&equalWorld(target,proto.expected.solution)&&
   result.minimum_size===proto.expected.minimum_size&&
   JSON.stringify(result.minimal_sets)===JSON.stringify(proto.expected.minimal_sets);
  return {id:proto.id,family:proto.family,pass,result};
 }
 if(proto.family==="necessary_clue"){
  const result=necessaryClues(proto),target=result.full_solutions[0];
  const pass=result.full_solutions.length===1&&equalWorld(target,proto.expected.solution)&&
   JSON.stringify(result.necessary)===JSON.stringify(proto.expected.necessary)&&
   JSON.stringify(result.removal_counts)===JSON.stringify(proto.expected.removal_counts);
  return {id:proto.id,family:proto.family,pass,result};
 }
 if(proto.family==="counterexample_hunt"){
  const result=proto.kind==="segments"?segmentCounterexamples(proto):polygonCounterexamples(proto);
  const pass=result.counterexamples.length>0&&result.minimum===proto.expected.minimum_complexity&&
   JSON.stringify(result.minimal)===JSON.stringify(proto.expected.minimal)&&result.minimal.length===1;
  return {id:proto.id,family:proto.family,pass,result};
 }
 return {id:proto.id,pass:false,reason:"unknown family"};
}

export function auditAdvancedPrototypes(){
 const results=ADVANCED_PROTOTYPES.map(verifyAdvancedPrototype);
 return {
  total:results.length,
  passed:results.filter(x=>x.pass).length,
  families:[...new Set(ADVANCED_PROTOTYPES.map(x=>x.family))],
  published:ADVANCED_PROTOTYPES.filter(x=>x.published).length,
  results
 };
}
