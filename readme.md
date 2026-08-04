
# Week 1 Deliverables: LLM Prompt Engineering 

## Overview

This pull request contains the completed deliverables for **Week 1** of the Uworx Summer Fellowship '26. The objective of this week's assignment was to evaluate and benchmark how different Large Language Models (LLMs) perform when executing the exact same core task using three specific prompt engineering methodologies.

---

## File Location & Contents

All assets for this task are located within the `Week 1/` directory:

| File | Description |
| --- | --- |
| **`Week 1/3prompts.md`** | Comprehensive documentation featuring the 3 prompt techniques, full LLM responses, comparative analysis, and evaluation metrics. |

---

## Prompt Engineering Techniques Evaluated

To assess model adaptability, reasoning depth, and adherence to constraints, the following three prompting techniques were tested across the LLMs on a uniform task:

1. **Prompt 1 — Role-Based Prompting:** Framed the model with a specific persona and domain expertise to establish behavioral context, tone, and depth.
2. **Prompt 2 — Chain-of-Thought (CoT) Prompting:** Forced explicit step-by-step reasoning before delivering the final output to improve logic accuracy and reduce hallucinations.
3. **Prompt 3 — Few-Shot Prompting:** Provided concrete input-output examples directly within the prompt to enforce strict output schema and structural formatting.

---

## Key Takeaways

* **Reasoning vs. Structure:** CoT prompting yielded the highest diagnostic depth, while Few-Shot prompting consistently resulted in the highest formatting compliance across all models.

---

> **Note for Reviewer:** Please see `Week 1/3prompts.md` for the exact prompt templates used, raw responses from each model, and the analysis.
