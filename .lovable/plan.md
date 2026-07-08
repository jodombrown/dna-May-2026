## Problem

In `UnifiedNotificationPanel`, the three-dot (kebab) menu sits directly beside the sheet's X close button, and its dropdown opens with `align="end"` — so "Notification settings" pops out underneath the X, exactly what you circled.

## Fix

File: `src/components/notifications/UnifiedNotificationPanel.tsx`

Move the kebab trigger to the **left side of the header**, grouped with the "Notifications" title and unread badge, so the right side of the header holds only the X (added by the drawer wrapper). The kebab dropdown will then open to the left, well away from the close button.

```text
Before:  [Notifications  (3)]                      [ ⋮ ]  [ X ]
After:   [Notifications  (3)  ⋮ ]                         [ X ]
```

Concretely:
- Move the `<DropdownMenu>` block from the right-side `<div className="flex items-center gap-1">` into the left-side title `<div>`.
- Remove the now-empty right-side wrapper.
- Keep `align="end"` on `DropdownMenuContent` so the menu opens flush under the kebab, growing to the right into empty header space (no collision with X).
- Reduce the kebab button visual weight slightly (`text-muted-foreground`) so the title stays primary.

No changes to behavior, routes, or the notifications logic — visual repositioning only. Desktop dropdown variant benefits from the same repositioning (kebab was already crowding the header there too).

## Out of scope

- Redesigning the X close button itself (drawer wrapper concern, separate ask).
- Any other sheets/drawers.
