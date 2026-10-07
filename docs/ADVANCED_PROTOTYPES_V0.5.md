# AXIOM V0.5 — Proof-Oriented Prototype Families

These six fixtures are deliberately **not published**. They exist to prove the semantics and verifier behavior of three future Expert/Ω families before those families enter the player-facing bank.

## Shared rule

A prototype may not enter the published bank merely because one displayed option looks right. Its verifier must enumerate the relevant finite space and establish the exact property the question asks.

The current prototype gate requires:

- exactly two prototypes per family;
- deterministic, finite search;
- one verified full solution where the family needs a solved world;
- unique task answer under the family's formal semantics;
- `published: false` until a later promotion PR adds rendering, human QA and difficulty review.

## 1. Proof Compression

**Question semantics:** Given clues (C_1...C_n) whose full set determines a unique world (w), find a smallest subset of clues that still determines exactly the same unique world.

Verifier:

1. solve the full clue set and require exactly one world;
2. enumerate clue subsets by increasing cardinality;
3. solve every subset;
4. keep subsets whose solution set is exactly `{w}`;
5. stop at the first cardinality with any valid subset.

Prototype admission currently requires the minimum sufficient subset itself to be unique, not merely the minimum size. This avoids tie ambiguity in a single-answer game.

Included:
- `PC-P01`: four binary switches, 4 clues, unique 3-clue proof;
- `PC-P02`: four binary switches, 5 clues, unique 3-clue proof.

## 2. Necessary Clue

**Question semantics:** The full clue set has a unique solution. A clue is necessary when removing that one clue causes the remaining system to stop having that same unique solution.

Verifier:

1. solve all clues and require one world;
2. remove clue (i);
3. re-solve the remaining system;
4. mark (i) necessary if the result is not exactly the original single world;
5. repeat for every clue.

The current prototypes each require exactly one necessary clue so the future multiple-choice answer is unambiguous.

Included:
- `NC-P01`: 4 binary clues; only clue index 2 is necessary;
- `NC-P02`: 5 binary clues; only clue index 2 is necessary.

## 3. Counterexample Hunt

**Question semantics:** A proposed universal rule is false. Find the counterexample with minimum declared complexity.

The verifier distinguishes two questions:

- **Is it a counterexample?** It satisfies the hypothesis premise while violating the conclusion.
- **Is it minimal?** No counterexample in the declared universe has lower complexity.

Ties are not silently broken by option order. A publishable single-answer prototype must have exactly one minimum-complexity counterexample.

Included:
- `CE-P01`: four possible line segments; complexity is active-segment count;
- `CE-P02`: polygon features; complexity is side count.

## Why these stay separate from the 50-puzzle bank

They currently validate reasoning semantics only. They still need:

- player-facing visual representation;
- original distractor construction;
- progressive hints;
- human readability/gameplay QA;
- calibrated difficulty evidence.

Only after those checks should a later PR promote selected prototypes into `src/questions.js`. This preserves the V0.5 principle that new Ω content is admitted by evidence, not by label.
