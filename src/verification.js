export const VERIFICATION_SCHEMA_VERSION="0.5.0";

export const FAMILY_BY_CATEGORY={
 "數字金字塔":"numeric_pyramid",
 "圓盤數字":"circle_rule",
 "路徑最佳化":"path_optimization",
 "圖形缺項":"visual_matrix",
 "圖形序列":"visual_sequence",
 "旋轉／鏡像":"rotation_reflection",
 "棋子移動":"lights_out",
 "幣值／組合限制":"coin_constraints",
 "排序／分組":"ordering_constraints",
 "Logic Grid":"logic_grid",
 "真假命題":"truth_constraints",
 "空間／展開圖":"spatial_net"
};

const MATRIX_MODELS=["xor","or","and","xor_rotate"];
const CIRCLE_MODELS=["mul_absdiff","mul_sum","two_a_plus_b2","a2_plus_two_b","sum_times_gap"];
const ROTATE_MASK=a=>((a&1)?2:0)|((a&2)?1:0)|((a&4)?8:0)|((a&8)?4:0);

function matrixOp(model,a,b){
 if(model==="xor")return a^b;
 if(model==="or")return a|b;
 if(model==="and")return a&b;
 if(model==="xor_rotate")return ROTATE_MASK(a^b);
 throw Error("unknown matrix model "+model);
}
function circleOp(model,a,b){
 if(model==="mul_absdiff")return a*b+Math.abs(a-b);
 if(model==="mul_sum")return a*b+a+b;
 if(model==="two_a_plus_b2")return 2*a+b*b;
 if(model==="a2_plus_two_b")return a*a+b*2;
 if(model==="sum_times_gap")return (a+b)*(Math.abs(a-b)+1);
 throw Error("unknown circle model "+model);
}
function permutations(arr){
 if(arr.length<2)return [arr.slice()];
 const out=[];
 arr.forEach((x,i)=>permutations(arr.slice(0,i).concat(arr.slice(i+1))).forEach(p=>out.push([x,...p])));
 return out;
}
function combinations(arr,k,start=0,prefix=[],out=[]){
 if(prefix.length===k){out.push(prefix.slice());return out;}
 for(let i=start;i<=arr.length-(k-prefix.length);i++){
  prefix.push(arr[i]);combinations(arr,k,i+1,prefix,out);prefix.pop();
 }
 return out;
}
function orderOk(p,rules){
 return rules.every(r=>{
  const a=p.indexOf(r.a),b=r.b?p.indexOf(r.b):-1;
  if(r.kind==="before")return a<b;
  if(r.kind==="touch")return b===a+1;
  if(r.kind==="inside")return a>0&&a<p.length-1;
  if(r.kind==="apart")return Math.abs(a-b)>1;
  return false;
 });
}
function allPathWitnesses(vals,edges,k=5){
 const adj=Array.from({length:vals.length},()=>[]);
 edges.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a);});
 let max=-Infinity;const raw=[];
 function dfs(at,used,sum,path){
  if(path.length===k){
   if(sum>max){max=sum;raw.length=0;raw.push(path.slice());}
   else if(sum===max)raw.push(path.slice());
   return;
  }
  for(const n of adj[at])if(!(used&(1<<n)))dfs(n,used|(1<<n),sum+vals[n],path.concat(n));
 }
 vals.forEach((v,i)=>dfs(i,1<<i,v,[i]));
 const unique=new Map();
 raw.forEach(path=>{
  const a=path.join("-"),b=path.slice().reverse().join("-");
  const key=a<b?a:b;
  if(!unique.has(key))unique.set(key,path);
 });
 return {max,witnesses:[...unique.values()]};
}
function solveLights(bits){
 let best=10;const witnesses=[];
 for(let mask=0;mask<512;mask++){
  const state=bits.slice();
  for(let p=0;p<9;p++)if(mask&(1<<p)){
   const x=p%3,y=Math.floor(p/3);
   [[x,y],[x+1,y],[x-1,y],[x,y+1],[x,y-1]].forEach(([nx,ny])=>{
    if(nx>=0&&nx<3&&ny>=0&&ny<3)state[ny*3+nx]^=1;
   });
  }
  if(state.every(x=>!x)){
   const cost=mask.toString(2).replace(/0/g,"").length;
   if(cost<best){best=cost;witnesses.length=0;witnesses.push(mask);}
   else if(cost===best)witnesses.push(mask);
  }
 }
 return {best,witnesses};
}
function solveLogic(names){
 const P=permutations([0,1,2,3]),solutions=[];
 P.forEach(p=>P.forEach(colors=>{
  if(p.indexOf(0)+1!==p.indexOf(3))return;
  if(p.indexOf(2)+1!==p.indexOf(1))return;
  if(p.indexOf(0)>=p.indexOf(1))return;
  if(colors[0]!==0||colors[1]!==1)return;
  if(colors[p.indexOf(1)]===2)return;
  const bluePosition=colors.indexOf(3);
  solutions.push({p,colors,blueOwner:names[p[bluePosition]]});
 }));
 return solutions;
}
function sequenceModels(frames){
 const sideSteps=[-2,-1,0,1,2],angleSteps=[-180,-135,-90,-45,0,45,90,135,180],fillModes=["same","toggle"];
 const models=[];
 for(const ds of sideSteps)for(const da of angleSteps)for(const fill of fillModes){
  const ok=frames.slice(1).every((f,i)=>{
   const prev=frames[i];
   const expectedAngle=(prev.angle+da+720)%360;
   const expectedFill=fill==="toggle"?1-prev.fill:prev.fill;
   return f.sides===prev.sides+ds&&f.angle===expectedAngle&&f.fill===expectedFill;
  });
  if(ok)models.push({ds,da,fill});
 }
 return models;
}
function predictedSequence(model,last){
 return {
  sides:last.sides+model.ds,
  angle:(last.angle+model.da+720)%360,
  fill:model.fill==="toggle"?1-last.fill:last.fill
 };
}
function sameSequenceSpec(a,b){
 return a&&b&&a.sides===b.sides&&a.angle===b.angle&&a.fill===b.fill;
}
function baseManifest(q){
 const generated=!["P01","C01","R01","M01","S01","ROT01","MOVE01","SP01"].includes(q.id);
 return {
  schema_version:VERIFICATION_SCHEMA_VERSION,
  id:q.id,
  family:FAMILY_BY_CATEGORY[q.category]||"unknown",
  variant:q.checker?.kind||q.figure?.kind||"legacy",
  generator:{
   id:generated?"axiom_catalog_v04":"legacy_static_v01",
   version:"0.4.x",
   seed:null,
   reproducibility:generated?"deterministic_source":"legacy_asset"
  },
  provenance:{origin:"axiom_original",source:"src/questions.js"},
  machine:{
   verifier:{id:"axiom_verification_core",version:VERIFICATION_SCHEMA_VERSION},
   valid:false,
   solver_verified:false,
   answer:{scope:"unknown",count:null,unique:null,value:null},
   semantic_solution_count:null,
   witness_count:null,
   model:{applicable:false,grammar:null,count:null,unique:null,bounded_claim:null},
   notes:[]
  },
  editorial:{human_qa:"unknown",calibrated:false,published:true},
  hint_policy:{
   current_steps:Array.isArray(q.hint_steps)?q.hint_steps:(q.hint?[q.hint]:[]),
   target_steps:["structural","stronger","near_solution","solution_explanation"]
  }
 };
}
function verifyStructural(q,m){
 const ok=typeof q.id==="string"&&typeof q.prompt==="string"&&Array.isArray(q.options)&&q.options.length===4&&
  Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4&&q.figure&&typeof q.figure.kind==="string";
 m.machine.valid=ok;
 if(!ok)m.machine.notes.push("structural validation failed");
 return ok;
}
function verifyMatrix(q,m){
 const c=q.checker;if(!c||!Array.isArray(c.rows)||!Array.isArray(c.masks))return false;
 const demos=c.rows.slice(0,2);
 const matching=MATRIX_MODELS.filter(model=>demos.every(([a,b,out])=>matrixOp(model,a,b)===out));
 const [a,b]=c.rows[2];
 const predictions=[...new Set(matching.map(model=>matrixOp(model,a,b)))];
 const expected=c.masks[q.answer];
 m.rule_grammar=MATRIX_MODELS.slice();
 m.machine.solver_verified=matching.length>0&&predictions.includes(expected);
 m.machine.answer={scope:"semantic_target",count:predictions.length,unique:predictions.length===1,value:expected};
 m.machine.semantic_solution_count=predictions.length;
 m.machine.model={applicable:true,grammar:"matrix_ops_v1",count:matching.length,unique:matching.length===1,
  bounded_claim:"Unique only within matrix_ops_v1: xor/or/and/xor_rotate."};
 m.machine.notes.push("Model uniqueness is bounded to the declared matrix grammar.");
 return true;
}
function verifyCircle(q,m){
 const pairs=q.figure?.pairs;if(!Array.isArray(pairs)||pairs.length<5)return false;
 const demos=pairs.slice(0,4),target=pairs[4];
 const matching=CIRCLE_MODELS.filter(model=>demos.every(([a,b,out])=>circleOp(model,a,b)===out));
 const predictions=[...new Set(matching.map(model=>circleOp(model,target[0],target[1])))];
 const expected=Number(q.options[q.answer]);
 m.rule_grammar=CIRCLE_MODELS.slice();
 m.machine.solver_verified=matching.length>0&&predictions.includes(expected);
 m.machine.answer={scope:"semantic_target",count:predictions.length,unique:predictions.length===1,value:expected};
 m.machine.semantic_solution_count=predictions.length;
 m.machine.model={applicable:true,grammar:"circle_arithmetic_v1",count:matching.length,unique:matching.length===1,
  bounded_claim:"Unique only within the five declared arithmetic rule templates."};
 m.machine.notes.push("Model uniqueness is bounded to the declared circle grammar.");
 return true;
}
function verifyPath(q,m){
 const f=q.figure;if(f?.kind!=="path"||!Array.isArray(f.vals)||!Array.isArray(f.edges))return false;
 const solved=allPathWitnesses(f.vals,f.edges,5),expected=Number(q.options[q.answer]);
 m.machine.solver_verified=solved.max===expected;
 m.machine.answer={scope:"optimal_value",count:1,unique:true,value:solved.max};
 m.machine.semantic_solution_count=1;
 m.machine.witness_count=solved.witnesses.length;
 m.machine.model={applicable:false,grammar:null,count:null,unique:null,bounded_claim:"Hidden-rule model uniqueness is not applicable to optimization-value questions."};
 return true;
}
function verifyLights(q,m){
 const f=q.figure;if(f?.kind!=="lights"||!Array.isArray(f.bits))return false;
 const solved=solveLights(f.bits),expected=Number(q.options[q.answer]);
 m.machine.solver_verified=solved.best===expected;
 m.machine.answer={scope:"minimum_move_count",count:1,unique:true,value:solved.best};
 m.machine.semantic_solution_count=1;
 m.machine.witness_count=solved.witnesses.length;
 m.machine.model={applicable:false,grammar:null,count:null,unique:null,bounded_claim:"Hidden-rule model uniqueness is not applicable to exact state-search questions."};
 return true;
}
function verifyCoins(q,m){
 const c=q.checker;if(c?.kind!=="coins")return false;
 const denom=q.figure?.denom||[];
 const global=combinations(denom,4).filter(v=>v.reduce((a,b)=>a+b,0)*c.n===c.total);
 const displayed=c.variants.filter(v=>v.reduce((a,b)=>a+b,0)*c.n===c.total);
 m.machine.solver_verified=displayed.length===1&&global.length>=1;
 m.machine.answer={scope:"displayed_options",count:displayed.length,unique:displayed.length===1,value:c.variants[q.answer]};
 m.machine.semantic_solution_count=global.length;
 m.machine.model={applicable:false,grammar:null,count:null,unique:null,bounded_claim:"Constraint solution count is tracked instead of hidden-rule model count."};
 if(global.length!==1)m.machine.notes.push("Displayed answer is unique, but the full denomination space has "+global.length+" solutions.");
 return true;
}
function verifyOrder(q,m){
 const c=q.checker;if(c?.kind!=="order")return false;
 const labels=q.figure?.labels||["A","B","C","D","E","F"];
 const global=permutations(labels).filter(p=>orderOk(p,c.rules));
 const displayed=c.candidates.filter(p=>orderOk(p,c.rules));
 m.machine.solver_verified=displayed.length===1&&global.length>=1;
 m.machine.answer={scope:"displayed_options",count:displayed.length,unique:displayed.length===1,value:c.candidates[q.answer]};
 m.machine.semantic_solution_count=global.length;
 m.machine.model={applicable:false,grammar:null,count:null,unique:null,bounded_claim:"Constraint solution count is tracked instead of hidden-rule model count."};
 if(global.length!==1)m.machine.notes.push("Displayed answer is unique; global constraint solution count is "+global.length+".");
 return true;
}
function verifyLogic(q,m){
 if(q.checker?.kind!=="logic"||!Array.isArray(q.figure?.names))return false;
 const solved=solveLogic(q.figure.names);
 const owners=[...new Set(solved.map(x=>x.blueOwner))];
 m.machine.solver_verified=solved.length>0&&owners.includes(q.checker.answer);
 m.machine.answer={scope:"semantic_target",count:owners.length,unique:owners.length===1,value:q.checker.answer};
 m.machine.semantic_solution_count=solved.length;
 m.machine.model={applicable:false,grammar:null,count:null,unique:null,bounded_claim:"Constraint solution count is tracked instead of hidden-rule model count."};
 return true;
}
function verifyTruth(q,m){
 const c=q.checker;if(c?.kind!=="truth"||!Array.isArray(c.candidates))return false;
 const owners=c.candidates.map(i=>"ABCD"[i]),expected=q.options[q.answer];
 m.machine.solver_verified=owners.includes(expected);
 m.machine.answer={scope:"semantic_target",count:owners.length,unique:owners.length===1,value:expected};
 m.machine.semantic_solution_count=owners.length;
 m.machine.model={applicable:false,grammar:null,count:null,unique:null,bounded_claim:"Constraint solution count is tracked instead of hidden-rule model count."};
 return true;
}
function verifySequence(q,m){
 const frames=q.figure?.frames;if(q.figure?.kind!=="sequence"||!Array.isArray(frames)||frames.length<3)return false;
 const matching=sequenceModels(frames);
 const predictions=matching.map(model=>predictedSequence(model,frames[frames.length-1]));
 const uniquePredictions=[];
 predictions.forEach(p=>{if(!uniquePredictions.some(x=>sameSequenceSpec(x,p)))uniquePredictions.push(p);});
 const expected=q.answerSpecs?.[q.answer];
 m.rule_grammar={side_step:[-2,-1,0,1,2],angle_step:[-180,-135,-90,-45,0,45,90,135,180],fill:["same","toggle"]};
 m.machine.solver_verified=matching.length>0&&uniquePredictions.some(p=>sameSequenceSpec(p,expected));
 m.machine.answer={scope:"semantic_target",count:uniquePredictions.length,unique:uniquePredictions.length===1,value:expected||null};
 m.machine.semantic_solution_count=uniquePredictions.length;
 m.machine.model={applicable:true,grammar:"independent_sequence_attributes_v1",count:matching.length,unique:matching.length===1,
  bounded_claim:"Unique only within independent constant-step side/angle and binary fill rules."};
 m.machine.notes.push("Sequence model uniqueness is bounded to the declared independent-attribute grammar.");
 return true;
}
function verifyRotation(q,m){
 if(q.figure?.kind!=="rotation"||!Array.isArray(q.answerSpecs))return false;
 const target=q.answerSpecs.filter(x=>x.kind==="rotation"&&x.angle===q.figure.degrees&&x.mirror===false);
 m.machine.solver_verified=target.length===1&&q.answerSpecs[q.answer]===target[0];
 m.machine.answer={scope:"explicit_transform",count:target.length,unique:target.length===1,value:q.answerSpecs[q.answer]};
 m.machine.semantic_solution_count=target.length;
 m.machine.model={applicable:false,grammar:null,count:null,unique:null,bounded_claim:"The transformation rule is explicit in the prompt, so model uniqueness is not applicable."};
 return true;
}
function verifyCube(q,m){
 if(q.figure?.kind!=="cubeNet"||!Array.isArray(q.options))return false;
 const opposite={A:"F",F:"A",B:"D",D:"B",C:"E",E:"C"}[q.figure.ask];
 if(!opposite)return false;
 const hits=q.options.filter(x=>x===opposite);
 m.machine.solver_verified=hits.length===1&&q.options[q.answer]===opposite;
 m.machine.answer={scope:"explicit_geometry",count:hits.length,unique:hits.length===1,value:opposite};
 m.machine.semantic_solution_count=1;
 m.machine.model={applicable:false,grammar:null,count:null,unique:null,bounded_claim:"Fixed cube-net geometry; hidden-rule model uniqueness is not applicable."};
 return true;
}

