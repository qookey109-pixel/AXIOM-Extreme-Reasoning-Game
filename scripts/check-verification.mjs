import assert from "node:assert/strict";
import {PUZZLES} from "../src/questions.js";
import {VERIFICATION_SCHEMA_VERSION,auditBank,omegaAdmission} from "../src/verification.js";

const {manifests,summary}=auditBank(PUZZLES);
assert.equal(VERIFICATION_SCHEMA_VERSION,"0.5.0");
assert.equal(manifests.length,50);
assert.equal(summary.valid,50,"all published puzzles must remain structurally valid");

// V0.5 is a migration layer: only families with an independent verifier are upgraded.
// This threshold prevents silent regression without falsely claiming all legacy items are verified.
assert(summary.solver_verified>=35,"verification coverage unexpectedly regressed: "+summary.solver_verified);

for(const m of manifests){
 assert.equal(m.schema_version,VERIFICATION_SCHEMA_VERSION,m.id);
 assert(typeof m.family==="string"&&m.family.length>0,m.id+" missing family");
 assert(m.provenance?.origin==="axiom_original",m.id+" provenance");
 assert(m.editorial?.published===true,m.id+" publication state");
 if(m.machine.solver_verified){
  assert.equal(m.machine.answer.unique,true,m.id+" verifier did not establish a unique answer");
 }
 if(m.machine.model.applicable&&m.machine.solver_verified){
  assert.equal(m.machine.model.unique,true,m.id+" model is ambiguous inside declared grammar");
  assert(typeof m.machine.model.bounded_claim==="string"&&m.machine.model.bounded_claim.length>10,m.id+" missing bounded uniqueness claim");
 }
}

// Ω is not allowed to mean "model_count === 1" for every family.
// Rule-induction families require bounded model uniqueness; exact optimization/constraint
// families instead require the family-specific semantic solution condition.
const omega=PUZZLES.filter(q=>q.difficulty==="Ω").map(q=>{
 const manifest=manifests.find(m=>m.id===q.id);
 return {id:q.id,verified:manifest.machine.solver_verified,...omegaAdmission(manifest)};
});
const verifiedOmega=omega.filter(x=>x.verified);
assert(verifiedOmega.length>0,"expected at least one independently verified Ω puzzle");
assert(verifiedOmega.every(x=>x.pass),JSON.stringify(verifiedOmega.filter(x=>!x.pass)));

console.log(JSON.stringify({status:"PASS",schema:VERIFICATION_SCHEMA_VERSION,...summary,omega},null,2));
