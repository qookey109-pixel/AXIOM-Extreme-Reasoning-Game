import assert from "node:assert/strict";
import {ADVANCED_PROTOTYPES,auditAdvancedPrototypes} from "../src/advanced-prototypes.js";

const audit=auditAdvancedPrototypes();
assert.equal(audit.total,6);
assert.equal(audit.passed,6,JSON.stringify(audit.results.filter(x=>!x.pass),null,2));
assert.equal(audit.published,0,"research prototypes must not enter the published bank");
assert.deepEqual([...audit.families].sort(),["counterexample_hunt","necessary_clue","proof_compression"]);

const counts=ADVANCED_PROTOTYPES.reduce((m,p)=>(m[p.family]=(m[p.family]||0)+1,m),{});
assert.deepEqual(counts,{proof_compression:2,necessary_clue:2,counterexample_hunt:2});
assert.equal(new Set(ADVANCED_PROTOTYPES.map(x=>x.id)).size,6,"duplicate prototype ids");

for(const p of ADVANCED_PROTOTYPES){
 assert(p.prompt.length>20,p.id+" prompt");
 assert(p.difficulty.endsWith("-prototype"),p.id+" difficulty must stay prototype-only");
}

const pc=audit.results.filter(x=>x.family==="proof_compression");
assert(pc.every(x=>x.result.minimal_sets.length===1),"Proof Compression prototypes require a unique minimum sufficient set");

const nc=audit.results.filter(x=>x.family==="necessary_clue");
assert(nc.every(x=>x.result.necessary.length===1),"Necessary Clue prototypes require exactly one necessary clue");

const ce=audit.results.filter(x=>x.family==="counterexample_hunt");
assert(ce.every(x=>x.result.minimal.length===1),"Counterexample Hunt prototypes require a unique minimum counterexample");

console.log(JSON.stringify({status:"PASS",...audit},null,2));
