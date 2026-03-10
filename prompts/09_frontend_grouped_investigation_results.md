# Prompt 9 — Frontend: Grouped Investigation Results

## Project Context

Investigation Search now returns **grouped results**.

Groups:

Events

Database Records

These come from:

Streams (events)

Datasets (records)

The frontend must render them separately.

---

# Current State

Search workspace shell exists.

InvestigationSummary is implemented.

Results container exists but is empty.

---

# Goal

Render grouped investigation results.

---

# Scope

Implement:

Result groups

Event result cards

Record result cards

Navigation to details

---

# Step 1 — Results Structure

Response structure:

summary

groups[]

Each group contains:

type

items[]

Group types:

EVENTS  
DATA_RECORDS

---

# Step 2 — Group Component

Create component:

InvestigationGroup

Display:

Group title

Item count

Items list

Example:

Events (12)

Records (3)

---

# Step 3 — Event Result Card

Each event card should show:

title  
subtitle  
timestamp  
stream badge  
highlights

Card must be clickable.

Navigation options:

event detail page

or stream overview.

---

# Step 4 — Record Result Card

Each record card should show:

dataset name  
primary key value  
matched field

Click navigates to:

/data/[datasetId]/row/[rowId]

---

# Step 5 — Visual Hierarchy

Groups must be clearly separated.

Events first.

Records second.

Use section headers.

---

# Step 6 — Loading Behaviour

While results load:

Show skeleton cards for each group.

---

# Step 7 — Empty Groups

If group has zero items:

Do not render the group.

---

# Step 8 — Performance

Avoid large re-renders.

Result cards should be lightweight.

---

# Acceptance Criteria

Search results grouped into:

Events

Records

Cards render correctly.

Navigation to event and record details works.

---

# Expected Output

Implement grouped investigation results.

Explain:

how groups are rendered

how event and record cards differ

how navigation works