export function buildVerificationManifest(q){
 const m=baseManifest(q);
 if(!verifyStructural(q,m))return m;
 const handlers=[verifyMatrix,verifyCircle,verifyPath,verifyLights,verifyCoins,verifyOrder,verifyLogic,verifyTruth,verifySequence,verifyRotation,verifyCube];
 const handled=handlers.some(fn=>fn(q,m));
 if(!handled){
  m.machine.notes.push("No independent V0.5 verifier yet; keep existing gameplay but do not upgrade verification claims.");
 }
 return m;
}

export function omegaAdmission(manifest){
 const m=manifest.machine;
 if(!m.valid||!m.solver_verified||m.answer.unique!==true)return {pass:false,reason:"requires solver-verified unique semantic answer"};
 if(m.model.applicable&&m.model.unique!==true)return {pass:false,reason:"rule-inference family requires a unique model within its declared grammar"};
 if(!m.model.applicable&&m.semantic_solution_count!==1)return {pass:false,reason:"non-rule family requires one semantic solution state/value under its family verifier"};
 return {pass:true,reason:"machine gate passed; human QA and calibration remain separate editorial gates"};
}

export function auditBank(puzzles){
 const manifests=puzzles.map(buildVerificationManifest);
 const summary={
  schema_version:VERIFICATION_SCHEMA_VERSION,
  total:manifests.length,
  valid:manifests.filter(x=>x.machine.valid).length,
  solver_verified:manifests.filter(x=>x.machine.solver_verified).length,
  answer_unique:manifests.filter(x=>x.machine.answer.unique===true).length,
  model_applicable:manifests.filter(x=>x.machine.model.applicable).length,
  model_unique:manifests.filter(x=>x.machine.model.unique===true).length,
  legacy_or_pending:manifests.filter(x=>!x.machine.solver_verified).map(x=>x.id),
  omega:manifests.filter(x=>puzzles.find(q=>q.id===x.id)?.difficulty==="Ω").map(x=>({id:x.id,...omegaAdmission(x)}))
 };
 return {manifests,summary};
}
