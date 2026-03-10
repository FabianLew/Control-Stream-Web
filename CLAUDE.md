# ControlStream – Claude Context

This repository contains the **ControlStream frontend application**.

ControlStream is an operational investigation platform for event-driven systems.

The UI allows users to inspect:

- event streams (Kafka, RabbitMQ)
- operational state (datasets from databases)
- investigation results across both
- timeline reconstruction of system behavior

The frontend communicates only with the **ControlStream Cloud API**.

Cloud communicates with **Agents** running in customer infrastructure.

---

# Architecture overview

System architecture:

Frontend → Cloud → Agent

Frontend responsibilities:

- UI rendering
- navigation
- investigation workflows
- calling Cloud API

Cloud responsibilities:

- authentication
- workspace management
- forwarding requests to agents through WebSocket tunnel

Agent responsibilities:

- event search
- dataset queries
- investigation search
- timeline reconstruction
- correlation logic

---

# Domain concepts

ControlStream has three main domain layers.

## Streams

Streams represent **event sources**.

Examples:

- Kafka topics
- Rabbit queues

Streams are used for:

- event search
- live event viewing
- replay
- correlation investigation

Important rule:

Stream = event source only.

Streams do NOT represent generic data sources.

---

## Datasets

Datasets represent **database state**.

Examples:

- Postgres tables
- Postgres views

Datasets are used for:

- operational data inspection
- searching records
- investigating state related to events

Datasets are not event streams.

Datasets are not replayable.

Datasets represent state snapshots.

---

## Investigation

Investigation is a layer that connects streams and datasets.

Investigation features include:

- grouped search
- correlation investigation
- timeline reconstruction
- pivots between events and records

Example investigation results:

Events (from Streams)

Records (from Datasets)

Example timeline entries:

EVENT

STATE_OBSERVATION

Investigation is the primary workflow of the product.

---

# Frontend navigation model

The application navigation is organized into the following sections:

Search  
Live  
Data Explorer  
Streams  
Connections

Explanation:

Search  
Main investigation workspace.

Live  
Real-time event viewing.

Data Explorer  
Browse datasets and records.

Streams  
Configuration and inspection of event streams.

Connections  
Configuration of infrastructure connections.

---

# Important architecture rules

## Streams are NOT generic sources

Do NOT introduce a generic "Source" abstraction.

Streams represent event streams only.

Datasets represent database state.

Investigation connects both layers.

---

## Keep domain boundaries clear

Streams UI should contain only event-related functionality.

Data Explorer should contain only dataset-related functionality.

Investigation should combine both.

Do not mix these responsibilities.

---

## Avoid premature abstractions

Do not introduce complex abstraction layers unless they are clearly required.

Prefer simple, readable components.

---

# Frontend stack

The application uses:

Next.js 15 (App Router)  
TypeScript  
React  
TailwindCSS  
shadcn/ui  
React Query

General rules:

Use React Query for server state.

Do not use fetch directly in components.

All API calls must live in `lib/api`.

Types should live in `lib/types`.

Prefer small reusable components.

Avoid large monolithic components.

---

# UI principles

ControlStream is an investigation tool.

UI should be:

clear  
minimal  
high signal  
dark mode oriented  
optimized for investigation workflows

Avoid clutter.

Avoid heavy visual styling.

Prioritize information clarity.

---

# Before implementing new features

Claude should read:

docs/architecture/system-overview.md  
docs/frontend/frontend-architecture.md  
docs/refactor/frontend-refactor-plan.md