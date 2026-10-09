import {ADVANCED_PROTOTYPES,verifyAdvancedPrototype} from "./advanced-prototypes.js";

function sourcePrototype(id){
 const p=ADVANCED_PROTOTYPES.find(x=>x.id===id);
 if(!p)throw Error("missing prototype "+id);
 return p;
}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function uniqueOptions(options){return new Set(options.map(x=>JSON.stringify(x))).size===options.length;}

const pc=sourcePrototype("PC-P01");
const nc=sourcePrototype("NC-P01");
const ce=sourcePrototype("CE-P02");

export const PROMOTION_CANDIDATES=[
 {
  id:"PC-C01",source_id:pc.id,family:"proof_compression",difficulty:"Ω-candidate",published:false,
  prompt:pc.prompt,clues:pc.clues.map(x=>x.text),
  options:[[0,1,2],[0,1,3],[0,2,3],[1,2,3]],
  option_labels:["線索 1・2・3","線索 1・2・4","線索 1・3・4","線索 2・3・4"],answer:0,
  generator:{id:"proof_compression_candidate_v1",version:"0.5.3",seed:null,reproducibility:"deterministic_static"},
  provenance:{origin:"axiom_original",derived_from:pc.id},
  hint_steps:[
   {stage:"structural",text:"先把完整線索視為一個唯一解系統，再問哪些線索拿掉後仍只剩同一個解。"},
   {stage:"stronger",text:"不要逐條猜；從三條線索的組合開始，分別重新求解並比較解集合。"},
   {stage:"near_solution",text:"優先檢查 B+C=1、B+D=0 與『總和只有 1 個為 1』是否已能鎖定全部四個開關。"}
  ],
  explain:"唯一的最小充分集合是線索 1、2、3；任何兩條都不足以唯一決定同一世界。",
  render:{kind:"clue_subset_cards",ready:false},
  editorial:{human_qa:"pending",difficulty_review:"pending",calibrated:false,published:false}
 },
 {
  id:"NC-C01",source_id:nc.id,family:"necessary_clue",difficulty:"Ω-candidate",published:false,
  prompt:nc.prompt,clues:nc.clues.map(x=>x.text),
  options:[0,1,2,3],option_labels:["線索 1","線索 2","線索 3","線索 4"],answer:2,
  generator:{id:"necessary_clue_candidate_v1",version:"0.5.3",seed:null,reproducibility:"deterministic_static"},
  provenance:{origin:"axiom_original",derived_from:nc.id},
  hint_steps:[
   {stage:"structural",text:"先確認全部線索的唯一解，再一次只刪除一條，觀察解是否仍然只有原本那一個。"},
   {stage:"stronger",text:"必要線索不是『看起來重要』，而是刪除後解集合真的擴大或改變。"},
   {stage:"near_solution",text:"特別檢查 A+D=0；拿掉這條後，A 與 D 是否可能產生第二個合法狀態？"}
  ],
  explain:"只有線索 3 被移除時，系統不再維持原本的唯一解，因此它是唯一必要線索。",
  render:{kind:"necessary_clue_cards",ready:false},
  editorial:{human_qa:"pending",difficulty_review:"pending",calibrated:false,published:false}
 },
 {
  id:"CE-C01",source_id:ce.id,family:"counterexample_hunt",difficulty:"Ω-candidate",published:false,
  prompt:ce.prompt,clues:[],
  options:[
   {sides:3,fill:1,direction:"E"},
   {sides:4,fill:1,direction:"E"},
   {sides:5,fill:1,direction:"E"},
   {sides:3,fill:0,direction:"E"}
  ],
  option_labels:["實心・向東・三邊形","實心・向東・四邊形","實心・向東・五邊形","空心・向東・三邊形"],answer:0,
  generator:{id:"counterexample_candidate_v1",version:"0.5.3",seed:null,reproducibility:"deterministic_static"},
  provenance:{origin:"axiom_original",derived_from:ce.id},
  hint_steps:[
   {stage:"structural",text:"反例必須同時滿足假說的前提，卻讓結論為假；先把這兩件事分開檢查。"},
   {stage:"stronger",text:"前提要求『實心且向東』，所以不符合前提的圖形不能算反例。"},
   {stage:"near_solution",text:"要讓『一定是偶數邊』失敗，邊數必須是奇數；接著比較哪個反例的邊數最少。"}
  ],
  explain:"實心、向東、三邊形滿足前提但不是偶數邊，而且 3 是宣告範圍內最小邊數，因此是唯一最小反例。",
  render:{kind:"counterexample_polygon_cards",ready:false},
  editorial:{human_qa:"pending",difficulty_review:"pending",calibrated:false,published:false}
 }
];

