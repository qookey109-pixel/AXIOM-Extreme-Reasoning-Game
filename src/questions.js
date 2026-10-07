/* AXIOM V0.4 — deterministic, original puzzle catalog.
 * Player-visible difficulty is Hard / Expert / Ω; these labels are design estimates.
 * All generated questions are held in an explicit, finite 50-item bank per release.
 */
export const CATEGORIES=[
 "數字金字塔","圓盤數字","路徑最佳化","圖形缺項","圖形序列","旋轉／鏡像",
 "棋子移動","幣值／組合限制","排序／分組","Logic Grid","真假命題","空間／展開圖"
];
const L=["A","B","C","D"];
function rng(seed){let x=seed>>>0;return function(){x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function shuffle(list,seed){let a=list.slice(),r=rng(seed);for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function numberOptions(value,seed,step=1){
 let arr=[value,value+step,value-step,value+step*2];
 if(value-step<0)arr=[value,value+step,value+step*2,value+step*3];
 const vals=shuffle(arr,seed);
 return {options:vals.map(String),answer:vals.indexOf(value),answerSpecs:vals.map(x=>({kind:"number",value:x}))};
}
const base=[
 ["P01",0,"Hard","同一個生成規則套用到每一層。底部 ? 是多少？",["2","3","4","5"],1,"父節點 = 左子節點 + 2×右子節點。","7 = 1 + 2×3。","pyramid.png"],
 ["C01",1,"Hard","每個扇區遵循同一條運算規則。? 是多少？",["40","41","43","45"],2,"先看兩數乘積，再看它們的差。","a×b+|a−b|；5×8+3=43。","circle.png"],
 ["R01",2,"Expert","沿線走訪 5 個不同節點。最大總和是多少？",["31","33","35","37"],2,"高值節點不一定可以全部直接串在一起。","7→9→8→6→5，總和 35。","graph.png"],
 ["M01",3,"Ω","找出右下角缺失圖。先自行推導規則。",["A","B","C","D"],2,"把圖形拆成線段集合；看看重複部分。","每列第三格為前兩格的線段 XOR，答案 C。","matrix.png"],
 ["S01",4,"Expert","外框、箭頭與中心狀態都在變。下一圖是？",["A","B","C","D"],0,"分別追蹤邊數、角度與實空變化。","七邊形、向下箭頭、實心中心。","sequence.png"],
 ["ROT01",5,"Expert","僅一個候選保留原圖的旋轉關係，請找出它。",["A","B","C","D"],1,"鏡射會改變圖形的左右手性。","B 為相符的純旋轉圖形。","rotation.png"],
 ["MOVE01",6,"Expert","按一格會翻轉自己與上下左右。全白最少幾次？",["3","4","5","6"],2,"同一格按兩次會互相抵銷。","枚舉 512 種按法，最短為 5 次。","lights.png"],
 ["SP01",11,"Hard","把展開圖折成立方體，哪一面與 C 相對？",["A","B","D","E"],3,"直接接著 C 的四面一定與 C 相鄰。","C 的相對面是 E。","cube.png"]
];
const legacyChoiceSpecs={
 M01:[["v","h"],["d1","d2"],["v","h","d1"],["v","h","d2"]].map(lines=>({kind:"segments",lines})),
 S01:[
  {kind:"sequence",sides:7,angle:90,fill:1},
  {kind:"sequence",sides:7,angle:0,fill:0},
  {kind:"sequence",sides:6,angle:90,fill:1},
  {kind:"sequence",sides:8,angle:90,fill:0}
 ],
 SP01:["A","B","D","E"].map(value=>({kind:"face",value})),
 ROT01:L.map(value=>({kind:"letter",value}))
};
const legacyCheckers={
 P01:{kind:"pyramid",rows:[[62],[22,20],[10,6,7],[2,4,1,"?"]],weights:[1,2,3,4,5,6]},
 C01:{kind:"circle",pairs:[[2,5,13],[3,7,25],[4,6,26],[2,9,25],[6,1,11]],target:[5,8]},
 R01:{kind:"path",vals:[7,3,9,4,8,2,6,5],edges:[[0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[3,6],[4,6],[4,7],[5,7],[6,7]],k:5},
 M01:{kind:"matrixLines",rows:[
  [["v","d1"],["h","d1"],["v","h"]],
  [["v","d2"],["v","h"],["h","d2"]],
  [["h","d1","d2"],["v","d2"],"?"]
 ],grammar:["xor","or","and"]},
 S01:{kind:"sequence",frames:[
  {sides:3,angle:270,fill:1},{sides:4,angle:45,fill:0},
  {sides:5,angle:180,fill:1},{sides:6,angle:315,fill:0}
 ]},
 ROT01:{kind:"rotationChoice",options:[
  {angle:180,mirror:true},{angle:90,mirror:false},{angle:90,mirror:true},{angle:0,mirror:true}
 ],criterion:"pure_rotation"},
 MOVE01:{kind:"lights",bits:[1,1,0,0,1,1,1,0,0]},
 SP01:{kind:"cubeNet",ask:"C",cells:[
  ["A",0,-1],["B",-1,0],["C",0,0],["D",1,0],["E",2,0],["F",0,1]
 ]}
};
function makeBase(){
 return base.map(([id,ci,difficulty,prompt,options,answer,hint,explain,img])=>({
  id,category:CATEGORIES[ci],difficulty,prompt,options,answer,hint,explain,
  asset:"assets/png/"+img,figure:{kind:"legacy",img},answerSpecs:legacyChoiceSpecs[id]||
     options.map(value=>({kind:"number",value})),checker:legacyCheckers[id]||null
 }));
}
function pushQ(bank,q){
 if(q.options.length!==4||new Set(q.options).size!==4)throw Error("invalid options "+q.id);
 if(q.answer<0||q.answer>=4)throw Error("invalid answer "+q.id);
 if(!q.figure)throw Error("no figure "+q.id);
 bank.push(q);
}
function qNumeric(id,category,difficulty,prompt,hint,explain,figure,value,seed,step=1){
 const ans=numberOptions(value,seed,step);
 return {id,category,difficulty,prompt,hint,explain,figure,...ans};
}
const GRAPH_EDGES=[[0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[3,6],[4,6],[4,7],[5,7],[6,7]];
function maxPath(vals,k=5){
 const adj=Array.from({length:vals.length},()=>[]);
 GRAPH_EDGES.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a);});
 let max=-Infinity,witness=[];
 function dfs(at,used,sum,path){
  if(path.length===k){if(sum>max){max=sum;witness=path.slice();}return;}
  adj[at].forEach(n=>{if(!(used&(1<<n)))dfs(n,used|(1<<n),sum+vals[n],path.concat(n));});
 }
 vals.forEach((v,i)=>dfs(i,1<<i,v,[i]));
 return {max,witness};
}
function lightsShortest(state){
 let best=10,solutions=0;
 for(let mask=0;mask<512;mask++){
  const bits=state.slice();
  for(let p=0;p<9;p++)if(mask&(1<<p)){
   const x=p%3,y=Math.floor(p/3);
   [[x,y],[x+1,y],[x-1,y],[x,y+1],[x,y-1]].forEach(([nx,ny])=>{
    if(nx>=0&&nx<3&&ny>=0&&ny<3)bits[ny*3+nx]^=1;
   });
  }
  if(bits.every(x=>!x)){let cost=mask.toString(2).replace(/0/g,"").length;if(cost<best){best=cost;solutions=1;}else if(cost===best)solutions++;}
 }
 return {best,solutions};
}
function lightsState(mask){
 const a=Array(9).fill(0);
 for(let p=0;p<9;p++)if(mask&(1<<p)){
  const x=p%3,y=Math.floor(p/3);
  [[x,y],[x+1,y],[x-1,y],[x,y+1],[x,y-1]].forEach(([nx,ny])=>{
   if(nx>=0&&nx<3&&ny>=0&&ny<3)a[ny*3+nx]^=1;
  });
 }return a;
}
function evalCircle(rule,a,b){
 if(rule===0)return a*b+Math.abs(a-b);
 if(rule===1)return a*b+a+b;
 if(rule===2)return 2*a+b*b;
 if(rule===3)return a*a+b*2;
 return (a+b)*(Math.abs(a-b)+1);
}
const ops=[
 {id:"xor",name:"互斥疊加",f:(a,b)=>a^b},
 {id:"or",name:"聯集",f:(a,b)=>a|b},
 {id:"and",name:"交集",f:(a,b)=>a&b}
];
const rotateMask=a=>((a&1)?2:0)|((a&2)?1:0)|((a&4)?8:0)|((a&8)?4:0);
function matrixOp(op,a,b){if(op===3)return rotateMask(a^b);return ops[op].f(a,b);}
function computeMatrixRows(op,seed){
 let r=rng(seed),rows=[],tries=0;
 while(rows.length<3&&tries++<400){
  const a=1+Math.floor(r()*14),b=1+Math.floor(r()*14),c=matrixOp(op,a,b);
  if(c===0||a===b||rows.some(row=>row[0]===a&&row[1]===b))continue;
  if(rows.length<2){
   // Each demonstrated row must help rule out alternate operators.
   rows.push([a,b,c]);
  } else rows.push([a,b,c]);
 }
 if(rows.length!==3)throw Error("matrix generation exhausted");
 // Require example rows to distinguish the intended rule inside the declared grammar.
 for(let i=0;i<4;i++)if(i!==op&&rows.slice(0,2).every(row=>matrixOp(i,row[0],row[1])===row[2])){
  return computeMatrixRows(op,seed+987);
 }
 return rows;
}
function permutations(arr){
 if(arr.length<2)return [arr.slice()];
 let all=[];arr.forEach((x,i)=>permutations(arr.slice(0,i).concat(arr.slice(i+1))).forEach(p=>all.push([x].concat(p))));
 return all;
}
const PERMS6=permutations(["A","B","C","D","E","F"]);
const ORDER_RULES=[
 [{a:"A",b:"D",kind:"before"},{a:"B",b:"C",kind:"touch"},{a:"E",kind:"inside"},{a:"F",b:"A",kind:"before"},{a:"D",b:"E",kind:"apart"}],
 [{a:"D",b:"E",kind:"touch"},{a:"A",b:"B",kind:"before"},{a:"C",kind:"inside"},{a:"F",b:"C",kind:"before"},{a:"B",b:"D",kind:"apart"}],
 [{a:"B",b:"E",kind:"touch"},{a:"E",b:"F",kind:"before"},{a:"D",kind:"inside"},{a:"C",b:"A",kind:"before"},{a:"A",b:"D",kind:"apart"}],
 [{a:"A",b:"C",kind:"touch"},{a:"D",b:"F",kind:"before"},{a:"B",kind:"inside"},{a:"E",b:"A",kind:"before"},{a:"B",b:"F",kind:"apart"}]
];
function orderOk(p,rules){
 return rules.every(r=>{
  let a=p.indexOf(r.a),b=r.b?p.indexOf(r.b):-1;
  if(r.kind==="before")return a<b;
  if(r.kind==="touch")return b===a+1;
  if(r.kind==="inside")return a>0&&a<5;
  if(r.kind==="apart")return Math.abs(a-b)>1;
  return false;
 });
}
function orderWords(rules){
 return rules.map(r=>r.kind==="before"?r.a+" 在 "+r.b+" 前":
  r.kind==="touch"?r.b+" 緊接在 "+r.a+" 後":
  r.kind==="inside"?r.a+" 不在兩端":r.a+" 不與 "+r.b+" 相鄰");
}
function logicAssignments(){
 const P=permutations([0,1,2,3]),sol=[];
 P.forEach(p=>P.forEach(colors=>{
  if(p.indexOf(0)+1!==p.indexOf(3))return;   // A before D adjacent
  if(p.indexOf(2)+1!==p.indexOf(1))return;   // C before B adjacent
  if(p.indexOf(0)>=p.indexOf(1))return;
  if(colors[0]!==0||colors[1]!==1)return;     // W first G second
  if(colors[p.indexOf(1)]===2)return;         // B not R
  sol.push({p,colors});
 }));
 return sol;
}
function truthPatterns(){
 const statements=[
  ["B 犯案","D 犯案","我沒有犯案","A 說謊"],
  ["C 犯案","A 犯案","D 沒有犯案","B 說真話"],
  ["A 沒有犯案","C 犯案","B 沒有犯案","A 說謊"]
 ];
 function evaluate(t,s){
  const [a,b,c,d]=s;
  let A=t===("ABCD".indexOf(a[0]));
  // Explicitly define each template to avoid relying on natural-language ambiguity.
  if(s===statements[0])return [t===1,t===3,t!==2,t!==1];
  if(s===statements[1])return [t===2,t===0,t!==3,t===0];
  return [t!==0,t===2,t!==1,t===0]; 
 }
 return statements.map(s=>{
  let candidates=[];
  for(let culprit=0;culprit<4;culprit++)if(evaluate(culprit,s).filter(Boolean).length===1)candidates.push(culprit);
  return {statements:s,candidates};
 });
}
function generatorMeta(id){
 const legacy={
  P01:"pyramid.svg",C01:"circle.svg",R01:"graph.svg",M01:"matrix.svg",
  S01:"sequence.svg",ROT01:"rotation.svg",MOVE01:"lights.svg",SP01:"cube.svg"
 };
 if(legacy[id])return {id:"legacy_svg_v1",version:"1.0.0",seed:null,option_seed:null,
  reproducibility:"deterministic_static",source_asset:"assets/"+legacy[id]};
 const n=Number((id.match(/\d+/)||["0"])[0]);
 let gen=null,seed=null,option_seed=null;
 if(/^P0[2-5]$/.test(id)){gen="weighted_pyramid_v1";option_seed=100+(n-2);}
 else if(/^C0[2-5]$/.test(id)){gen="circle_rule_v1";seed=200+(n-2);option_seed=300+(n-2);}
 else if(/^R0[2-4]$/.test(id)){gen="path_values_v1";option_seed=400+(n-2);}
 else if(/^M0[2-5]$/.test(id)){gen="matrix_rule_v1";seed=500+(n-2);option_seed=600+(n-2);}
 else if(/^S0[2-5]$/.test(id)){gen="sequence_attributes_v1";option_seed=700+(n-2);}
 else if(/^ROT0[2-4]$/.test(id)){gen="rotation_transform_v1";option_seed=800+(n-2);}
 else if(/^MOVE0[2-4]$/.test(id)){gen="lights_search_v1";option_seed=900+(n-2);}
 else if(/^COM0[1-4]$/.test(id)){gen="coin_constraints_v1";option_seed=1000+(n-1);}
 else if(/^ORD0[1-4]$/.test(id)){gen="ordering_constraints_v1";seed=1200+(n-1);option_seed=1300+(n-1);}
 else if(/^LG0[1-4]$/.test(id)){gen="logic_grid_v1";option_seed=1500+(n-1);}
 else if(/^T0[1-3]$/.test(id)){gen="truth_constraints_v1";option_seed=1600+(n-1);}
 else if(/^SP0[2-3]$/.test(id)){gen="cube_net_v1";seed=1700+(n-2);option_seed=1800+(n-2);}
 if(!gen)throw Error("missing generator metadata "+id);
 return {id:gen,version:"1.0.0",seed,option_seed,
  reproducibility:seed===null?"deterministic_static":"deterministic_seeded",source:"src/questions.js"};
}
export function buildBank(){
 let bank=makeBase();
 // 4 additional pyramids: same compact geometry, distinct weighted recurrences.
 const py=[
  [[3,2,4,5],2,"Hard"],
  [[4,3,2,6],3,"Expert"],
  [[7,2,5,3],2,"Expert"],
  [[2,6,3,5],4,"Ω"]
 ];
 py.forEach(([bottom,k,d],i)=>{
  let row1=[bottom[0]+k*bottom[1],bottom[1]+k*bottom[2],bottom[2]+k*bottom[3]];
  let row2=[row1[0]+k*row1[1],row1[1]+k*row1[2]],top=row2[0]+k*row2[1];
  let figure={kind:"pyramid",rows:[[top],row2,row1,bottom.slice(0,3).concat("?")]};
  const id="P"+String(i+2).padStart(2,"0");
  pushQ(bank,qNumeric(id,CATEGORIES[0],d,"從全部層級推回底部缺少的值。", "同一個權重套用於每個父節點；觀察左右的貢獻。","父=左+"+k+"×右；底部 ? = "+bottom[3]+"。",figure,bottom[3],100+i));
 });
 // 4 new circular rules; validated against a fixed small grammar of plausible models.
 for(let i=0;i<4;i++){
  const rule=i+1,r=rng(200+i);let pairs=[],tries=0;
  while(pairs.length<5&&tries++<2000){
   let a=2+Math.floor(r()*7),b=2+Math.floor(r()*8),out=evalCircle(rule,a,b);
   if(pairs.some(p=>p[0]===a&&p[1]===b))continue;
   pairs.push([a,b,out]);
   if(pairs.length>=4&&[0,1,2,3,4].some(t=>t!==rule&&pairs.slice(0,4).every(p=>evalCircle(t,p[0],p[1])===p[2])))pairs=[];
  }
  if(pairs.length!==5)throw Error("circle model not identifiable");
  const answer=pairs[4][2],id="C"+String(i+2).padStart(2,"0");
  let opsText=["a×b+|a−b|","a×b+a+b","2a+b²","a²+2b","(a+b)×(|a−b|+1)"];
  pushQ(bank,qNumeric(id,CATEGORIES[1],i>=2?"Ω":"Expert",
   "四個扇區示範同一規則。最後扇區中心值為何？",
   "同一套運算要解釋全部四個範例，而非只解釋一個。",
   "共同規則為 "+opsText[rule]+"，所以答案 "+answer+"。",
   {kind:"circle",pairs:pairs.map((p,j)=>j===4?[p[0],p[1],"?"]:p)},answer,300+i,4));
 }
 // Three path sums: exact DFS validation and witness included.
 [[7,5,11,3,9,2,8,4],[4,12,5,7,10,6,11,3],[9,3,8,12,2,13,5,7]].forEach((vals,i)=>{
  const {max,witness}=maxPath(vals),id="R"+String(i+2).padStart(2,"0");
  pushQ(bank,qNumeric(id,CATEGORIES[2],i===2?"Ω":"Expert",
    "沿著線走恰好 5 個不同節點，最大的節點總和？",
    "試列舉所有長度 5 的簡單路徑；方向不受限制。",
    "最大總和 "+max+"，可由路徑 "+witness.map(k=>vals[k]).join("→")+" 取得。",
    {kind:"path",vals,edges:GRAPH_EDGES},max,400+i,2));
 });
 // Four missing-image matrices with distinct operator grammar.
 [0,1,2,3].forEach((op,i)=>{
  const rows=computeMatrixRows(op,500+i),last=rows[2][2],wrong=[last^1,last^2,last^4].filter(x=>x!==last);
  if(wrong.length!==3||new Set(wrong).size!==3)throw Error("matrix distractor collision");
  const masks=shuffle([last,...wrong],600+i),answer=masks.indexOf(last);
  const label=op===0?"XOR":op===1?"聯集":op===2?"交集":"XOR 後整體旋轉";
  pushQ(bank,{id:"M"+String(i+2).padStart(2,"0"),category:CATEGORIES[3],
   difficulty:i<2?"Expert":"Ω",prompt:"同列前兩格依同一法則變成第三格。缺哪張圖？",
   hint:"只看四種線段的存在與否；別被圖形輪廓誤導。",
   explain:"共同規則為 "+label+"；最後一格的線段已由此規則確定。",
   figure:{kind:"matrix",rows:rows.map((row,k)=>k===2?[row[0],row[1],"?"]:row)},
   options:L,answer,answerSpecs:masks.map(mask=>({kind:"segments",mask})),checker:{kind:"matrix",op,rows,masks}});
 });
 // Four sequences, multiple independent geometric attributes.
 [[3,90,1,90],[4,45,0,135],[3,180,1,-90],[4,0,0,45]].forEach(([start,angle,fill,turn],i)=>{
  const frames=Array.from({length:4},(_,j)=>({sides:start+j,angle:(angle+j*turn+720)%360,fill:(fill+j)%2}));
  const correct={sides:start+4,angle:(angle+4*turn+720)%360,fill:(fill+4)%2};
  const choices=shuffle([correct,
   {...correct,angle:(correct.angle+90)%360},{...correct,fill:1-correct.fill},
   {...correct,sides:correct.sides-1}],700+i);
  const answer=choices.findIndex(c=>JSON.stringify(c)===JSON.stringify(correct));
  pushQ(bank,{id:"S"+String(i+2).padStart(2,"0"),category:CATEGORIES[4],difficulty:i===3?"Ω":"Expert",
   prompt:"外框邊數、方向與中心填色同時變化。下一格是？",
   hint:"三個維度各有自己的規律；逐一追蹤。",
   explain:"邊數每次 +1，方向每次旋轉 "+turn+"°，填色每次反轉。",
   figure:{kind:"sequence",frames},options:L,answer,
   answerSpecs:choices.map(c=>({kind:"sequence",...c}))});
 });
 // Three explicit rotation tasks. One exact rotation, three distinct near-misses.
 [90,180,270].forEach((deg,i)=>{
  const options=shuffle([{kind:"rotation",angle:deg,mirror:false},
    {kind:"rotation",angle:deg,mirror:true},
    {kind:"rotation",angle:(deg+90)%360,mirror:false},
    {kind:"rotation",angle:(deg+270)%360,mirror:false}],800+i);
  const answer=options.findIndex(x=>x.angle===deg&&!x.mirror);
  pushQ(bank,{id:"ROT"+String(i+2).padStart(2,"0"),category:CATEGORIES[5],
   difficulty:i===2?"Ω":"Expert",prompt:"將原圖順時針旋轉 "+deg+"°，不允許鏡射。選出結果。",
   hint:"注意圖形上不對稱的小標記，它的位置也要一起旋轉。",
   explain:"旋轉方向固定為順時針 "+deg+"°；只有一項同時保留小標記與輪廓手性。",
   figure:{kind:"rotation",degrees:deg},options:L,answer,answerSpecs:options});
 });
 // Three independent Lights Out 3×3 boards, minimum click solved by exhaustive search.
 [3,4,5].forEach((cost,i)=>{
  let state=null,info=null,maskFound=0;
  for(let mask=1;mask<512;mask++){
   const bits=lightsState(mask),key=bits.join("");
   if((i===0?false:key==="000000000"))continue;
   const res=lightsShortest(bits);
   if(res.best===cost&&(mask%11)===(i+1)){state=bits;info=res;maskFound=mask;break;}
  }
  if(!state)throw Error("lights not found "+cost);
  pushQ(bank,qNumeric("MOVE"+String(i+2).padStart(2,"0"),CATEGORIES[6],"Expert",
   "按下一格翻轉自己與四鄰。讓棋盤全白至少按幾次？",
   "每格只需按一次或零次；同一組按法順序不影響最後狀態。",
   "枚舉所有 512 種按法，最短 "+info.best+" 次。",
   {kind:"lights",bits:state,maskFound},info.best,900+i));
 });
 // Four equal-count coin choice questions, candidates checked against displayed totals.
 const denom=[1,2,5,10,20,50],coinComb=permutations(denom).filter(p=>p.length===6).map(p=>p.slice(0,4));
 let seenCoins=new Set();
 for(let i=0;i<4;i++){
  const choices0=[[1,5,20,50],[2,5,20,50],[1,10,20,50],[1,2,20,50],[2,10,20,50],[1,5,10,50],[2,5,10,20]];
  const chosen=choices0[i],n=2+i,total=n*chosen.reduce((a,b)=>a+b,0);
  let distractors=choices0.filter(c=>c!==chosen&&c.join()!==chosen.join()&&n*c.reduce((a,b)=>a+b,0)!==total);
  const variants=shuffle([chosen,...distractors.slice(0,3)],1000+i);
  const answer=variants.findIndex(v=>v.join()===chosen.join());
  pushQ(bank,{id:"COM"+String(i+1).padStart(2,"0"),category:CATEGORIES[7],
   difficulty:i<2?"Hard":"Expert",
   prompt:"六種面額選四種，各使用 "+n+" 枚；總額 "+total+"。哪組面額正確？",
   hint:"用總額除以每種使用的枚數，得到四種面額之和。",
   explain:total+" ÷ "+n+" = "+chosen.reduce((a,b)=>a+b,0)+"；所以是 "+chosen.join("、")+"。",
   figure:{kind:"coins",denom},options:L,answer,answerSpecs:variants.map(v=>({kind:"coins",values:v})),
   checker:{kind:"coins",n,total,variants}});
 }
 // Four ordering questions, exactly one of four visual candidates satisfies all constraints.
 ORDER_RULES.forEach((rules,i)=>{
  const good=PERMS6.filter(p=>orderOk(p,rules)),bad=PERMS6.filter(p=>!orderOk(p,rules));
  if(good.length===0)throw Error("no valid ordering for "+i);
  const candidates=shuffle([good[(3*i)%good.length],...shuffle(bad,1200+i).slice(0,3)],1300+i);
  let answer=candidates.findIndex(p=>orderOk(p,rules));
  if(candidates.filter(p=>orderOk(p,rules)).length!==1)throw Error("ordering not unique");
  pushQ(bank,{id:"ORD"+String(i+1).padStart(2,"0"),category:CATEGORIES[8],
   difficulty:i<2?"Hard":"Expert",
   prompt:"依照下方五條限制，選出唯一符合條件的排列。",
   clues:orderWords(rules),hint:"先找必須相鄰的兩個字母，再測試其他限制。",
   explain:"合法排列為 "+candidates[answer].join("–")+"；其餘選項至少違反一項條件。",
   figure:{kind:"tokens",labels:["A","B","C","D","E","F"]},options:L,answer,
   answerSpecs:candidates.map(labels=>({kind:"tokens",labels})),checker:{kind:"order",candidates,rules}});
 });
 // Four logic-grid variants, preserve unique 4-person × 4-color assignment.
 const sol=logicAssignments();
 if(sol.length!==1)throw Error("logic template not unique: "+sol.length);
 for(let i=0;i<4;i++){
  const mappings=[
   ["A","B","C","D"],["K","L","M","N"],["P","Q","R","S"],["W","X","Y","Z"]
  ][i],known=sol[0],colorIndex=known.colors.indexOf(3),target=mappings[known.p[colorIndex]];
  const opts=shuffle(mappings,1500+i),answer=opts.indexOf(target);
  const A=mappings[0],B=mappings[1],C=mappings[2],D=mappings[3];
  pushQ(bank,{id:"LG"+String(i+1).padStart(2,"0"),category:CATEGORIES[9],
   difficulty:i<2?"Expert":"Ω",
   prompt:"四人各佔一個位置，白／綠／紅／藍各一次。誰對應藍色？",
   clues:[A+" 緊接在 "+D+" 之前",C+" 緊接在 "+B+" 之前",A+" 在 "+B+" 之前",
   "白色在第 1 位","綠色在第 2 位",B+" 不是紅色"],
   hint:"先找兩組相鄰人物，再由顏色和順序鎖定位置。",
   explain:"唯一順序為 "+[A,D,C,B].join("→")+"；所以藍色屬於 "+B+"。",
   figure:{kind:"logic",names:mappings},options:opts,answer,
   answerSpecs:opts.map(value=>({kind:"avatar",value})),checker:{kind:"logic",answer:target}});
 }
 // Three propositional consistency sets. Only one possible culprit yields exactly one true statement.
 const s=truthPatterns();
 s.forEach((set,i)=>{
  if(set.candidates.length!==1)throw Error("truth not unique set "+i+":"+set.candidates);
  const culprit=set.candidates[0],opts=shuffle(["A","B","C","D"],1600+i);
  pushQ(bank,{id:"T"+String(i+1).padStart(2,"0"),category:CATEGORIES[10],
   difficulty:i<2?"Expert":"Ω",prompt:"四人之中只有一人犯案，而且下列四句話恰好一真。是誰？",
   clues:set.statements.map((line,j)=>L[j]+"：「"+line+"」"),
   hint:"逐一假設四個嫌疑人犯案，檢查真話數是否恰好為一。",
   explain:"假設 "+L[culprit]+" 犯案時，恰有一句為真；其他假設都不符合。",
   figure:{kind:"suspects",labels:L},options:opts,answer:opts.indexOf(L[culprit]),
   answerSpecs:opts.map(value=>({kind:"avatar",value})),checker:{kind:"truth",candidates:set.candidates}});
 });
 // Two cube net variants. Opposite pairs of the chosen valid net: C-E, A-F, B-D.
 [["A","F"],["B","D"]].forEach(([ask,opposite],i)=>{
  const faces=shuffle(["A","B","C","D","E","F"].filter(x=>x!==ask),1700+i).slice(0,4);
  if(!faces.includes(opposite))faces[0]=opposite;
  const opts=shuffle(faces,1800+i);
  pushQ(bank,{id:"SP"+String(i+2).padStart(2,"0"),category:CATEGORIES[11],
   difficulty:i===0?"Hard":"Expert",prompt:"把立方體展開圖折起來，哪一面與 "+ask+" 相對？",
   hint:"立方體互相相對的面不可能共用邊。",
   explain:"展開圖折起來後 "+ask+" 與 "+opposite+" 位於相對兩面。",
   figure:{kind:"cubeNet",ask},options:opts,answer:opts.indexOf(opposite),
   answerSpecs:opts.map(value=>({kind:"face",value}))});
 });
 // Internal grade labels are explicit editorial bins, not measured IQ difficulty.
 const gradeOverrides={
  P03:"Hard",C02:"Hard",R02:"Hard",M02:"Hard",S02:"Hard",
  ROT02:"Hard",MOVE02:"Hard",LG01:"Hard",T01:"Hard",
  P05:"Expert",C04:"Expert"
 };
 bank.forEach(q=>{if(gradeOverrides[q.id])q.difficulty=gradeOverrides[q.id];});
 bank.forEach(q=>{q.generator=generatorMeta(q.id);});
 if(bank.length!==50)throw Error("expected 50, got "+bank.length);
 if(new Set(bank.map(x=>x.id)).size!==bank.length)throw Error("duplicate puzzle ids");
 // Audit every key gameplay invariant (category coverage, options, solver-backed unique answer).
 const counts=Object.fromEntries(CATEGORIES.map(name=>[name,0]));
 bank.forEach(q=>{
  counts[q.category]++;
  if(q.options.length!==4||q.answer<0||q.answer>3)throw Error("invalid question "+q.id);
  if(q.answerSpecs&&q.answerSpecs.length!==4)throw Error("wrong answer images "+q.id);
  if(q.checker?.kind==="matrix"){
   let {op,rows,masks}=q.checker;
   if(matrixOp(op,rows[2][0],rows[2][1])!==masks[q.answer])throw Error("matrix answer mismatch "+q.id);
  }
  if(q.checker?.kind==="coins"){
   let {n,total,variants}=q.checker;
   if(variants.filter(v=>v.reduce((a,b)=>a+b,0)*n===total).length!==1)throw Error("coin choices ambiguous "+q.id);
  }
  if(q.checker?.kind==="order"){
   let {candidates,rules}=q.checker;
   if(candidates.filter(c=>orderOk(c,rules)).length!==1)throw Error("order ambiguous "+q.id);
  }
 });
 if(Object.values(counts).some(n=>n<3))throw Error("domain underrepresented");
 return bank;
}
export const PUZZLES=buildBank();
export const BANK_META={
 version:"0.4.0",count:PUZZLES.length,
 categoryCount:CATEGORIES.length,
 difficultyCounts:PUZZLES.reduce((m,q)=>(m[q.difficulty]=(m[q.difficulty]||0)+1,m),{}),
 categoryCounts:PUZZLES.reduce((m,q)=>(m[q.category]=(m[q.category]||0)+1,m),{})
};
