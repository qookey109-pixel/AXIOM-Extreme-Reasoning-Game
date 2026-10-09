import assert from "node:assert/strict";
import {PROMOTION_CANDIDATES,auditPromotionCandidates} from "../src/promotion-candidates.js";

const audit=auditPromotionCandidates();
assert.equal(audit.total,3);
assert.equal(audit.machine_ready,3,JSON.stringify(audit.results.filter(x=>!x.machine_ready),null,2));
assert.equal(audit.promotion_ready,0,"candidates must remain blocked until rendering and editorial gates pass");
assert.equal(audit.published,0,"promotion candidates must stay outside the published bank");

assert.deepEqual(
 [...new Set(PROMOTION_CANDIDATES.map(x=>x.family))].sort(),
 ["counterexample_hunt","necessary_clue","proof_compression"]
);
assert.equal(new Set(PROMOTION_CANDIDATES.map(x=>x.id)).size,3,"duplicate candidate ids");

for(const c of PROMOTION_CANDIDATES){
 assert.equal(c.options.length,4,c.id+" option count");
 assert.equal(new Set(c.options.map(x=>JSON.stringify(x))).size,4,c.id+" duplicate semantic options");
 assert.deepEqual(c.hint_steps.map(x=>x.stage),["structural","stronger","near_solution"],c.id+" hint stages");
 assert.equal(c.published,false,c.id+" must stay unpublished");
}

for(const r of audit.results){
 assert(r.machine_ready,r.id+" machine gate");
 assert(!r.promotion_ready,r.id+" must not be promoted early");
 assert(r.blockers.includes("render_ready"),r.id+" rendering blocker");
 assert(r.blockers.includes("human_qa"),r.id+" human QA blocker");
 assert(r.blockers.includes("difficulty_review"),r.id+" difficulty review blocker");
 assert(!r.blockers.includes("source_verified"),r.id+" source verifier failed");
 assert(!r.blockers.includes("semantic_task_unique"),r.id+" semantic task ambiguous");
 assert(!r.blockers.includes("displayed_answer_unique"),r.id+" displayed answer ambiguous");
}

console.log(JSON.stringify({status:"PASS",...audit},null,2));
