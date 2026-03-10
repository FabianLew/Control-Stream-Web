# Prompt 4 — Frontend: Dataset Detail Workspace

## Project Context

You are working on the ControlStream frontend.

ControlStream is an investigation platform for event-driven systems.

The product has two main technical data layers:

Streams — event sources  
Datasets — database state

Streams represent:

Kafka topics  
Rabbit queues

Datasets represent:

Postgres tables  
Postgres views

Streams are used for:

event search  
live view  
replay  
correlation

Datasets are used for:

record inspection  
state investigation  
pivoting to events

Important rule:

Streams and Datasets remain **separate concepts**.

They are connected only through **Investigation**.

---

# Current Frontend State

The `/data` landing page already exists.

It shows a list of datasets.

Each dataset item navigates to:

/data/[datasetId]

This prompt implements the **Dataset Detail Workspace**.

---

# Goal

Create a workspace for exploring a dataset.

The page must show:

dataset metadata  
primary key  
searchable columns  
records workspace shell

The records table itself will be implemented in the next prompt.

---

# Scope

Implement:

Dataset detail page layout  
Dataset header  
Dataset metadata card  
Records workspace shell

Do NOT implement:

records table  
dataset filters  
row detail page

Those come in later prompts.

---

# Step 1 — Create Dataset Detail Route

Create route:

/data/[datasetId]

This page should fetch dataset metadata using the API layer created earlier.

Use the React Query hook pattern used elsewhere in the project.

Example:

useDataset(datasetId)

Follow existing project conventions.

---

# Step 2 — Fetch Dataset Metadata

Call:

getDataset(datasetId)

Handle states:

loading  
error  
not found

If dataset does not exist:

Render a proper error state.

Example:

"Dataset not found."

Do not leave blank page.

---

# Step 3 — Layout Structure

The dataset page should follow this structure:

Header  
Summary  
Records Workspace

Example hierarchy:

DatasetHeader

DatasetSummaryCard

DatasetRecordsWorkspace

---

# Step 4 — Dataset Header

Display:

dataset name  
table name

Dataset name should be the primary title.

Table name should be secondary.

Example:

Orders Dataset  
table: orders

Follow the existing page header pattern used elsewhere in the app.

---

# Step 5 — Dataset Summary Card

Create a card displaying metadata:

Primary key column

Searchable columns

Example layout:

Primary Key  
id

Searchable Columns  
deviceId  
orderId  
siteId

Searchable columns should be rendered as **badges**.

Use shadcn badge component if available.

---

# Step 6 — DatasetRecordsWorkspace Shell

Add a section titled:

Records

This will contain the dataset table later.

For now:

Render a placeholder container that clearly defines where records will appear.

Example:

Records section header

Below it an empty container with a loading skeleton or placeholder message.

Do NOT implement the table yet.

---

# Step 7 — Improve Navigation

Ensure navigation back to:

/data

works correctly.

Breadcrumbs or back link should follow existing navigation patterns.

Do not introduce new navigation systems.

---

# Step 8 — Loading State

While dataset metadata loads:

Show skeleton layout that resembles the final structure.

Avoid spinner-only layout.

---

# Step 9 — Error State

If API fails:

Render error message and retry button if app patterns support it.

Keep error UI consistent with other pages.

---

# Acceptance Criteria

Dataset page:

/data/[datasetId]

exists.

Dataset metadata loads correctly.

Header and summary card render.

Records workspace section exists.

Loading, error and not-found states handled.

---

# Expected Output

Implement dataset detail workspace.

Explain:

files added or modified

component structure

what was intentionally left for next prompt