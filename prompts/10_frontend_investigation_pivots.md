# Prompt 10 — Frontend: Investigation Pivots & Cross Navigation

## Project Context

ControlStream is an investigation platform for event-driven systems.

Users investigate system behavior by navigating between:

Streams (events)

Datasets (state)

Investigation Search (correlation)

Timeline (event + state sequence)

The UI must allow **smooth pivots between these contexts**.

Without pivots the system becomes a set of isolated screens.

This prompt connects the application into a true investigation workflow.

---

# Current State

Implemented features:

Data Explorer

Dataset detail

Dataset records table

Row detail

Search workspace

Grouped investigation results

What is missing:

Navigation between these contexts.

---

# Goal

Enable investigation pivots between:

dataset records → investigation search  
event results → dataset records  
records → timeline  
events → timeline

The user should never feel stuck on a page.

---

# Scope

Implement navigation flows between:

Search  
Data Explorer  
Row Detail  
Streams  
Timeline

---

# Step 1 — Pivot from Dataset Row to Search

Row detail page currently includes:

"Find related events"

Improve this pivot.

Requirements:

Query should include best candidate identifier.

Examples:

primary key  
matched searchable column

Navigate to:

/search?q=value

Search page should immediately execute investigation.

---

# Step 2 — Pivot from Search Event Result to Stream

Event result cards should allow navigation to:

stream detail

Possible routes:

/streams/[streamId]

or event detail page if such route exists.

Choose the option consistent with current architecture.

---

# Step 3 — Pivot from Search Record Result to Row Detail

Record result cards must link to:

/data/[datasetId]/row/[rowId]

Ensure this navigation works correctly.

---

# Step 4 — Add “Open in Data Explorer” Actions

When investigation result references a record:

Provide action:

Open in Data Explorer

This ensures users can inspect the full record.

---

# Step 5 — Add “Open Investigation” Actions

Dataset pages should include button:

Investigate this dataset

Which navigates to:

/search

Allowing manual query.

---

# Step 6 — Navigation Consistency

Ensure navigation feels consistent.

Avoid situations where:

Back button breaks state.

Pages reload unnecessarily.

Prefer preserving query parameters.

---

# Step 7 — Investigation Actions Component

Introduce reusable component:

InvestigationActions

Possible actions:

Find related events

Open in Data Explorer

Open Stream

Open Timeline

This component helps keep actions consistent.

---

# Step 8 — UX Considerations

Pivots must be obvious but not noisy.

Avoid cluttering cards with too many buttons.

Prefer:

hover actions

context menus

small action buttons.

---

# Acceptance Criteria

User can navigate:

Row → Search

Search event → Stream

Search record → Row

Row → Timeline

Navigation feels natural.

---

# Expected Output

Implement investigation pivots.

Explain:

how navigation flows were designed

what components were introduced

how pivot actions are rendered