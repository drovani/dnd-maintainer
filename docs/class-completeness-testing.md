# Class Completeness Testing — Strategy

How we assert that every class's level 1–20 implementation is **complete** (every
choice a player must make is accounted for) and **correct** (the choices match the
2024 PHB). Three layers, each a different tool for a different job. Do **not**
collapse them into one — completeness is a coverage/data-shape question, behavior
is a documentation question, and they want opposite tools.

## The core distinction

- **Completeness** = exhaustive, one right answer per (class × level), no prose
  value. Lives in **unit tests** (data-driven). _"Fighter L4 surfaces an ASI and
  nothing else."_
- **Behavior** = what a feature _does_, reads as documentation. Lives in **BDD**.
  _"Defense fighting style raises AC by 1."_

BDD is the **wrong** place for the exhaustive 12×20 matrix; it is the **right**
place for a handful of marquee behaviors. The two complement each other: BDD
drives behavior into existence (`@future`); the unit-test oracle tracks coverage.

## Layer 1 — Cross-class structural invariants (unit tests)

Loop over all `CLASS_SOURCES`; scales to all 12 classes for free. **Highest ROI.**

Already covered in `src/lib/sources/classes.test.ts` (data-shape, inspects the
source arrays directly): unique choice keys, `has exactly 20 levels`, `subclass
grant at level 3`, feature-definition existence, hit-die / spellcasting / AC
formula per class.

Added in `src/lib/sources/class-completeness.test.ts` (exercises the **resolver
pipeline**, not just the source data):

- **Resolver round-trip (no swallowed choices).** Build each class to L20, run
  `collectBundles` + `resolveCharacter` with empty `choices`, and assert every
  class-origin choice-bearing grant key surfaces as a `pendingChoice`. The
  data-only tests check the _source_; this checks the _pipeline_ actually emits
  the choice.
- **Subclass coverage ratchet.** An explicit allowlist of subclasses with empty
  `features: []`. Fails when a non-allowlisted subclass is empty (regression)
  **and** when an allowlisted one becomes populated (forces removal on
  implementation). Turns completeness into a live count + a one-way gate.

## Layer 2 — Per-class progression oracle (data-driven unit test) — TODO

The actual completeness test, not yet built. One hand-authored table per class
(`it.each`), asserting the **new** pending choices introduced at each level.

Two rules make it catch real bugs:

1. **Representational distance — not just "a different file."** Write the oracle in
   PHB/player vocabulary, and let the test do real work mapping resolver internals
   onto it. A source bug then can't be silently mirrored without a reviewer-visible,
   PHB-checkable edit. `docs/dnd-2024.md` is a data-_shape_ reference, **not** a
   per-level table — do not derive the oracle from it (and never derive it from
   `classes.ts`, which would be circular).

   ```ts
   // fighter.progression.ts — independent PHB encoding, NEW choices per level
   const FIGHTER: Record<number, readonly string[]> = {
     1: ['fighting-style', 'weapon-mastery×3'],
     2: [],
     3: ['subclass'],
     4: ['asi'],
     // ...through 20
   };
   ```

2. **Exact set equality, both directions.** "Contains the expected ASI" only
   catches under-granting; assert the surfaced new-choice set _equals_ the expected
   set so a phantom choice the PHB lacks also fails. Pair each row with cheap
   cumulative checks (proficiency bonus, total feature count) to catch scaling
   regressions in the same row.

Build one Fighter table as the template, then replicate for the other 11.

## Layer 3 — BDD for representative behaviors only

In the existing resolver seam (`features/characters/`, issue-132 worktree).
Hand-pick marquee, documentation-worthy behaviors — **not** the exhaustive
matrix. Tag unimplemented behavior `@future`; never edit `src/` to force a
scenario green.

Good BDD candidates: ASI raises a modifier; fighting-style AC bonus; Extra Attack
changes attack count; subclass selection at L3. Bad BDD candidates: "Fighter L7
grants no choice" (that's Layer 2).
