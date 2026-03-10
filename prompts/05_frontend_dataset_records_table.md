# Prompt 5 — Frontend: Dataset Records Table

## Project Context

ControlStream allows users to inspect operational state stored in datasets.

Datasets represent database tables.

Users must be able to:

browse dataset records  
inspect record values  
navigate to row detail  
pivot from records to investigation

This prompt implements the **records table** inside the dataset workspace.

---

# Current State

Dataset detail page already exists:

/data/[datasetId]

It contains:

DatasetHeader  
DatasetSummaryCard  
DatasetRecordsWorkspace

The Records workspace is currently empty.

---

# Goal

Implement a **dynamic records table** that renders dataset query results.

The table must support:

dynamic columns  
dynamic rows  
pagination  
row click navigation

---

# Scope

Implement:

dataset query hook  
records table component  
pagination controls  
row navigation

Do NOT implement:

dataset filters  
row detail UI

Those come in later prompts.

---

# Step 1 — Dataset Query Hook

Create React Query hook:

useDatasetQuery(datasetId, queryParams)

Query parameters should support:

limit  
offset

Follow existing React Query conventions.

Query key example:

["dataset", datasetId, "query", queryParams]

---

# Step 2 — Dataset Table Component

Create component:

DatasetTable

Responsibilities:

render dynamic columns  
render dynamic rows  
handle loading state

Columns must be derived from dataset query result.

---

# Step 3 — Dynamic Columns

Dataset rows may contain:

strings  
numbers  
booleans  
JSON

Render columns dynamically based on returned data.

Column header should be field name.

Use table component consistent with existing UI.

---

# Step 4 — Row Rendering

Each row should render record values.

If value is JSON:

Render inside small monospace block.

Avoid rendering giant raw JSON.

Truncate large values where needed.

---

# Step 5 — Row Navigation

Clicking a row should navigate to:

/data/[datasetId]/row/[rowId]

Row identifier should come from the dataset primary key.

Ensure the row is visually clickable.

Hover states should follow current table styling.

---

# Step 6 — Pagination

Implement pagination controls.

Use simple pagination:

Previous  
Next

Page size:

50 rows

When page changes:

refetch query with updated offset.

---

# Step 7 — Loading State

While query loads:

Render table skeleton.

Skeleton should resemble final table layout.

---

# Step 8 — Empty State

If query returns zero rows:

Render message:

"No records found."

Do not show empty table grid.

---

# Step 9 — Performance Considerations

Avoid re-rendering the whole table unnecessarily.

Keep table component focused.

Do not store query state inside global state.

---

# Acceptance Criteria

Records table appears on dataset page.

Columns generated dynamically.

Rows clickable.

Pagination works.

Loading and empty states implemented.

---

# Expected Output

Implement dataset records table.

Explain:

how dynamic columns were implemented

how row navigation works

how pagination state is handled