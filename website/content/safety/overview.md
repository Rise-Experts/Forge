---
title: Safety and control
description: Understand Retinue authorization, guardrails, questions, and approval gates.
---

# Safety and control

Retinue keeps control in the application, not in the model prompt. Tools are authorized when they are discovered and again when they are executed. Actions that have an external or destructive effect can pause for a human decision.

```mermaid
flowchart TD
  A[Agent requests a tool] --> B[Authorization]
  B --> C{Effect requires approval?}
  C -->|No| D[Execute]
  C -->|Yes| E[Store pending approval]
  E --> F[Human decides]
  F -->|Allow| D
  F -->|Deny| G[Return a denied result]
  D --> H[Tool result]
```

Use [Human-in-the-loop](../concepts/human-in-the-loop) for the pause-and-resume model, [Approvals and safety](../guides/approvals-and-safety) for implementation guidance, and [Guardrails](../concepts/guardrails) for model-facing data controls.
