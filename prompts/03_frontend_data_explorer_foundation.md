# Prompt 3 — Frontend: Data Explorer Foundation

## Project Context

ControlStream allows investigating:

- event streams (Streams)
- operational state (Datasets)

Data Explorer is the workspace for **Datasets**.

Streams remain event-focused.

Datasets represent database state.

---

# Goal

Implement the **foundation of Data Explorer**.

This includes:

- dataset types
- API layer
- React Query hook
- landing page `/data`
- dataset list UI
- loading/empty/error states

Do NOT implement dataset detail yet.

---

# Step 1 — Inspect Frontend Architecture

Inspect:

- `lib/api`
- shared type location
- existing React Query hooks
- list page patterns
- page shell components

Follow existing conventions.

---

# Step 2 — Add Dataset Types

Define types:

DatasetOverviewDto

Fields:

id: string  
name: string  
tableName: string

DatasetDto

Fields:

id  
name  
connectionId  
tableName  
primaryKeyColumn  
searchableColumns

Prepare types for later queries if appropriate.

---

# Step 3 — Create Dataset API Layer

Create `lib/api/datasets.ts`.

Functions:

getDatasets()

getDataset(id)

queryDataset(id, request)

getDatasetRow(id, rowId)

Use existing HTTP helper.

Do not call fetch in components.

---

# Step 4 — Create React Query Hook

Hook:

useDatasets()

Query key example:

["datasets"]

Hook should only fetch data.

No UI state inside.

---

# Step 5 — Implement `/data` Page

Page structure:

Header

Title  
Data Explorer

Subtitle

"Inspect operational state stored in connected datasets."

Main content:

Dataset list

---

# Step 6 — Dataset List UI

Components:

DatasetList  
DatasetCard

Each dataset item shows:

Dataset name  
Table name

Whole card clickable.

Navigation target:

/data/[datasetId]

Dataset name is primary visual element.

---

# Step 7 — Loading State

Use skeleton layout.

Structure should resemble final list layout.

Avoid single spinner.

---

# Step 8 — Empty State

Example:

"No datasets have been configured yet."

Keep message concise.

---

# Step 9 — Error State

Show short error message.

Include retry option if consistent with app patterns.

---

# Acceptance Criteria

/data page exists.

Datasets fetched through API layer.

Dataset list rendered.

Dataset items clickable.

Loading, empty and error states implemented.

---

# Expected Output

Implement Data Explorer foundation.

Explain:

- dataset types structure
- API layer
- dataset list architecture