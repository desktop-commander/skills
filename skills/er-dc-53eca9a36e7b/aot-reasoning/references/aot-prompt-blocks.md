# AoT Prompt Blocks

Use these blocks as reusable templates. Replace placeholders before use.

## 1) Decompose (`Qi -> Gi`)

```text
Decompose the current task state into a DAG of subproblems.
Current state:
{{QI}}

Return JSON with:
- nodes: [{id, description, depends_on: []}]

Rules:
- Dependencies must reflect required information flow, not ordering.
- Keep nodes minimal and testable.
- Include empty dependency lists for independent nodes.
```

## 2) Contract (`Gi -> Qi+1`)

```text
Given this DAG and solved independent nodes, generate a simpler next state Qi+1.
DAG:
{{GI_JSON}}
Solved independent node outputs:
{{KNOWN_CONDITIONS}}

Requirements for Qi+1:
- Self-contained.
- Answer-equivalent to Q0.
- Reduced reasoning complexity versus Qi.

Return only Qi+1.
```

## 3) Judge / Quality Gate

```text
Original task Q0:
{{Q0}}

Candidate A (solve Qi):
{{SOLVE_QI}}

Candidate B (solve Gi):
{{SOLVE_GI}}

Candidate C (solve Qi+1):
{{SOLVE_QI1}}

Choose the best candidate for Q0.
Return:
- chosen_candidate: A | B | C
- short rationale
- confidence: low | medium | high
```

## 4) Iteration stop decision

```text
Based on the chosen candidate and contraction quality,
should the AoT loop continue?

Return:
- continue: yes | no
- reason
```

## 5) Final answer packaging

```text
Produce final output for the user with:
1) Final answer
2) Compact AoT trace (Q0 -> ... -> Qk)
3) Key assumptions introduced by contraction
4) Risks or uncertainty
```
