# Prompt 11 — Frontend: Investigation Timeline View

## Project Context

ControlStream supports **timeline reconstruction** of system behavior.

Timeline entries come from two sources:

Events (Streams)

State observations (Datasets)

Timeline allows users to see **system activity in chronological order**.

---

# Current State

Search supports grouped results:

Events

Records

Timeline API now exists on backend.

Frontend must implement timeline UI.

---

# Goal

Create timeline view inside the investigation workspace.

Timeline should present:

chronological sequence

mixed event and state entries

relation hints

---

# Scope

Implement:

timeline view

timeline entry rendering

relation hints visualization

---

# Step 1 — Timeline Placement

Timeline should exist inside Search workspace.

Two possible approaches:

Tabs

Results  
Timeline

Recommended approach:

Use tabs.

---

# Step 2 — Timeline Data Fetching

Create hook:

useInvestigationTimeline(query)

Query parameter comes from:

/search?q=value

Use React Query.

---

# Step 3 — Timeline Layout

Structure:

TimelineSummary

TimelineEntries

RelationHints (optional)

---

# Step 4 — Timeline Entry Types

Entries may be:

EVENT

STATE_OBSERVATION

They must be visually distinguishable.

Example:

Event → lightning icon

State → database icon

---

# Step 5 — Entry Card Design

Each entry should display:

title

subtitle

timestamp

source badge

highlights

Event example:

Device connected

Stream: device-events

State example:

Order record found

Dataset: orders

---

# Step 6 — Sorting

Entries must be sorted by timestamp.

Earliest first or latest first depending on UX decision.

Be consistent.

---

# Step 7 — Relation Hints

Backend may return relation hints.

Example:

Same correlation

State derived from event

Render relation hints subtly.

Do not clutter timeline.

---

# Step 8 — Entry Navigation

Clicking timeline entry should navigate to:

Event detail

or

Row detail

depending on entry type.

---

# Step 9 — Loading State

Timeline loading skeleton should mimic vertical timeline layout.

Avoid generic spinner.

---

# Step 10 — Empty Timeline

If timeline has no entries:

Display message:

"No timeline events found."

---

# Acceptance Criteria

Timeline tab exists.

Timeline entries render.

Events and state entries are visually distinct.

Navigation from entries works.

---

# Expected Output

Implement timeline view.

Explain:

timeline structure

entry rendering logic

how relation hints are handled