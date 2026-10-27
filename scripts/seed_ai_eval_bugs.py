"""Import the supplied sample bug CSV into a non-production project for AI smoke tests."""

import argparse
import csv
import sys
from pathlib import Path
from uuid import UUID

from sqlalchemy import select

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.database import SessionLocal  # noqa: E402
from app.models import Bug, BugSeverity, BugStatus, Project, User  # noqa: E402

DEFAULT_CSV = ROOT / "docs" / "ai_evaluation_bug_records.csv"
PRIORITY_MAP = {"Critical": "P1", "High": "P2", "Medium": "P3", "Low": "P4"}


def import_rows(
    project_id: UUID, reporter_id: UUID, csv_path: Path, *, dry_run: bool = False
) -> tuple[int, int]:
    with SessionLocal() as db:
        project = db.get(Project, project_id)
        reporter = db.get(User, reporter_id)
        if project is None or not project.active:
            raise ValueError("project_id must identify an active project")
        if reporter is None or not reporter.active:
            raise ValueError("reporter_id must identify an active user")

        with csv_path.open(newline="", encoding="utf-8") as source:
            rows = list(csv.DictReader(source))
        if not rows:
            raise ValueError("CSV has no bug rows")
        project_names = {row["project_name"].strip() for row in rows}
        if len(project_names) != 1:
            raise ValueError("all rows must use one project_name")

        inserted = skipped = 0
        for row in rows:
            bug_code = row["bug_code"].strip()
            existing = db.scalar(select(Bug).where(Bug.bug_code == bug_code))
            if existing is not None:
                if existing.project_id != project_id:
                    raise ValueError(f"{bug_code} already belongs to a different project")
                skipped += 1
                continue
            severity = BugSeverity(row["severity"].strip())
            priority = PRIORITY_MAP[row["priority"].strip()]
            db.add(
                Bug(
                    bug_code=bug_code,
                    title=row["title"].strip(),
                    description=row["description"].strip(),
                    category=row["category"].strip(),
                    severity=severity,
                    priority=priority,
                    project_id=project_id,
                    reporter_id=reporter_id,
                    status=BugStatus.Open,
                    is_deleted=False,
                )
            )
            inserted += 1
        if dry_run:
            db.rollback()
        else:
            db.commit()
        return inserted, skipped


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-id", required=True, type=UUID)
    parser.add_argument("--reporter-id", required=True, type=UUID)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument(
        "--dry-run", action="store_true", help="validate and count rows without saving"
    )
    args = parser.parse_args()
    inserted, skipped = import_rows(
        args.project_id, args.reporter_id, args.csv, dry_run=args.dry_run
    )
    action = "would insert" if args.dry_run else "inserted"
    print(f"{action} {inserted} sample bugs; skipped {skipped} existing bug codes")


if __name__ == "__main__":
    main()
