---
name: aot-reasoning
description: Apply Atom of Thoughts (AoT) to solve complex tasks by iteratively decomposing into dependency-structured subproblems, contracting into simpler answer-equivalent states, and selecting stable transitions.
version: 1.0.0
---

# AoT Reasoning

## Overview

This skill applies the Atom of Thoughts (AoT) method as a practical reasoning workflow for real tasks. It is used to reduce reasoning complexity while preserving answer equivalence through iterative decomposition and contraction.

## When to Use

Use this skill when at least one of the following is true:
- A task is complex, multi-step, or prone to reasoning drift.
- Multiple candidate solution paths exist and efficient pruning is needed.
- A shorter, more stable problem formulation is needed before solving.
- Existing chain-style reasoning is verbose or inefficient.

## Core Concepts

- `Q0`: Original user task.
- `Qi`: Current AoT state, answer-equivalent to `Q0`.
- `Gi`: Temporary DAG of dependencies extracted from `Qi`.
- Decomposition: Convert `Qi` into DAG nodes with explicit dependencies.
- Contraction: Fold solved independent nodes into a simpler next state `Qi+1`.

## Workflow

### Step 1: Define the initial state

Rewrite the user request as a precise, self-contained `Q0` with explicit goal, constraints, and expected output format.

### Step 2: Decompose into DAG

Break `Qi` into numbered nodes. For each node, list:
- node description
- required inputs
- dependency indices (empty list for independent nodes)

Use [AoT DAG Rules](references/aot-dag-rules.md) for dependency validity.

### Step 3: Solve independent nodes

Solve nodes with no incoming dependencies first. Keep outputs concise and reusable as known conditions.

### Step 4: Contract to next state

Build `Qi+1` by embedding solved independent results as explicit conditions and removing redundant exploration branches.

`Qi+1` must satisfy all checks:
- self-contained
- answer-equivalent to `Q0`
- lower reasoning complexity than `Qi`

### Step 5: Quality gate and termination

Compare three candidates against `Q0`:
- solution from `Qi`
- solution from `Gi`
- solution from `Qi+1`

Select the strongest candidate for correctness and completeness.

Terminate if either condition is true:
- `Qi+1` is not selected by quality gate.
- Further contraction gives no meaningful complexity reduction.

Otherwise continue iteration (`i = i + 1`).

### Step 6: Final response assembly

Return:
- final answer for `Q0`
- compact AoT trace (`Q0 -> Q1 -> ... -> Qk`)
- key contracted assumptions introduced during transitions
- confidence and any unresolved risks

## Output Contract

When using this skill, format internal reasoning artifacts in this structure:

1. `State`: current `Qi`
2. `DAG`: nodes with dependencies
3. `Contraction`: proposed `Qi+1`
4. `Gate Decision`: selected candidate and why
5. `Continue/Stop`: iteration decision

## References

- [AoT DAG Rules](references/aot-dag-rules.md) - Dependency and contraction rules
- [AoT Prompt Blocks](references/aot-prompt-blocks.md) - Reusable prompt templates for decomposition, contraction, and judging

## Notes

- Prefer short iterations (1 to 3 transitions) unless clear gains continue.
- Preserve user constraints across all states.
- Treat DAG as temporary scaffolding; do not carry full history unless needed for audit.
