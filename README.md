# Agentic AI notebook

Free, interactive, notebook-style pages for engineers learning to build AI agents.
Each page explains one topic with diagrams, hands-on labs and a quiz at the end.

**Start here:** https://devlcodes.github.io/agentic-ai-notebook/

![The roadmap: eight topics arranged around the core idea](og-image.png)

## Topics

Follow them in order, or jump to whatever you need.

1. [The Agentic Loop](https://devlcodes.github.io/agentic-ai-notebook/agentic-loop.html): perceive, reason, act, observe, with a step-through simulator
2. [Agent Patterns](https://devlcodes.github.io/agentic-ai-notebook/agent-patterns.html): RAG agents, ReAct, planner–executor, DAGs, multi-agent, self-critique
3. [Agentic Architecture](https://devlcodes.github.io/agentic-ai-notebook/agentic-architecture.html): orchestration, subagent context, deterministic gates, hooks, sessions
4. [Tool Design & MCP](https://devlcodes.github.io/agentic-ai-notebook/tool-design-mcp.html): tool descriptions, structured errors, `tool_choice`, MCP servers
5. [Framework Utilisation](https://devlcodes.github.io/agentic-ai-notebook/frameworks.html): CrewAI, Google ADK, LangGraph, LlamaIndex, Semantic Kernel, AutoGen
6. [Testing & Evals](https://devlcodes.github.io/agentic-ai-notebook/testing-and-evals.html): unit and trajectory tests, LLM-as-judge, RAG metrics, DeepEval, RAGAS
7. [LLM Observability](https://devlcodes.github.io/agentic-ai-notebook/llm-observability.html): OpenTelemetry traces, cost and latency, production signals
8. [AI Governance](https://devlcodes.github.io/agentic-ai-notebook/ai-governance.html): prompt injection, OWASP LLM Top 10, EU AI Act, NIST, guardrails

Coming next: retrieval, agent memory, production, and the model layer.

Also in this repo: [Python practice](python-practice/), runnable Python lessons and interview practice problems.

## How it's built

Each page is a single HTML file with inline CSS and JavaScript: no build step, no dependencies, and it works offline.
To run it locally, open `index.html` in a browser. Progress ("done" ticks) is saved in your browser only.

Library APIs change fast. Code snippets show each API's shape as of 2026, so check the current docs before copying one.
