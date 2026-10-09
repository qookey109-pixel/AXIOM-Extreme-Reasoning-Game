/* AXIOM V0.5.2 — twelve original, deterministic, solver-backed release puzzles.
 * No external content, no browser randomness, no changes to legacy puzzle IDs.
 * All designs use the existing Canvas graphic primitives.
 */
const L=["A","B","C","D"];
const EDGES=[[0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[3,6],[4,6],[4,7],[5,7],[6,7]];
function shuffle(a,seed){let x=seed>>>0,out=a.slice();for(let i=out.length-1;i>0;i--){x=(Math.imul(x,1664525)+1013904223)>>>0;const j=Math.floor(x/4294967296*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function metadata(name,seed){return {id:name,version:"1.0.0",seed,option_seed:seed+100,reproducibility:"deterministic_seeded",source:"src/expansion-v052.js"};}
function add(bank,q,seed){
 if(q.options.length!==4||new Set(q.options).size!==4||q.answer<0||q.answer>3)throw Error("bad options "+q.id);
 if(!q.answerSpecs||q.answerSpecs.length!==4)throw Error("bad answer art "+q.id);
 q.generator=metadata("axiom_release_expansion_v052",seed);
 q.hint_steps=[{stage:"structural",text:q.structural_hint},{stage:"stronger",text:q.hint}];
 delete q.structural_hint;
 bank.push(q);
}
function numeric(id,category,difficulty,prompt,structural_hint,hint,explain,figure,correct,wrong,seed){
 const vals=shuffle([correct,...wrong],seed+100);
 if(new Set(vals).size!==4||vals.some(v=>!Number.isFinite(v)||v<0))throw Error("invalid numeric options "+id);
 return {id,category,difficulty,prompt,structural_hint,hint,explain,figure,options:vals.map(String),
  answer:vals.indexOf(correct),answerSpecs:vals.map(value=>({kind:"number",value}))};
}
function pyramid(id,bottom,k,difficulty,seed){
 const r1=[0,1,2].map(i=>bottom[i]+k*bottom[i+1]);
 const r2=[0,1].map(i=>r1[i]+k*r1[i+1]),top=r2[0]+k*r2[1];
 const options=bottom[3]===4?[2,6,7]:[2,4,6];
 return numeric(id,"數字金字塔",difficulty,"每層父節點由下一層兩數組成。反推最底層的問號。",
  "先從已知相鄰數字找一條能同時解釋所有層的公式。",
  "固定規則是左 + k × 右；先由中間兩層辨識 k，再求最底層。",
  "每個父節點 = 左 + "+k+"×右，因此問號為 "+bottom[3]+"。",
  {kind:"pyramid",rows:[[top],r2,r1,[...bottom.slice(0,3),"?"]]},bottom[3],options,seed);
}
function circle(id,pairs,difficulty,rule,seed){
 const evals=[
  (a,b)=>a*b+Math.abs(a-b),
  (a,b)=>a*b+a+b,
  (a,b)=>2*a+b*b,
  (a,b)=>a*a+2*b,
  (a,b)=>(a+b)*(Math.abs(a-b)+1)
 ];
 const demos=pairs.slice(0,4).map(([a,b])=>[a,b,evals[rule](a,b)]);
 const target=pairs[4],correct=evals[rule](...target);
 const matching=evals.map((f,i)=>demos.every(([a,b,c])=>f(a,b)===c)?i:null).filter(x=>x!==null);
 if(matching.length!==1||matching[0]!==rule)throw Error("ambiguous circle model "+id);
 const labels=["a×b+|a−b|","a×b+a+b","2a+b²","a²+2b","(a+b)×(|a−b|+1)"];
 return numeric(id,"圓盤數字",difficulty,"所有扇區沿用同一套雙輸入運算。求最後一個中心數字。",
  "先找一個同時適用四個完整扇區的運算，而不是為單一例子配公式。",
  "測試乘積、平方、差值、和等組合；每個完整扇區都要成立。",
  "符合全部例子的規則是 "+labels[rule]+"，最後得到 "+correct+"。",
  {kind:"circle",pairs:[...demos,[...target,"?"]]},correct,[correct+3,correct+6,Math.max(1,correct-4)],seed);
}
function longestPath(vals){
 const a=Array.from({length:vals.length},()=>[]);EDGES.forEach(([x,y])=>{a[x].push(y);a[y].push(x);});
 let best=-Infinity,witness=[];
 function walk(at,visited,score,path){
  if(path.length===5){if(score>best){best=score;witness=path;}return;}
  for(const n of a[at])if(!(visited&(1<<n)))walk(n,visited|(1<<n),score+vals[n],[...path,n]);
 }
 vals.forEach((v,i)=>walk(i,1<<i,v,[i]));
 return {best,witness};
}
function rotateMask(a){return ((a&1)?2:0)|((a&2)?1:0)|((a&4)?8:0)|((a&8)?4:0);}
function matrixOp(op,a,b){return op===0?a^b:op===1?a|b:op===2?a&b:rotateMask(a^b);}
function matrix(id,pairs,op,difficulty,seed){
 const rows=pairs.map(([a,b])=>[a,b,matrixOp(op,a,b)]);
 const grammar=[0,1,2,3].filter(m=>rows.slice(0,2).every(([a,b,out])=>matrixOp(m,a,b)===out));
 if(grammar.length!==1||grammar[0]!==op)throw Error("ambiguous matrix "+id);
 const last=rows[2][2];
 const masks=shuffle([last,...[1,2,4,8].map(x=>last^x).filter(x=>x!==0).slice(0,3)],seed+100);
 if(new Set(masks).size!==4||masks.includes(0))throw Error("blank or duplicate matrix "+id);
 return {id,category:"圖形缺項",difficulty,
  prompt:"同列前兩格依同一法則構成第三格。哪張圖能補上空格？",
  structural_hint:"分別記錄四種線段有沒有出現，再比較每列第三格。",
  hint:"可能是 XOR、聯集、交集或 XOR 後旋轉；同一法則要解釋前兩列。",
  explain:"前兩列共同排除其他法則，所求線段遮罩為 "+last+"。",
  figure:{kind:"matrix",rows:rows.map((row,i)=>i===2?[row[0],row[1],"?"]:row)},
  options:L,answer:masks.indexOf(last),answerSpecs:masks.map(mask=>({kind:"segments",mask})),
  checker:{kind:"matrix",op,rows,masks}};
}
function lightsState(mask){
 const state=Array(9).fill(0);
 for(let i=0;i<9;i++)if(mask&(1<<i)){
  const x=i%3,y=Math.floor(i/3);
  for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=x+dx,ny=y+dy;if(nx>=0&&nx<3&&ny>=0&&ny<3)state[ny*3+nx]^=1;
  }
 }
 return state;
}
function shortestLights(bits){
 let min=Infinity,witness=0;
 for(let mask=0;mask<512;mask++){
  const v=bits.slice();
  for(let p=0;p<9;p++)if(mask&(1<<p)){
   const x=p%3,y=Math.floor(p/3);
   for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){
    const nx=x+dx,ny=y+dy;if(nx>=0&&nx<3&&ny>=0&&ny<3)v[ny*3+nx]^=1;
   }
  }
  if(v.every(x=>x===0)){const cost=mask.toString(2).replace(/0/g,"").length;if(cost<min){min=cost;witness=mask;}}
 }
 return {min,witness};
}
function permutations(arr){
 if(arr.length<2)return [arr.slice()];
 return arr.flatMap((v,i)=>permutations([...arr.slice(0,i),...arr.slice(i+1)]).map(p=>[v,...p]));
}
function orderOk(p,rules){
 return rules.every(r=>{
  const a=p.indexOf(r.a),b=r.b?p.indexOf(r.b):-1;
  if(r.kind==="before")return a<b;
  if(r.kind==="touch")return b===a+1;
  if(r.kind==="apart")return Math.abs(a-b)>1;
  return r.kind==="inside"&&a>0&&a<p.length-1;
 });
}
const orderWords=rules=>rules.map(r=>r.kind==="before"?r.a+" 在 "+r.b+" 前":
 r.kind==="touch"?r.b+" 緊接在 "+r.a+" 後":r.kind==="apart"?r.a+" 與 "+r.b+" 不相鄰":r.a+" 不在兩端");

export function buildReleaseExpansion(){
 const bank=[];
 add(bank,pyramid("P06",[6,2,5,4],3,"Expert",2101),2101);
 add(bank,pyramid("P07",[5,1,6,3],2,"Hard",2102),2102);
 add(bank,circle("C06",[[2,7],[4,9],[6,3],[5,8],[7,4]],"Expert",0,2201),2201);
 add(bank,circle("C07",[[2,3],[4,5],[6,2],[3,7],[7,5]],"Ω",3,2202),2202);
 const vals=[8,14,3,6,13,7,10,5],sol=longestPath(vals);
 add(bank,numeric("R05","路徑最佳化","Ω","沿著連線恰好走 5 個不同節點，最大節點總和是多少？",
  "圖上的最短距離不是目標；把路徑總分與節點不得重複分開考慮。",
  "從每個起點探索所有不重複的 5 節點路徑，找出最大總和。",
  "最大總和 "+sol.best+"，其中一條路為 "+sol.witness.map(i=>vals[i]).join("→")+"。",
  {kind:"path",vals,edges:EDGES},sol.best,[sol.best-2,sol.best-5,sol.best+3],2301),2301);
 add(bank,matrix("M06",[[1,4],[3,8],[2,8]],3,"Expert",2401),2401);
 add(bank,matrix("M07",[[7,11],[13,6],[11,10]],2,"Ω",2402),2402);
 const frames=Array.from({length:4},(_,i)=>({sides:5+i,angle:(720-i*135)%360,fill:(1+i)%2}));
 const next={sides:9,angle:180,fill:1};
 const seqSpecs=shuffle([next,{...next,angle:90},{...next,fill:0},{...next,sides:8}],2501);
 add(bank,{id:"S06",category:"圖形序列",difficulty:"Expert",
  prompt:"外框邊數、箭頭方向、中心填色各自有規律。選出下一張圖。",
  structural_hint:"請分開記錄三種屬性，不要只追蹤外框。",
  hint:"外框每次多一邊，角度固定反向轉 135°，中心實空交替。",
  explain:"下一張是 9 邊形、箭頭 180°、實心中心。",
  figure:{kind:"sequence",frames},options:L,answer:seqSpecs.findIndex(x=>JSON.stringify(x)===JSON.stringify(next)),
  answerSpecs:seqSpecs.map(x=>({kind:"sequence",...x}))},2501);
 const rotChoices=shuffle([
  {kind:"rotation",angle:90,mirror:true},
  {kind:"rotation",angle:90,mirror:false},
  {kind:"rotation",angle:270,mirror:true},
  {kind:"rotation",angle:180,mirror:true}
 ],2601);
 add(bank,{id:"ROT05",category:"旋轉／鏡像",difficulty:"Expert",
  prompt:"先將原圖左右鏡射，再順時針旋轉 90°。哪個結果正確？",
  structural_hint:"先留意不對稱圓點的左右手性，再追蹤旋轉後的位置。",
  hint:"鏡射會顛倒手性，旋轉只改方向；兩個操作不能省略。",
  explain:"只有一項同時左右鏡射並旋轉 90°，輪廓與標記均吻合。",
  figure:{kind:"rotation",degrees:90,mirror:true},options:L,
  answer:rotChoices.findIndex(x=>x.angle===90&&x.mirror===true),answerSpecs:rotChoices},2601);
 const bits=lightsState(341),light=shortestLights(bits);
 add(bank,numeric("MOVE05","棋子移動","Expert",
  "每次按下會翻轉自己與上下左右。全部變白的最少按鍵數？",
  "重複按同一格兩次等於完全沒有按。",
  "把每一格視為 0 或 1 次，總共只有 512 組不同按法。",
  "列舉 512 個按鍵遮罩，最少需要 "+light.min+" 次。",
  {kind:"lights",bits},light.min,[light.min-1,light.min+1,light.min+2],2701),2701);
 const chosen=[1,5,10,50],n=3,total=n*chosen.reduce((a,b)=>a+b,0);
 const variants=shuffle([chosen,[1,2,10,50],[1,5,20,50],[2,5,10,50]],2801);
 add(bank,{id:"COM05",category:"幣值／組合限制",difficulty:"Hard",
  prompt:"六種硬幣面額中選四種，每種都拿 "+n+" 枚，總額 "+total+"。選出正確組合。",
  structural_hint:"面額先相加，再乘上每種面額的枚數。",
  hint:"先算 "+total+" ÷ "+n+"；四種不同面額的和必須等於這個值。",
  explain:total+" ÷ "+n+" = "+chosen.reduce((a,b)=>a+b,0)+"，只有 "+chosen.join("、")+" 符合。",
  figure:{kind:"coins",denom:[1,2,5,10,20,50]},options:L,answer:variants.findIndex(x=>x.join()===chosen.join()),
  answerSpecs:variants.map(values=>({kind:"coins",values})),checker:{kind:"coins",n,total,variants}},2801);
 const rules=[
  {kind:"before",a:"A",b:"D"},{kind:"touch",a:"D",b:"F"},
  {kind:"touch",a:"A",b:"E"},{kind:"inside",a:"A"},
  {kind:"apart",a:"C",b:"B"},{kind:"inside",a:"B"}
 ];
 const valid=permutations(L.concat(["E","F"])).filter(p=>orderOk(p,rules));
 if(valid.length!==1)throw Error("ORD05 not globally unique: "+valid.length);
 const bad=permutations(L.concat(["E","F"])).filter(p=>!orderOk(p,rules));
 const variantsOrd=shuffle([valid[0],bad[81],bad[153],bad[225]],2901);
 add(bank,{id:"ORD05",category:"排序／分組",difficulty:"Expert",
  prompt:"依照六條限制，哪一個排列完全成立？",
  clues:orderWords(rules),
  structural_hint:"先把緊接關係視為不可分的塊，再套入位置限制。",
  hint:"A 緊接 E、D 緊接 F；留意 A、B 都不能放兩端。",
  explain:"唯一合法排列為 "+valid[0].join("–")+"；其餘選項至少違反一條限制。",
  figure:{kind:"tokens",labels:L.concat(["E","F"])},options:L,
  answer:variantsOrd.findIndex(p=>p.join()===valid[0].join()),
  answerSpecs:variantsOrd.map(labels=>({kind:"tokens",labels})),checker:{kind:"order",candidates:variantsOrd,rules}},2901);
 if(bank.length!==12)throw Error("release expansion expected 12");
 return bank;
}
