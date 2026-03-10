# Prompt 2 — Frontend: Streams UI Hardening

## Project Context

You are working on the ControlStream frontend.

ControlStream is an investigation platform for event-driven systems.

Streams represent **event sources only**.

Datasets represent **database state**.

Investigation connects both.

---

# Important Rule

Do NOT rename Streams to Sources.

Streams must stay a separate concept from Datasets.

Streams = events  
Datasets = state

---

# Goal

Improve Streams UI so it clearly communicates that Streams are **event streams**.

The user must not confuse Streams with generic data sources.

---

# Scope

Improve:

Streams list page  
Stream detail page  
Stream badges  
Stream metadata layout

Do NOT implement datasets UI.

Do NOT modify backend contracts.

---

# Step 1 — Inspect Current Streams UI

Inspect:

- stream list page
- stream detail page
- stream form (if present)
- shared components

Look for:

- ambiguous terminology
- poor information hierarchy
- hidden important metadata
- unclear stream type

---

# Step 2 — Clarify Terminology

Allowed terminology:

Stream  
Event stream  
Stream configuration  
Correlation  
Payload decoding

Avoid wording suggesting generic sources.

Example subtitle:

"Manage event streams connected to ControlStream."

---

# Step 3 — Improve Streams List Page

Streams list must show:

Stream name  
Stream type  
Connection  
Technical name

Requirements:

Rows/cards clickable.

Stream type visually distinct.

Primary element = stream name.

Secondary info = connection + technical name.

Reuse current UI pattern (table or cards).

---

# Step 4 — Improve Stream Type Badges

Stream type must be rendered as badge.

Kafka  
Rabbit

Requirements:

Visually distinct but subtle.

Dark-mode friendly.

Consistent with design system.

---

# Step 5 — Refactor Stream Detail Page

Structure:

Header  
Stream name  
Stream type badge

Section 1 — Stream Configuration

Connection  
Technical name

Section 2 — Correlation

Correlation key type  
Correlation key name

Section 3 — Payload Decoding

Decoding configuration

Use cards/sections consistent with UI system.

---

# Step 6 — Review Stream Form

If create/edit form exists:

Ensure field grouping makes sense.

Example groups:

Basic stream details  
Correlation configuration  
Decoding configuration

Improve helper text if needed.

Do not redesign entire form.

---

# Step 7 — Improve States

Improve:

Loading state  
Empty state  
Error state

Empty state should explain what a stream is.

Example:

"No event streams configured yet."

---

# Acceptance Criteria

Streams UI clearly represents event streams.

Stream type badge visible.

Detail page structured with clear sections.

Terminology avoids generic data source language.

---

# Expected Output

Refactor Streams UI.

Explain:

- what ambiguities were found
- what components changed
- terminology improvements