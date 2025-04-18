# Comprehensive Refactor Plan for Schedule Page (מערכת לימודים)

## 0. Goals

- **Modular Codebase:** Ensure each component or file is ≤150 lines, with clear, single-responsibility functions and components.
- **Separation of Concerns:** Divide client-side presentation from server-side data handling. Remove direct Supabase calls from client components.
- **Consistency & Accessibility:** Code written in English (comments, variables) while UI texts remain in Hebrew (RTL), using shadcn/ui components for a modern, responsive, kid-friendly design.
- **Testing & Quality:** Include unit tests, integration tests, and visual regression tests. Validate changes with instant feedback and run full test suites before commits.
- **Performance & Optimization:** Lazy-load heavy components, memoize where applicable, and enforce rate-limiting on server routes.

## 1. Current Pain Points

- **Large Component File:** The current schedule page (`page.tsx`) is around 370 LOC, mixing UI, data fetching, editing logic, and direct Supabase queries.
- **Coupled Business Logic:** Day/Time logic and editing behaviors are spread across multiple hooks and components, leading to duplication.
- **Security & Validation:** Direct client access to Supabase and potential lack of server-side validations.
- **Testing Gaps:** Missing tests for hooks, editing logic, and visual presentation of a Hebrew, RTL interface.

## 2. Proposed Architecture Overview

```
src/
 ├─ app/
 │   └─ schedule/
 │       ├─ page.tsx               <- Lightweight client-side wrapper
 │       └─ client/                <- Contains UI components:
 │           ├─ ScheduleView.tsx   <- Read-only display grid
 │           ├─ EditToolbar.tsx    <- Editing controls and unsaved changes banner
 │           └─ ScheduleEditor.tsx <- Editing functionality (editing & time‑editing)
 ├─ server/
 │   └─ schedule/
 │       ├─ queries.ts             <- Server-side schedule queries (Supabase wrapper)
 │       ├─ mutations.ts           <- Server-side schedule mutations (write operations)
 │       └─ route.ts               <- API route for GET/PATCH operations
 ├─ components/
 │   └─ schedule/
 │       └─ (SubjectModal, DayTabs, ScheduleGrid, TodaySchedule, …)  <-- Kept but refactored for brevity
 ├─ types/
 │   └─ schedule.ts                <- Centralize types: Subject, TimeSlot, ScheduleData, etc.
 └─ tests/
     └─ schedule/
         ├─ page.test.tsx          <- Integration tests for schedule page and admin paths
         ├─ hooks/
         └─ server/
```

## 3. Detailed Steps & Commit Order

1. **Types Extraction**
   - Create `src/types/schedule.ts` to centralize all schedule-related types and enum helpers.
   - Replace local duplicate types with imports from this file.

2. **Server Side Layer**
   - Develop `src/server/schedule/queries.ts` and `mutations.ts` for all Supabase server communications.
   - Expose an API route (`/api/schedule`) to handle GET (fetch schedules) and PATCH (update schedules) requests.
   - Write unit tests (using Vitest or similar) for these server functions.

3. **Client Page Split**
   - Refactor `page.tsx` to serve as a lightweight wrapper that fetches data (using SWR/tRPC) and renders either `<ScheduleView>` or `<ScheduleEditor>`.
   - Move business logic related to editing into `ScheduleEditor.tsx`, keeping its LOC <150, and ensure it handles unsaved changes and keyboard shortcuts.

4. **Hooks & Logic Separation**
   - Refactor `useScheduleData`, `useSaveSchedule`, and `useScheduleEditing` hooks:
     - Convert `useScheduleData` into a server-fetching hook using SWR with optimistic updates.
     - Simplify `useSaveSchedule` to wrap around the server mutations.
     - Ensure `useScheduleEditing` contains only UI logic for editing state (e.g., selected cells, unsaved changes status). **If client-side state becomes overly complex, consider integrating a dedicated state management library (e.g., Zustand, Jotai) to maintain component simplicity.**
   - Write dedicated tests for these hooks using @testing-library/react and user-event.

