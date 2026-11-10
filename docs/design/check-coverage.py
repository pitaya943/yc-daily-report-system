#!/usr/bin/env python3
"""Extract every B-xxx from the behavior spec and confirm coverage in design docs."""
from __future__ import annotations

import re
import sys
from pathlib import Path

SPEC = Path(__file__).resolve().parent.parent / "behavior-spec-final.md"
DESIGN = Path(__file__).resolve().parent

PERMISSION_DOCS = [DESIGN / "permission-matrix.md"]
DATA_DOCS = [DESIGN / "data-model.md", DESIGN / "data-flow.md"]
TEST_DOCS = [DESIGN / "test-plan.md"]
# Union checked as "permission/data/test docs"
COVERAGE_DOCS = PERMISSION_DOCS + DATA_DOCS + TEST_DOCS

B_RE = re.compile(r"\bB-(\d{3})\b")


def ids_in(text: str) -> set[str]:
    return {f"B-{m.group(1)}" for m in B_RE.finditer(text)}


def load(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def removed_rule_ids(spec: str) -> set[str]:
    """A B-rule is Removed only if its own heading/definition is marked Removed.

    Mentions of Removed *behaviours* inside an otherwise active rule do not
    retire the B-id. We look for a definition line **B-nnn** whose immediately
    following body (until the next **B-xxx** heading) declares the *rule*
    itself Removed — not merely a nested old behaviour.
    """
    removed: set[str] = set()
    # Split on rule headings like **B-001** at the start of a line or after newline.
    heading = re.compile(r"^\*\*(B-\d{3})\*\*", re.M)
    matches = list(heading.finditer(spec))
    for i, m in enumerate(matches):
        bid = m.group(1)
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(spec)
        body = spec[start:end]
        # First prose sentence / bullet of the rule, excluding later "old wording is Removed".
        # Treat as Removed-rule only if the title line itself contains Removed
        # or the opening sentence is like "**Removed**" as the rule body.
        title_line = spec[m.start() : spec.find("\n", m.start())]
        if re.search(r"\bRemoved\b", title_line) and not re.search(
            r"replaces|取代", title_line, re.I
        ):
            # e.g. a heading "B-nnn Foo (**Removed**)"
            removed.add(bid)
            continue
        # Opening EN/ZH bullets: rule is Removed if it starts with Removed as the whole requirement.
        first_en = re.search(r"-\s+\*\*EN\.\*\*\s+(.*)", body)
        if first_en and re.match(r"\*\*Removed\*\*", first_en.group(1).strip()):
            removed.add(bid)
    return removed


def main() -> int:
    spec = load(SPEC)
    spec_ids = sorted(ids_in(spec), key=lambda x: int(x.split("-")[1]))
    expected = [f"B-{i:03d}" for i in range(1, 99)]

    print("=== Coverage check for yc-v0 design docs ===")
    print(f"Spec: {SPEC}")
    print(f"Unique B-ids in spec: {len(spec_ids)}")
    print("Spec IDs: " + ", ".join(spec_ids))

    missing_in_range = [b for b in expected if b not in set(spec_ids)]
    extra = [b for b in spec_ids if b not in set(expected)]
    if missing_in_range:
        print(f"WARNING: expected B-001–B-098 missing from spec: {missing_in_range}")
    if extra:
        print(f"WARNING: spec has IDs outside B-001–B-098: {extra}")

    removed = removed_rule_ids(spec)
    print(f"\nB-rules marked Removed as a whole rule: {sorted(removed) or 'none'}")

    per_doc: dict[str, set[str]] = {}
    for path in COVERAGE_DOCS:
        if not path.exists():
            print(f"ERROR: missing doc {path}", file=sys.stderr)
            return 2
        per_doc[path.name] = ids_in(load(path))
        print(f"  {path.name}: {len(per_doc[path.name])} unique B-ids")

    union = set().union(*per_doc.values())
    test_ids = set().union(*(ids_in(load(p)) for p in TEST_DOCS))
    perm_ids = set().union(*(ids_in(load(p)) for p in PERMISSION_DOCS))
    data_ids = set().union(*(ids_in(load(p)) for p in DATA_DOCS))

    print(f"\nUnion of permission/data/test docs: {len(union)}")
    print(f"  permission-matrix.md: {len(perm_ids)}")
    print(f"  data-model.md + data-flow.md: {len(data_ids)}")
    print(f"  test-plan.md: {len(test_ids)}")

    missing_union = [b for b in spec_ids if b not in union]
    non_removed = [b for b in spec_ids if b not in removed]
    missing_test = [b for b in non_removed if b not in test_ids]

    ok = True
    print("\n--- Check 1: every spec B-id appears in permission/data/test docs ---")
    if missing_union:
        ok = False
        print(f"FAIL: missing from union: {', '.join(missing_union)}")
    else:
        print("PASS: every spec B-id appears in at least one of permission/data/test docs.")

    print("\n--- Check 2: test-plan.md contains every non-Removed B-id ---")
    if missing_test:
        ok = False
        print(f"FAIL: non-Removed IDs missing from test-plan.md: {', '.join(missing_test)}")
    else:
        print(
            f"PASS: test-plan.md contains all {len(non_removed)} non-Removed B-ids "
            f"(Removed whole-rule IDs: {sorted(removed) or 'none'})."
        )

    print("\n--- Per-ID location (permission / data / test) ---")
    print(f"{'ID':8} {'perm':6} {'data':6} {'test':6}")
    for b in spec_ids:
        print(
            f"{b:8} "
            f"{'Y' if b in perm_ids else '-':6} "
            f"{'Y' if b in data_ids else '-':6} "
            f"{'Y' if b in test_ids else '-':6}"
        )

    print("\n=== RESULT: " + ("PASS" if ok else "FAIL") + " ===")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
