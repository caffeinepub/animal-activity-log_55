# Specification

## Summary
**Goal:** Allow shed and tub change events to be logged independently from the animal detail card, and ensure history reflects whether an entry is shed-only, tub-change-only, or both.

**Planned changes:**
- Update the AnimalCard (animal detail page) actions area to replace the combined "Shed & Tub Change" action with two side-by-side buttons (e.g., "Log Shed" and "Log Tub Change"), each independently clickable.
- Add/wire two dedicated mutations (and backend methods if needed) to log shed-only and tub-change-only events for a given animal using the current time, with appropriate loading/disabled states and action-specific success/error toasts.
- Ensure logging either event triggers refetch/invalidation so per-animal history and derived days-since/animalsWithEvents metrics update immediately.
- Update the Shed/Tub Change history list and related edit/delete dialogs so labels and copy accurately reflect whether the row contains shed only, tub change only, or both.

**User-visible outcome:** On an animal’s detail card, the user can log a shed or a tub change separately (or both at different times), and the history/edit/delete UI accurately describes what was recorded.
