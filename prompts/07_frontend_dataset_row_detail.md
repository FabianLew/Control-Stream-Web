# Prompt 7 — Frontend: Dataset Row Detail + Investigation Pivot

## Project Context

ControlStream allows users to investigate both:

event streams (Streams)  
operational state (Datasets)

Datasets represent database tables or views.

Users can browse records through Data Explorer.

From a record, the user must be able to **pivot to event investigation**.

This step implements the **row detail page**.

---

# Current Frontend State

Data Explorer currently supports:

/data

dataset list

/data/[datasetId]

dataset detail workspace

dataset records table

dataset filters

What is missing:

Row detail view

---

# Goal

Implement row detail page:

/data/[datasetId]/row/[rowId]

The page must show:

record fields  
record metadata  
investigation actions

---

# Scope

Implement:

Row detail route

Row detail layout

Field viewer

Pivot action to investigation search

Do NOT implement:

timeline view

grouped search UI

Those come later.

---

# Step 1 — Create Row Detail Route

Create route:

/data/[datasetId]/row/[rowId]

The page must load record data using:

getDatasetRow(datasetId, rowId)

Reuse API layer.

---

# Step 2 — Fetch Row Data

Create React Query hook:

useDatasetRow(datasetId, rowId)

Handle states:

loading  
error  
not found

Do not render blank page.

---

# Step 3 — Row Detail Layout

Structure:

RowDetailHeader

RowSummaryCard

RowFieldsViewer

RowActions

---

# Step 4 — Row Header

Display:

Dataset name  
Primary key value

Example:

Orders Dataset  
Row id: 981231

Use existing page header pattern.

---

# Step 5 — Row Summary Card

Show:

Primary key  
Table name  
Dataset name

This card gives quick orientation.

---

# Step 6 — Row Fields Viewer

Render record fields in **key-value layout**.

Example:

deviceId → 12345  
status → ACTIVE  
siteId → EU1

Requirements:

Readable grid layout

Support long values

JSON fields rendered using monospace block

Avoid giant JSON dumps.

---

# Step 7 — Investigation Pivot

Add action:

"Find related events"

When clicked:

Navigate to:

/search

Pre-fill search query with a suitable identifier.

Prefer:

primary key  
or first searchable column match

Use query param:

?q=value

---

# Step 8 — UX Considerations

Ensure:

Fields layout is readable

Large rows remain usable

Page does not look like raw JSON inspector.

---

# Step 9 — Error Handling

If row not found:

Show message:

"Record not found."

Provide navigation back to dataset page.

---

# Acceptance Criteria

Row detail page exists.

Fields rendered clearly.

Pivot to investigation search works.

Loading, error and not-found states implemented.

---

# Expected Output

Implement dataset row detail page.

Explain:

how row data is rendered

how pivot to investigation works

how fields viewer is structured