5. **UI/UX Enhancements**
   - Replace custom buttons with shadcn/ui `<Button>` components throughout the views.
   - **Enhance Kid-Friendliness:** Beyond functionality, incorporate vibrant colors, subtle engaging animations, or kid-appropriate icons/illustrations to make the interface fun and inviting for the target age group (8-11).
   - Add ARIA labels and improve semantic HTML (e.g., consider using a table layout for schedule grids) for accessibility.
   - Ensure RTL support is consistent across all components.

6. **Performance Improvements**
   - Lazy-load heavy components such as SubjectModal and parts of the editing grid.
   - Use memoization for schedule rows to avoid unnecessary re-renders when unrelated state changes occur.

7. **Validation, Security & API Rate-Limiting**
   - Maintain client-side validations (e.g., `validateSchedule`) for immediate user feedback, and re-run validations server-side before saving data.
   - Implement robust error handling: display **user-friendly error messages (in Hebrew)** for network issues, validation failures, or server problems, avoiding technical jargon. Log detailed technical errors for developers.
   - Implement robust error handling, logging, and sanitation (whitelisting subject names based on the subjects array).
   - Add rate-limiting middleware for the `/api/schedule` endpoint to prevent abuse.

8. **Testing & Continuous Integration**
   - Aim for 100% test coverage: add integration tests for the API routes, UI tests for both view and edit modes, and visual regression tests (e.g., with Playwright) for RTL snapshots.
   - **Mocking Strategy:** Utilize effective mocking strategies, such as `msw` (Mock Service Worker) for API requests and Vitest's mocking capabilities for server functions/modules, to isolate components and hooks during testing.
   - Update CI scripts to run tests, linting, and build checks.

9. **Commit Practices**
   - Commit changes frequently, with clear commit messages (using emojis as needed, e.g., ✨, 🐛, 🎨).
   - Finalize each commit by running `npm run build` to ensure everything complies with lint rules and passes tests.

## 4. Additional Emphasis & Best Practices

- **Code Readability:** Ensure all code comments, variable names, and documentation are in clear, simple English to promote maintainability.
- **User Experience:** The UI should be vibrant, friendly, and intuitive for children (ages 8–11), with interfaces demonstrated fully in Hebrew.
- **Performance:** Use lazy loading and memoization to ensure the application remains responsive, even with complex editing logic.
- **Accessibility:** Include proper ARIA attributes and ensure all interactive elements support keyboard navigation.
- **Security & Data Integrity:** Verify that all data inputs are sanitized and validated on both client and server sides to prevent malicious data injection.

## 5. Timeline & Deliverables

- **Day 1:** Extract types and scaffold the server routes with unit tests.
- **Day 2:** Implement the page split, basic data fetching, and displaying schedule data.
- **Day 3:** Migrate editing functionalities and integrate optimistic updates.
- **Day 4:** Polish UI with shadcn/ui components, ensure RTL consistency, and refine accessibility features.
- **Day 5:** Complete full test suite including visual regression tests, update CI configuration, and perform final documentation updates.

## 6. Risk Mitigation & Testing Considerations

- **State Synchronization:** Use the mutation response to overwrite local optimistic updates, reducing state drift between client and server.
- **Print & Display Modes:** Ensure that the print view uses proper media queries and the schedule grid is rendered correctly in both scenarios.
- **Time Editing Sensitivity:** Write migration tests for changes in time-slot editing logic and ensure no UI regressions occur.
- **Security:** Re-run all validations on the server to guarantee data integrity and enforce strict RLS policies in Supabase.

## 7. Further Recommendations

- **Documentation:** Maintain this document (`docs/refactor-schedule.md`) as living documentation to assist new developers and provide context during code reviews.
- **Modern Practices:** Embrace functional programming patterns and React hooks for cleaner, more predictable code.
- **User Feedback:** Regularly collect feedback from end users (teachers, parents, and even child developers) to continuously improve the interface and usability of the schedule system.
- **Commit Discipline:** Follow strict commit guidelines and frequent commits with clear messages to keep track of changes easily and facilitate smooth integration and rollback if needed.
- **(Optional) Real-time Updates:** Consider if real-time updates are needed (e.g., if multiple users might edit concurrently). If so, plan for integrating Supabase Realtime subscriptions into the architecture.

---

This plan is designed to create a robust, maintainable, and performance-optimized schedule page that remains true to the playful, accessible design envisioned for our child-friendly Hebrew interface. 