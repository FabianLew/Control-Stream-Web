# Frontend Architecture

The ControlStream frontend is built using:

Next.js 15  
TypeScript  
React  
Tailwind  
shadcn/ui  
React Query

---

# Folder structure

Recommended structure:

app/  
components/  
lib/api  
lib/types  
lib/hooks

---

# API layer

All API communication must go through `lib/api`.

Components should never call fetch directly.

Example:

lib/api/search.ts  
lib/api/datasets.ts

---

# State management

Use React Query for server state.

Local UI state should remain inside components.

Avoid global state unless necessary.

---

# Component guidelines

Prefer small reusable components.

Example structure:

SearchPage  
InvestigationSummary  
InvestigationGroup  
InvestigationResultCard

Avoid giant pages containing all logic.

---

# Styling

Use Tailwind utilities.

Use shadcn components for UI primitives.

Maintain consistent spacing.

Prefer readability over dense layouts.