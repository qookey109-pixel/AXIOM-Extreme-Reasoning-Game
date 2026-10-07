# AXIOM V0.5 Verification Core

This layer raises puzzle-quality guarantees without changing the V0.4.3 player flow or replacing existing generators.

## Principles

1. Existing deterministic generators and family-specific checks remain authoritative inputs.
2. Verification facts are machine-computed; editorial states are tracked separately.
3. `answer.unique` and `model.unique` are different claims.
4. Model uniqueness is only claimed inside a declared, bounded rule grammar.
5. Some families have no hidden-rule model. Optimization, state-search, explicit-transform and constraint puzzles use family-specific semantic solution checks instead.
6. Published legacy puzzles may remain pending in the new verifier during migration; V0.5 must not fabricate stronger claims.

## Machine verification fields

Each runtime manifest produced by `buildVerificationManifest(q)` includes:

- `schema_version`
- stable `id`
- `family` and `variant`
- generator identity/version plus semantic and option-selection seeds
- provenance
- verifier identity/version
- structural validity
- solver verification state
- answer scope/count/uniqueness
- semantic solution count
- witness count when relevant
- model applicability, declared grammar, model count and bounded uniqueness claim
- migration notes

Editorial state is separate:

- `human_qa`
- `calibrated`
- `published`

This avoids the false implication that a currently published V0.4 puzzle has already passed future calibration or V0.5 human review.

## Answer count vs model count

`answer.count` means the number of semantically distinct answers produced by the verifier for the question actually asked.

`model.count` means the number of rule models inside a declared grammar that fit the observations. Two different rule descriptions that are observationally equivalent for all states represented by the grammar should be canonicalized into the same model before counting. V0.5 currently uses compact hand-declared grammars whose model identities are already canonical.

A puzzle can have one answer but more than one fitting rule model. For rule-induction Ω puzzles that is not sufficient.

## Ω machine gate

A supported Ω puzzle must satisfy:

- structural validity;
- independent solver verification;
- one semantic answer;
- and, only when the family is rule-induction based, one fitting model inside its declared grammar.

For non-rule families, the family verifier must instead establish its exact semantic condition. Examples:

- path optimization: unique optimal value; multiple optimal witness paths may exist;
- Lights Out: unique minimum move count; multiple minimum press masks may exist;
- explicit rotation: exactly one displayed transform satisfies the explicit instruction;
- Logic Grid / truth constraints: solution-space enumeration determines target uniqueness.

Human QA and calibration remain separate publication-quality gates.

## Initial verifier adapters

V0.5 initially wraps:

- matrix grammar search;
- circle arithmetic grammar search;
- path exhaustive search;
- Lights Out 512-mask exhaustive search;
- coin combination enumeration;
- ordering permutation enumeration;
- Logic Grid exhaustive assignments;
- truth candidate verification;
- visual sequence bounded grammar search;
- explicit rotation validation;
- cube-net opposite-face validation.

The current 50-puzzle catalog is now independently reproducible at the verifier layer. Legacy visual puzzles carry explicit semantic checker inputs reconstructed from the repository's own SVG/source assets, so CI verifies their rules without scraping rendered pixels.

## Current verification coverage

For the current 50-puzzle catalog, CI requires:

- 50 / 50 structurally valid;
- 50 / 50 independently solver verified;
- 50 / 50 verified unique answers;
- zero pending verification items;
- every Ω puzzle to pass its family-specific machine gate;
- every rule-induction puzzle to be model-unique inside its declared bounded grammar.

The migration does not change visible game wording, answers, scoring or interaction.

## Next migration stages

1. split single hints into structural / stronger / near-solution stages;
2. add editorial human-QA and calibration records;
3. add Proof Compression, Necessary Clue and Counterexample Hunt prototypes only after those foundations remain green.

Generator provenance is now complete for the current catalog: every puzzle carries a generator id, version, explicit seed field and option seed field. Static constructions use `seed: null` rather than inventing randomness; seeded generators preserve the exact deterministic seeds already used by the V0.4 source.

## Progressive hint contract

The V0.5 player flow reveals hints in increasing strength:

1. `structural`: points to the representation or decomposition strategy without naming the answer;
2. `stronger`: preserves the previously reviewed per-puzzle hint and narrows the solving method;
3. `solution explanation`: remains outside `hint_steps` and is shown only in post-answer review.

The complete explanation is deliberately not copied into the hint array. CI checks that the two current hint stages exist for every puzzle and that neither equals the solution explanation. The interface counts each revealed hint stage separately, so asking for stronger assistance carries an additional bounded score penalty.

## CI policy

`npm test` runs both the existing bank invariant test and the V0.5 verification audit.

The migration gate blocks:

- structural regression in any of the 50 published puzzles;
- unexpected loss of independent verifier coverage;
- a solver-verified item that does not have a unique answer;
- a solver-verified rule-induction item that is ambiguous inside its declared grammar;
- a verified Ω puzzle that fails its family-specific machine admission gate.

Pending legacy items are reported explicitly and are not silently upgraded.
