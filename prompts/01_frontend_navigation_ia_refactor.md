# Prompt 1 — Frontend: Navigation & IA Refactor

## Project Context

You are working on the **ControlStream frontend**.

ControlStream is an operational investigation platform for event-driven systems.

The UI allows users to investigate:

- event streams (Kafka, RabbitMQ)
- operational state stored in databases
- correlations between events and state
- timeline of system behavior

---

# System Architecture

Frontend → Cloud → Agent

Important rules:

Frontend communicates **only with Cloud API**

Cloud communicates with Agents through **WebSocket tunnel**

Agent performs heavy operations:

- event search
- dataset queries
- grouped investigation search
- timeline reconstruction

Frontend must **never communicate directly with Agents**.

---

# Domain Model

ControlStream has **three main concepts**.

## Streams

Streams represent **event sources only**.

Examples:

- Kafka topics
- Rabbit queues

Streams are used for:

- event search
- live viewing
- replay
- correlation investigation

Important rule:

**Stream = event source only**

Streams are **NOT generic data sources**.

---

## Datasets

Datasets represent **database state**.

Examples:

- Postgres tables
- Postgres views

Datasets are used for:

- inspecting operational state
- searching records
- investigating system state related to events

Datasets are **not event streams**.

Datasets are **not replayable**.

---

## Investigation

Investigation connects both worlds.

Investigation results may contain:

Events (from Streams)

Records (from Datasets)

Example timeline entries:

EVENT

STATE_OBSERVATION

Investigation is the **core workflow** of ControlStream.

---

# Target Navigation Model

The application navigation should be organized as:

Search  
Live  
Data Explorer  
Streams  
Connections

Meaning:

Search  
Main investigation workspace.

Live  
Real-time event stream viewing.

Data Explorer  
Dataset browsing and state inspection.

Streams  
Configuration and inspection of event streams.

Connections  
Infrastructure configuration.

---

# Frontend Stack

- Next.js 15 (App Router)
- TypeScript
- React
- TailwindCSS
- shadcn/ui
- React Query

General rules:

Use React Query for server state.

Do not call fetch directly inside components.

All API calls must live in `lib/api`.

Prefer small reusable components.

Avoid large monolithic page files.

Dark mode only.

---

# Task

Refactor the **application navigation and information architecture** to support the new product structure.

This step prepares the frontend for:

- Data Explorer
- grouped investigation search
- timeline investigation UI

---

# Scope

Implement:

- sidebar navigation refactor
- new navigation item for **Data Explorer**
- route shell for `/data`
- consistent page header structure for top-level pages

Do NOT implement:

- dataset browsing
- grouped search
- timeline UI
- dataset queries

---

# Step 1 — Inspect Existing Navigation

Before writing code:

Inspect the current sidebar implementation.

Understand:

- where navigation items are defined
- how active route highlighting works
- how icons are selected
- how routes are structured in App Router

Do not guess.

Follow the existing architecture.

---

# Step 2 — Update Sidebar

Sidebar order must be:

1. Search
2. Live
3. Data Explorer
4. Streams
5. Connections

Requirements:

Add new item **Data Explorer**

Use a lucide icon representing database/data.

Keep styling consistent with existing sidebar.

Do not redesign the sidebar layout.

---

# Step 3 — Add Data Explorer Route

Create route:

/data

This page should render a proper workspace shell.

Content:

Title  
Data Explorer

Subtitle example:

"Inspect operational state stored in connected datasets."

Do not leave the page empty.

---

# Step 4 — Introduce Page Shell Pattern

Ensure top-level pages use consistent layout.

Example structure:

PageHeader  
PageContent

Header should support:

title  
subtitle  
optional action slot

Reuse existing components if available.

Do not overengineer layout abstractions.

---

# Step 5 — Audit Terminology

Inspect UI labels around Streams.

Ensure they do NOT imply generic data sources.

Allowed:

"Event stream"

Avoid:

"Data source" referring to streams.

Do not deeply refactor streams pages yet.

That comes in the next prompt.

---

# Acceptance Criteria

Navigation shows:

Search  
Live  
Data Explorer  
Streams  
Connections

/data route exists.

Page header pattern is consistent.

Streams are not described as generic sources.

Existing routes keep working.

---

# Expected Output

Implement navigation refactor.

Explain:

- which files changed
- how navigation was updated
- what was intentionally left for later prompts