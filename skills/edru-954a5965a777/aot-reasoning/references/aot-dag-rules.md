# AoT DAG Rules

## Dependency validity

A dependency from node `A` to node `B` is valid only when:
- `B` requires information produced by `A`, and
- that information is not directly available from the original task statement.

Avoid pseudo-dependencies caused by narrative ordering.

## Node design

Each node should be:
- atomic enough to solve independently,
- specific enough to verify, and
- expressed as a concrete subproblem, not a vague intention.

## Contraction rules

When creating `Qi+1` from `Gi`:
- carry forward solved independent node outputs as explicit conditions,
- remove branches proven irrelevant or redundant,
- keep all original constraints and success criteria,
- preserve answer equivalence with `Q0`.

## Complexity reduction test

`Qi+1` passes only if it should require fewer reasoning steps than `Qi` under comparable model/tool settings.

## Failure signals

Stop iteration and return best available solution when any signal appears:
- contraction drops or changes a hard constraint,
- answer intent shifts from `Q0`,
- DAG quality is too noisy to trust dependencies,
- no measurable simplification across two consecutive iterations.