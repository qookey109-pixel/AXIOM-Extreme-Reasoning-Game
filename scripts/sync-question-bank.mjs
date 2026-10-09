import assert from "node:assert/strict";
import {readFileSync,writeFileSync} from "node:fs";
import {PUZZLES,CATEGORIES,BANK_META} from "../src/questions.js";

const destination=new URL("../question_bank.json",import.meta.url);
const snapshot={
 version:BANK_META.version,
 source_of_truth:"src/questions.js",
 categories:CATEGORIES,
 difficulty_labels:["Hard","Expert","Ω"],
 meta:BANK_META,
 questions:PUZZLES,
 notice:"Deterministic source snapshot of the live AXIOM catalog. Generated from src/questions.js and src/expansion-v052.js; do not edit manually."
};
const expected=JSON.stringify(snapshot,null,2)+"\n";
if(process.argv.includes("--write")){
 writeFileSync(destination,expected,"utf8");
 console.log("WROTE question_bank.json: "+PUZZLES.length+" puzzles, "+BANK_META.version);
}else{
 const actual=readFileSync(destination,"utf8");
 assert.equal(actual,expected,
  "question_bank.json must match the exact live puzzle bank; run npm run bank:sync");
 console.log("PASS question_bank.json synced: "+PUZZLES.length+" puzzles, "+BANK_META.version);
}