function semanticMatches(candidate,result){
 if(candidate.family==="proof_compression"){
  const targets=result.minimal_sets;
  return candidate.options.map((x,i)=>targets.some(t=>same(x,t))?i:-1).filter(i=>i>=0);
 }
 if(candidate.family==="necessary_clue"){
  const targets=result.necessary;
  return candidate.options.map((x,i)=>targets.includes(x)?i:-1).filter(i=>i>=0);
 }
 if(candidate.family==="counterexample_hunt"){
  const targets=result.minimal;
  return candidate.options.map((x,i)=>targets.some(t=>same(x,t))?i:-1).filter(i=>i>=0);
 }
 return [];
}
function semanticUnique(candidate,result){
 if(candidate.family==="proof_compression")return result.minimal_sets.length===1;
 if(candidate.family==="necessary_clue")return result.necessary.length===1;
 if(candidate.family==="counterexample_hunt")return result.minimal.length===1;
 return false;
}

export function evaluatePromotionCandidate(candidate){
 const proto=sourcePrototype(candidate.source_id);
 const verified=verifyAdvancedPrototype(proto);
 const result=verified.result||{};
 const matches=verified.pass?semanticMatches(candidate,result):[];
 const hintStages=(candidate.hint_steps||[]).map(x=>x.stage);
 const checks={
  source_verified:verified.pass===true,
  semantic_task_unique:verified.pass===true&&semanticUnique(candidate,result),
  options_unique:Array.isArray(candidate.options)&&candidate.options.length===4&&uniqueOptions(candidate.options),
  displayed_answer_unique:matches.length===1&&matches[0]===candidate.answer,
  hint_contract:same(hintStages,["structural","stronger","near_solution"])&&candidate.hint_steps.every(x=>typeof x.text==="string"&&x.text.length>10),
  solution_separated:typeof candidate.explain==="string"&&candidate.explain.length>10&&candidate.hint_steps.every(x=>x.text!==candidate.explain),
  render_ready:candidate.render?.ready===true,
  human_qa:candidate.editorial?.human_qa==="approved",
  difficulty_review:candidate.editorial?.difficulty_review==="approved",
  unpublished:candidate.published===false&&candidate.editorial?.published===false
 };
 const machineKeys=["source_verified","semantic_task_unique","options_unique","displayed_answer_unique","hint_contract","solution_separated","unpublished"];
 const promotionKeys=[...machineKeys,"render_ready","human_qa","difficulty_review"];
 const machine_ready=machineKeys.every(k=>checks[k]);
 const promotion_ready=promotionKeys.every(k=>checks[k]);
 const blockers=promotionKeys.filter(k=>!checks[k]);
 return {id:candidate.id,source_id:candidate.source_id,family:candidate.family,machine_ready,promotion_ready,checks,blockers,matches};
}

export function auditPromotionCandidates(){
 const results=PROMOTION_CANDIDATES.map(evaluatePromotionCandidate);
 return {
  total:results.length,
  machine_ready:results.filter(x=>x.machine_ready).length,
  promotion_ready:results.filter(x=>x.promotion_ready).length,
  published:PROMOTION_CANDIDATES.filter(x=>x.published).length,
  results
 };
}
