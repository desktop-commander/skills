---
name: mermaid-c4
description: Create and modify Mermaid C4 diagrams for system architecture modeling, including System Context, Container, Component, Dynamic, and Deployment diagrams.
version: 1.0.0
---

# Mermaid C4 Diagram Generator

This skill helps create high-quality architecture diagrams using the Mermaid C4 syntax. It supports all levels of the C4 model (Context, Container, Component) plus Dynamic and Deployment diagrams.

## When to Use

- When mapping out high-level system boundaries (System Context)
- When detailing applications, databases, and microservices (Container)
- When zooming into individual services to show their internal structure (Component)
- When documenting interactions and message flows (Dynamic)
- When mapping software onto infrastructure (Deployment)

## Workflow

1. **Identify Level**: Determine which level of C4 is most appropriate for the request.
2. **Draft Syntax**: Generate the Mermaid code using the appropriate C4 syntax.
3. **Apply Parse-Safe Rules**: Ensure labels and relationships follow safe subset rules to avoid rendering errors.
4. **Validate**: Run syntax validation before presenting to the user.
5. **Output**: Return the code block and a brief explanation of the architecture.

## Diagram Types

- [System Context (C4Context)](references/c4-context.md) - High-level system boundaries and actors.
- [Container Diagram (C4Container)](references/c4-container.md) - Apps, data stores, and service interactions.
- [Component Diagram (C4Component)](references/c4-component.md) - Internal components of a container.
- [Dynamic Diagram (C4Dynamic)](references/c4-dynamic.md) - Step-by-step interaction flows.
- [Deployment Diagram (C4Deployment)](references/c4-deployment.md) - Infrastructure mapping.

## Parse-Safe Rules for Mermaid C4

When generating Mermaid C4 diagrams:
- **No quotes in labels**: Avoid using quotes inside labels (e.g., use `Sends email` instead of `Sends "email"`).
- **Use <br/> for line breaks**: Never use literal `\n` in labels or descriptions.
- **Rel types**: Use standard `Rel`, `BiRel`, `Rel_Up`, `Rel_Down`, `Rel_Left`, `Rel_Right`, and `Rel_Back`.
- **Parameter order**: Always follow the required parameter order for elements (Alias, Label, ?Descr, ?Techn, ?Sprite, ?Tags, $link).

## Scripts

- [validate-mermaid.mjs](scripts/validate-mermaid.mjs) - Validates Mermaid syntax to prevent rendering errors.
