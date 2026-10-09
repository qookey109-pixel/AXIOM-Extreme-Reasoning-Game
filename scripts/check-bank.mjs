import assert from "node:assert/strict";
import {PUZZLES,CATEGORIES,BANK_META} from "../src/questions.js";
assert.equal(PUZZLES.length,50);
assert.equal(CATEGORIES.length,12);
assert.deepEqual(BANK_META.difficultyCounts,{Hard:18,Expert:22,"Ω":10});
const ids=new Set();
for(const q of PUZZLES){
 assert(!ids.has(q.id),"duplicate id "+q.id);ids.add(q.id);
 assert(CATEGORIES.includes(q.category),"unknown domain "+q.id);
 assert(["Hard","Expert","Ω"].includes(q.difficulty),"unknown level "+q.id);
 assert.equal(q.options.length,4,q.id);
 assert.equal(new Set(q.options).size,4,q.id);
 assert(q.answer>=0&&q.answer<=3,q.id);
 assert(typeof q.prompt==="string"&&q.prompt.length>10,q.id);
 assert(typeof q.hint==="string"&&q.hint.length>5,q.id);
 assert(Array.isArray(q.hint_steps)&&q.hint_steps.length>=2,q.id+" staged hints");
 assert.deepEqual(q.hint_steps.map(x=>x.stage),["structural","stronger"],q.id+" hint stages");
 assert(q.hint_steps.every(x=>typeof x.text==="string"&&x.text.length>5),q.id+" hint text");
 assert.equal(q.hint_steps.at(-1).text,q.hint,q.id+" stronger hint must preserve original hint");
 assert(q.hint_steps.every(x=>x.text!==q.explain),q.id+" solution explanation leaked into hints");
 assert(typeof q.explain==="string"&&q.explain.length>5,q.id);
 assert(q.figure&&typeof q.figure.kind==="string",q.id);
 assert(q.asset||q.figure.kind!=="legacy",q.id);
 assert.equal(q.answerSpecs.length,4,q.id);
 // Every graphic answer tile must contain visible geometry; a mask of 0 was
 // previously encoded as a valid PNG with an entirely blank interior.
 for(const [i,spec] of q.answerSpecs.entries()){
  if(spec.kind!=="segments")continue;
  if(Object.hasOwn(spec,"mask")){
   assert(Number.isInteger(spec.mask)&&spec.mask>0,q.id+" blank segment mask in option "+(i+1));
  } else {
   assert(Array.isArray(spec.lines)&&spec.lines.length>0,q.id+" blank segment lines in option "+(i+1));
  }
 }
}
assert.equal(Object.keys(BANK_META.categoryCounts).length,12);
assert(Object.values(BANK_META.categoryCounts).every(n=>n>=3));
assert(!PUZZLES.find(q=>q.id==="ROT01").prompt.includes("請選 B"),"answer leaked in prompt");
console.log(JSON.stringify({status:"PASS",version:BANK_META.version,questionCount:50,
  tiers:BANK_META.difficultyCounts,categories:BANK_META.categoryCounts},null,2));
