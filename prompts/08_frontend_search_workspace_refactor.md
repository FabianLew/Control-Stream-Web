# Prompt 8 — Frontend: Search Workspace Refactor

## Project Context

ControlStream's core workflow is **Investigation**.

Users search for identifiers such as:

correlationId  
deviceId  
orderId  
siteId

Search results may contain:

Events (from Streams)

Records (from Datasets)

The backend now returns **grouped investigation results**.

The frontend must refactor Search to support this model.

---

# Current State

Existing search UI was designed for **event search only**.

We must transform it into a **generic investigation workspace**.

---

# Goal

Refactor the `/search` page to become the **central investigation workspace**.

The page should support:

query input  
summary area  
grouped results area

---

# Scope

Implement:

Search workspace shell

Query input

Results layout structure

Investigation summary section

Do NOT implement result rendering yet.

---

# Step 1 — Inspect Current Search Page

Inspect:

current search page

search input implementation

existing query hooks

existing result rendering

Understand how current search state works.

---

# Step 2 — Refactor Page Layout

New layout:

SearchHeader

SearchInput

InvestigationSummary

InvestigationResultsContainer

---

# Step 3 — Search Input

Search input should accept:

text query

Examples:

correlationId  
deviceId  
orderId

Requirements:

Press Enter to search

Query stored in URL param:

?q=

Search should refetch when query changes.

---

# Step 4 — Investigation Summary

Create component:

InvestigationSummary

Show:

query value

total event results

total record results

total groups

Example:

Results for "device123"

12 events  
3 records

---

# Step 5 — Results Container

Create placeholder container:

InvestigationResultsContainer

This will hold grouped results.

For now:

Render placeholder until next prompt.

---

# Step 6 — State Handling

Search state must come from URL.

Example:

/search?q=device123

This allows:

sharing links

refreshing page safely

---

# Step 7 — Loading State

While query executes:

Show investigation loading skeleton.

Avoid spinner-only UI.

---

# Step 8 — Empty State

If no results:

Show message:

"No investigation results found."

Provide hint to refine query.

---

# Acceptance Criteria

Search page supports query input.

Query stored in URL.

Summary section rendered.

Results container exists.

Loading and empty states implemented.

---

# Expected Output

Implement investigation workspace shell.

Explain:

how query state is managed

how summary data is rendered

how results container is structured