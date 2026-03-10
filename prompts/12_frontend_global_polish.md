# Prompt 12 — Frontend: Global UX Polish

## Project Context

ControlStream frontend now includes:

Streams

Data Explorer

Investigation Search

Timeline

Before finishing the refactor, the UI needs a **global polish pass**.

This step ensures the application feels like a cohesive product.

---

# Goal

Improve:

loading states

empty states

error states

visual consistency

navigation behavior

---

# Scope

Perform a global review of UI.

Focus on:

Search

Data Explorer

Streams

Timeline

---

# Step 1 — Loading States

Ensure every major page has proper loading state.

Pages to inspect:

Search

Data Explorer

Dataset detail

Row detail

Timeline

Prefer skeletons over spinners.

---

# Step 2 — Empty States

Improve empty states.

Examples:

No datasets

No records

No search results

No timeline entries

Messages should be helpful.

---

# Step 3 — Error States

Ensure API errors show readable messages.

Avoid exposing raw backend errors.

Provide retry action where appropriate.

---

# Step 4 — Spacing Consistency

Review spacing across pages.

Ensure:

consistent padding

consistent section gaps

consistent card spacing

---

# Step 5 — Typography

Ensure headers follow hierarchy:

Page title

Section title

Card title

Avoid inconsistent font sizes.

---

# Step 6 — Dark Mode Consistency

Ensure all components respect dark mode.

No light backgrounds.

No unreadable text colors.

---

# Step 7 — Navigation Behavior

Ensure back navigation works correctly.

Avoid losing query state when navigating.

Preserve search query in URL.

---

# Step 8 — Accessibility

Check:

button labels

hover states

focus states

interactive element clarity

---

# Step 9 — Performance

Ensure large lists do not cause heavy re-renders.

Avoid unnecessary global state.

Prefer React Query caching.

---

# Acceptance Criteria

All major pages have loading, empty and error states.

Spacing and typography are consistent.

Navigation feels smooth.

UI feels production ready.

---

# Expected Output

Apply global polish.

Explain:

what improvements were made

what inconsistencies were fixed

any UI patterns introduced