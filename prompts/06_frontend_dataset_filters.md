# Prompt 6 — Frontend: Dataset Filters

## Project Context

Datasets allow users to inspect database state.

Users must be able to filter records using dataset searchable columns.

Datasets define:

primaryKeyColumn  
searchableColumns

Filters should operate only on **searchableColumns**.

---

# Current State

Dataset detail page contains:

DatasetHeader  
DatasetSummaryCard  
DatasetRecordsWorkspace

Records table already exists.

Users can browse rows with pagination.

Filtering is not implemented yet.

---

# Goal

Implement dataset filtering.

Users should be able to:

add filters  
remove filters  
apply filters  
clear filters

Filters will be applied to dataset query.

---

# Scope

Implement:

Filter bar above table  
Multiple filters  
Operators:

EQUALS  
LIKE  
IN

Integrate filters with dataset query hook.

---

# Step 1 — Filter Bar Component

Create component:

DatasetFilterBar

This should appear above the records table.

Layout:

Add filter button

List of filter rows

Apply button

Clear filters button

---

# Step 2 — Filter Row

Create component:

DatasetFilterRow

Fields:

Column select  
Operator select  
Value input

Column select should list:

dataset.searchableColumns

Operator select should contain:

EQUALS  
LIKE  
IN

---

# Step 3 — Multiple Filters

User should be able to add multiple filter rows.

Example:

deviceId = 123  
siteId = EU1

Filters combine using **AND** logic.

---

# Step 4 — Apply Filters

Clicking Apply should:

execute dataset query with filters.

Query request structure should match backend contract.

Filters must reset pagination to first page.

---

# Step 5 — Clear Filters

Clear button should:

remove all filters

reload dataset without filters.

---

# Step 6 — UI Behaviour

Filter bar should be compact and readable.

Avoid huge forms.

Filters should feel lightweight.

---

# Step 7 — Query Integration

Dataset query hook should accept filters parameter.

Example:

useDatasetQuery(datasetId, { filters, limit, offset })

Ensure React Query refetch occurs when filters change.

---

# Step 8 — Edge Cases

Handle:

empty filter value

duplicate filters

large input values

UI should remain stable.

---

# Acceptance Criteria

Users can:

add filters

remove filters

apply filters

clear filters

Table reloads with filtered data.

Pagination resets correctly.

---

# Expected Output

Implement dataset filters.

Explain:

how filter state is stored

how query hook integrates filters

how UI supports multiple filters