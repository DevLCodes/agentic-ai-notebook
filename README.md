# Agentic AI system design

Free, interactive agentic AI system design notes for engineers building AI products: worked designs, deep dives, a roadmap and a glossary, in a clean field-manual style.

**Start here:** https://devlcodes.github.io/agentic-ai-notebook/system-design/

New to agents? The beginner concept notebooks now live in their own repo: [DevLCodes/agentic-ai-beginner](https://github.com/DevLCodes/agentic-ai-beginner). Old links to those pages redirect there.

## System design walkthroughs

Worked designs for AI systems, in [`system-design/`](system-design/): **https://devlcodes.github.io/agentic-ai-notebook/system-design/**

- [Enterprise Search Assistant](https://devlcodes.github.io/agentic-ai-notebook/system-design/enterprise-search.html): RAG over 10M documents in Drive, Confluence and Jira, with an animated 3D architecture
- [AI Customer Support Agent with Actions](https://devlcodes.github.io/agentic-ai-notebook/system-design/support-agent.html): a food-delivery support agent that checks orders, cancels and refunds at 200k conversations a day, covering routing, money rules in code, the pre-tool hook, prompt injection by design and evals before and after launch, with six interactive 3D scenes
- [AI On-Call Assistant](https://devlcodes.github.io/agentic-ai-notebook/system-design/oncall-assistant.html): investigates production alerts and posts a root cause with evidence in Slack within 3 minutes, with fixes behind approval, an evidence gate in code, and evals with real numbers, a shadow gate and a kill switch; six interactive 3D scenes
- [“Ask Your Data” Analytics Agent](https://devlcodes.github.io/agentic-ai-notebook/system-design/ask-your-data.html): plain-English questions over a BigQuery warehouse for 2,000 users, with schema retrieval without sample rows, queries run as the user, guards in code, execution accuracy, and production monitoring without labels; six interactive 3D scenes
- [Fresh Knowledge Base Pipeline](https://devlcodes.github.io/agentic-ai-notebook/system-design/knowledge-freshness.html): keeping an agent's knowledge base fresh within 15 minutes with Kafka, versioned writes and safe re-embedding, with seven interactive 3D scenes
- [FinSight: Research Assistant over SEC Filings](https://devlcodes.github.io/agentic-ai-notebook/system-design/finsight.html): a built and measured design answering analyst questions from SEC filings, with XBRL numbers, pgvector retrieval, FinanceBench evals and seven interactive 3D scenes
- [Three-Way Match Agent](https://devlcodes.github.io/agentic-ai-notebook/system-design/three-way-match.html): matches invoices against purchase orders and goods receipts read from PDFs, with a Postgres state machine and pgmq, a rule-based matcher, an exceptions-only agent, approval bound to an action hash and a scale-to-zero deployment; code, report and low-level design in [DevLCodes/three-way-match](https://github.com/DevLCodes/three-way-match)
- Topic deep dives: [knowledge base](https://devlcodes.github.io/agentic-ai-notebook/system-design/knowledge-base.html), [backfills and re-indexing](https://devlcodes.github.io/agentic-ai-notebook/system-design/backfills.html), [embeddings](https://devlcodes.github.io/agentic-ai-notebook/system-design/embeddings.html), [vector databases](https://devlcodes.github.io/agentic-ai-notebook/system-design/vector-databases.html), [vector search](https://devlcodes.github.io/agentic-ai-notebook/system-design/vector-search.html), [search types](https://devlcodes.github.io/agentic-ai-notebook/system-design/search-types.html), [weights in retrieval](https://devlcodes.github.io/agentic-ai-notebook/system-design/retrieval-weights.html), [reranking with cross-encoders](https://devlcodes.github.io/agentic-ai-notebook/system-design/reranking.html), [citations](https://devlcodes.github.io/agentic-ai-notebook/system-design/citations.html), [confidence scoring](https://devlcodes.github.io/agentic-ai-notebook/system-design/confidence-scoring.html), [open-weight models](https://devlcodes.github.io/agentic-ai-notebook/system-design/open-weight-models.html), [access control](https://devlcodes.github.io/agentic-ai-notebook/system-design/access-control.html), [chunking](https://devlcodes.github.io/agentic-ai-notebook/system-design/chunking.html), [routing](https://devlcodes.github.io/agentic-ai-notebook/system-design/routing.html), [evals](https://devlcodes.github.io/agentic-ai-notebook/system-design/evals.html)
- [Glossary](https://devlcodes.github.io/agentic-ai-notebook/system-design/glossary.html): every term in one line

These pages are also single HTML files with inline CSS. The 3D views (the Enterprise Search and Fresh Knowledge Base animations, and the rotatable figures on the embeddings, vector databases, chunking and routing pages) load Three.js from a CDN, so they need a connection; every page keeps flat diagrams and labs that work offline.

## Classic system design

The non-agentic building blocks (load balancing, caching, sharding, queues and more) and classic walkthroughs (URL shortener, news feed, chat, payments, ride matching and more) moved to their own repo: [DevLCodes/classic-system-designs](https://github.com/DevLCodes/classic-system-designs), live at **https://devlcodes.github.io/classic-system-designs/**. Old `classic-system-design/` links redirect there.

## How it's built

Each page is a single HTML file with inline CSS and JavaScript: no build step and no dependencies. Serve the repo root with any static server and open `system-design/index.html`. Progress ("done" ticks) is saved in a cookie in your browser only. Read [docs/STYLES.md](docs/STYLES.md) before adding a page.

Library APIs change fast. Code snippets show each API's shape as of 2026, so check the current docs before copying one.
