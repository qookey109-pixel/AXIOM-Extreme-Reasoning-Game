import {PUZZLES,CATEGORIES,BANK_META} from "./questions.js";
import {renderFigure,renderChoiceImage} from "./graphics.js";
import {createBlockInteraction} from "./block-interaction.js";
import {createLiquidField} from "./liquid-field.js";
export const APP_BUILD="V0.8.2-20261009";
const $=id=>document.getElementById(id);
const screens=["home","game","results"];
const state={pool:[],index:0,selected:-1,answered:[],hints:0,hinted:false,hintStep:0,started:0,questionStart:0,correct:0,mode:10,category:"全部",difficulty:"全部"};
const saveKey="axiom-v04-completed";
const blockArt=createBlockInteraction();
const liquidArt=createLiquidField();
function setScreen(name){
 screens.forEach(id=>$(id).classList.toggle("is-active",id===name));
 document.body.dataset.screen=name;
}
function fmtTime(ms){
 const seconds=Math.max(0,Math.floor(ms/1000));
 return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
}
function selectChip(container,value){
 [...container.querySelectorAll("button")].forEach(btn=>{
  const active=btn.dataset.value===value;
  btn.classList.toggle("selected",active);btn.setAttribute("aria-pressed",String(active));
 });
}
function setChoices(){
 const categories=$("categoryFilter");
 const frag=document.createDocumentFragment();
 ["全部",...CATEGORIES].forEach(name=>{
  const option=document.createElement("option");option.value=name;option.textContent=name;frag.appendChild(option);
 });
 categories.appendChild(frag);
 categories.onchange=()=>{state.category=categories.value;updateEstimate();blockArt.recompose(state.category,state.difficulty);liquidArt.mood(state.category,state.difficulty);};
 [...$("difficultyFilter").children].forEach(btn=>{
  btn.onclick=()=>{state.difficulty=btn.dataset.value;selectChip($("difficultyFilter"),state.difficulty);updateEstimate();blockArt.recompose(state.category,state.difficulty);liquidArt.mood(state.category,state.difficulty);};
 });
 updateEstimate();
}
function available(){
 return PUZZLES.filter(q=>(state.category==="全部"||q.category===state.category)&&(state.difficulty==="全部"||q.difficulty===state.difficulty));
}
function updateEstimate(){
 const len=available().length;
 $("availableCount").textContent=len+" 道已收錄題目";
 $("startTen").disabled=len===0;
 $("startAll").disabled=len===0;
 $("startAll").textContent=len===BANK_META.count?"完整試煉 · "+BANK_META.count+" 題":"挑戰此題組 · "+len+" 題";
}
function shuffled(list){
 const a=list.slice();
 for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
 return a;
}
function start(mode){
 const a=available();
 if(!a.length)return;
 let deck=[];
 if(mode===10&&a.length>10){
  // Spread domains across each short trial before drawing additional variants.
  const grouped=CATEGORIES.map(c=>shuffled(a.filter(q=>q.category===c)));
  for(let round=0;deck.length<10;round++){
   let progress=false;
   for(const group of shuffled(grouped)){
    if(deck.length===10)break;
    if(group[round]){deck.push(group[round]);progress=true;}
   }
   if(!progress)break;
  }
 }else deck=shuffled(a);
 state.pool=deck;state.index=0;state.answered=[];state.hints=0;state.hinted=false;state.hintStep=0;state.correct=0;
 state.mode=deck.length;state.started=Date.now();state.questionStart=Date.now();
 setScreen("game");render();blockArt.launch();
}
function displayClue(q){
 const hasClues=Array.isArray(q.clues)&&q.clues.length>0;
 const board=$("clueBoard"),stage=$("puzzleStage"),button=$("clueButton"),zoom=$("zoomButton");
 board.replaceChildren();
 board.hidden=!hasClues;
 board.dataset.count=hasClues?String(q.clues.length):"0";
 stage.classList.toggle("has-clues",hasClues);
 button.hidden=!hasClues;
 zoom.textContent=hasClues?"放大條件 ↗":"放大 ↗";
 zoom.setAttribute("aria-label",hasClues?"放大查看全部推理條件":"放大題圖");
 if(!hasClues)return;
 button.textContent="條件已顯示 · 放大閱讀";
 const fullText=q.clues.map((s,i)=>(i+1)+"．"+s).join("\n");
 button.onclick=()=>openDialog("本題全部條件",fullText);
 const whoSpeaks=q.figure?.kind==="suspects";
 q.clues.forEach((raw,i)=>{
  const card=document.createElement("div");card.className="clue-card";card.setAttribute("role","listitem");
  const label=document.createElement("span");label.className="clue-number";
  const content=document.createElement("span");content.className="clue-copy";
  let phrase=raw;
  if(whoSpeaks){
   const match=raw.match(/^([A-D])：(.+)$/);
   if(match){label.textContent=match[1];phrase=match[2];}
   else label.textContent=String(i+1).padStart(2,"0");
  }else label.textContent=String(i+1).padStart(2,"0");
  content.textContent=phrase;
  card.append(label,content);
  board.append(card);
 });
}
function render(){
 const q=state.pool[state.index];if(!q)return;
 state.selected=-1;state.hinted=false;state.hintStep=0;state.questionStart=Date.now();
 $("categoryLabel").textContent=q.category;
 $("difficultyLabel").textContent=q.difficulty;
 $("questionNum").textContent=String(state.index+1).padStart(2,"0")+" / "+state.pool.length;
 $("progressBar").style.width=(state.index/state.pool.length*100)+"%";
 $("prompt").textContent=q.prompt;
 $("questionId").textContent=q.id;
 displayClue(q);
 const image=$("mainFigure");
 image.onerror=()=>{
  if(q.asset&&image.dataset.backup!=="yes"){
   image.dataset.backup="yes";image.src=q.asset.replace("/png/", "/").replace(".png",".svg");
  }
 };
 image.dataset.backup="no";
 image.src=renderFigure(q);
 image.alt=q.category+" 題目圖案";
 $("answerGrid").replaceChildren();
 for(let i=0;i<4;i++){
  const btn=document.createElement("button");btn.className="answer";
  btn.type="button";btn.dataset.index=String(i);btn.setAttribute("aria-pressed","false");
  btn.setAttribute("aria-label","選項 "+(i+1)+"，"+q.options[i]);
  const badge=document.createElement("span");badge.className="answer-letter";badge.textContent=String.fromCharCode(65+i);
  const img=document.createElement("img");img.alt="";img.draggable=false;img.loading="eager";img.src=renderChoiceImage(q,i);
  const label=document.createElement("span");label.className="answer-label";label.textContent=q.options[i];
  if(q.answerSpecs?.[i]?.kind==="avatar"){
   label.classList.add("answer-caption");label.textContent="人物 "+q.options[i];
  }
  btn.append(badge,img,label);
  btn.onclick=()=>choose(i);
  $("answerGrid").append(btn);
 }
 $("confirm").disabled=true;
 const hintSteps=Array.isArray(q.hint_steps)&&q.hint_steps.length?q.hint_steps:[{stage:"stronger",text:q.hint}];
 $("hintButton").disabled=false;
 $("hintButton").textContent="提示 1 / "+hintSteps.length;
 $("confirm").textContent=state.index===state.pool.length-1?"提交並完成":"確認作答";
}
function choose(i){
 state.selected=i;
 [...$("answerGrid").children].forEach((btn,j)=>{
  const active=j===i;btn.classList.toggle("selected",active);btn.setAttribute("aria-pressed",String(active));
 });
 $("confirm").disabled=false;
}
function submit(){
 if(state.selected<0)return;
 const q=state.pool[state.index],correct=state.selected===q.answer;
 state.answered.push({id:q.id,pick:state.selected,correct,hint:state.hinted,time:Date.now()-state.questionStart});
 if(correct)state.correct++;
 if(state.index===state.pool.length-1)finish();
 else{state.index++;render();}
}
function finish(){
 const elapsed=Date.now()-state.started;
 // Fixed bounded penalty; duration is reported but never penalizes complex, slow reasoning.
 const score=Math.max(0,Math.round(state.correct/state.pool.length*1000-state.hints*20));
 $("score").textContent=String(score);
 $("statAccuracy").textContent=Math.round(state.correct/state.pool.length*100)+"%";
 $("statCorrect").textContent=state.correct+" / "+state.pool.length;
 $("statTime").textContent=fmtTime(elapsed);
 $("statHints").textContent=String(state.hints);
 let previous=0;try{previous=Number(localStorage.getItem(saveKey))||0;localStorage.setItem(saveKey,String(previous+1));}catch(_){}
 setScreen("results");$("progressBar").style.width="100%";
}
function useHint(){
 const q=state.pool[state.index];
 const steps=Array.isArray(q.hint_steps)&&q.hint_steps.length?q.hint_steps:[{stage:"stronger",text:q.hint}];
 if(state.hintStep>=steps.length)return;
 const step=steps[state.hintStep],number=state.hintStep+1;
 state.hinted=true;state.hints++;state.hintStep++;
 const button=$("hintButton"),done=state.hintStep>=steps.length;
 button.disabled=done;
 button.textContent=done?"提示已用完":"下一提示 "+(state.hintStep+1)+" / "+steps.length;
 const stageName=step.stage==="structural"?"結構":step.stage==="stronger"?"加強":"提示";
 openDialog("提示 "+number+" / "+steps.length+" · "+stageName,step.text);
}
function review(){
 const lines=state.pool.map((q,i)=>{
  const a=state.answered[i],icon=a.correct?"✓":"✕";
  return (i+1)+". "+icon+"  "+q.category+" · "+q.difficulty+
   "\n你的答案："+q.options[a.pick]+"；正解："+q.options[q.answer]+"\n"+q.explain;
 });
 openDialog("答案與推理解析",lines.join("\n\n"));
}
function openDialog(title,text,image){
 const dialog=$("dialog");$("dialogTitle").textContent=title;
 $("dialogText").textContent=text||"";
 const im=$("dialogImage");im.hidden=!image;
 if(image)im.src=image;
 dialog.showModal();
}
function closeDialog(){if($("dialog").open)$("dialog").close();}
$("startTen").onclick=()=>start(10);
$("startAll").onclick=()=>start(Infinity);
$("confirm").onclick=submit;
$("clearButton").onclick=()=>{state.selected=-1;[...$("answerGrid").children].forEach(b=>{b.classList.remove("selected");b.setAttribute("aria-pressed","false");});$("confirm").disabled=true;};
$("hintButton").onclick=useHint;
$("zoomButton").onclick=()=>{
 const q=state.pool[state.index];
 if(q?.clues?.length)openDialog("本題全部條件",q.clues.map((s,i)=>(i+1)+"．"+s).join("\n"));
 else openDialog("放大題圖","", $("mainFigure").src);
};
$("reviewButton").onclick=review;
$("retryButton").onclick=()=>{blockArt.reset();setScreen("home");};
$("dialogClose").onclick=closeDialog;
$("dialog").addEventListener("click",e=>{if(e.target===$("dialog"))closeDialog();});
document.addEventListener("keydown",e=>{
 if($("dialog").open||!$("game").classList.contains("is-active"))return;
 if(["1","2","3","4"].includes(e.key))choose(Number(e.key)-1);
 if(e.key==="Enter"&&state.selected>=0){e.preventDefault();submit();}
 if(e.key==="Backspace"){e.preventDefault();$("clearButton").click();}
});
setInterval(()=>{
 if($("game").classList.contains("is-active"))$("timer").textContent=fmtTime(Date.now()-state.started);
},500);
setChoices();
// The home screen is intentionally full-bleed without the former top header.
window.AXIOM_QA={bank:PUZZLES,meta:BANK_META,build:APP_BUILD,state,render,renderFigure,renderChoiceImage,blockArt,liquidArt};
