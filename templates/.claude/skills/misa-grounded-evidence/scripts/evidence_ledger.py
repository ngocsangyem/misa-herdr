#!/usr/bin/env python3
"""Task-scoped, evidence-first ledger for Misa worker handoffs.

The model emits only [E<n>] IDs returned by this program.  URLs, file ranges,
and command artifacts are rendered from the ledger, not retyped by a worker.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

VERSION = 1
CITE_RE = re.compile(r"\[E(\d{1,4})\](?![(:])", re.IGNORECASE)
HEADER_RE = re.compile(r"^\s*(?:#{1,6}\s*)?evidence:?\s*$", re.IGNORECASE)
BLOCK_RE = re.compile(r"^\s*-\s*\[E(\d{1,4})\]\s+(.+?)\s+—\s+(\S.+?)\s*$", re.IGNORECASE)


def normalize_locator(locator: str) -> str:
    locator = locator.strip()
    if locator.startswith(("http://", "https://")):
        return locator.split("#", 1)[0].rstrip("/") or locator
    return locator


def ledger_path(explicit: str | None) -> Path:
    if explicit:
        return Path(explicit).expanduser()
    env = os.environ.get("MISA_EVIDENCE_LEDGER", "").strip()
    if env:
        return Path(env).expanduser()
    return Path(".evidence/ledger.json")


class Lock:
    def __init__(self, path: Path, timeout: float = 5.0) -> None:
        self.path = path.with_suffix(path.suffix + ".lock")
        self.timeout = timeout
        self.fd: int | None = None

    def __enter__(self) -> "Lock":
        self.path.parent.mkdir(parents=True, exist_ok=True)
        deadline = time.monotonic() + self.timeout
        while True:
            try:
                self.fd = os.open(str(self.path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                return self
            except FileExistsError:
                if time.monotonic() >= deadline:
                    self.path.unlink(missing_ok=True)
                else:
                    time.sleep(0.05)

    def __exit__(self, *_: object) -> None:
        if self.fd is not None:
            os.close(self.fd)
        self.path.unlink(missing_ok=True)


def load(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"version": VERSION, "sources": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"error: unreadable ledger {path}: {exc}")
    if not isinstance(data, dict) or not isinstance(data.get("sources"), list):
        raise SystemExit(f"error: invalid ledger format: {path}")
    return data


def save(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + f".tmp{os.getpid()}")
    temporary.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def add(path: Path, kind: str, locator: str, title: str) -> dict[str, Any]:
    locator = normalize_locator(locator)
    with Lock(path):
        data = load(path)
        for source in data["sources"]:
            if source["kind"] == kind and source["locator"] == locator:
                if title and not source.get("title"):
                    source["title"] = title
                    save(path, data)
                return source
        source = {
            "id": len(data["sources"]) + 1,
            "kind": kind,
            "locator": locator,
            "title": title.strip(),
            "quotes": [],
            "recorded_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        }
        data["sources"].append(source)
        save(path, data)
        return source


def normalized_text(text: str) -> str:
    return " ".join(text.split()).casefold()


def attach_quote(path: Path, source_id: int, quote: str, evidence: str) -> dict[str, Any]:
    if normalized_text(quote) not in normalized_text(evidence):
        raise SystemExit("error: quote is not present verbatim in the supplied evidence")
    with Lock(path):
        data = load(path)
        source = next((s for s in data["sources"] if s["id"] == source_id), None)
        if source is None:
            raise SystemExit(f"error: unknown evidence id: E{source_id}")
        quote = " ".join(quote.split())
        if quote not in source["quotes"]:
            source["quotes"].append(quote)
            save(path, data)
        return source


def evidence_for_quote(source: dict[str, Any], supplied: Path) -> str:
    """Read the permitted evidence span for a source.

    A code citation may not borrow a matching line from elsewhere in the file:
    its quote must be inside the file range recorded in the ledger.
    """
    if source["kind"] != "file":
        return supplied.read_text(encoding="utf-8")
    source_path, _, range_spec = source["locator"].rpartition(":")
    if not source_path or "-" not in range_spec:
        raise SystemExit(f"error: invalid file locator for E{source['id']}")
    expected = Path(source_path).resolve()
    if supplied.resolve() != expected:
        raise SystemExit(f"error: E{source['id']} must quote its recorded file range: {expected}")
    start, end = (int(value) for value in range_spec.split("-", 1))
    return "\n".join(supplied.read_text(encoding="utf-8").splitlines()[start - 1 : end])


def prose_and_block(text: str) -> tuple[str, dict[int, str]]:
    lines = text.splitlines()
    header = next((i for i, line in enumerate(lines) if HEADER_RE.match(line)), None)
    prose_lines = lines if header is None else lines[:header]
    listed: dict[int, str] = {}
    if header is not None:
        for line in lines[header + 1 :]:
            match = BLOCK_RE.match(line)
            if match:
                listed[int(match.group(1))] = normalize_locator(match.group(3))
    return "\n".join(prose_lines), listed


def cited_ids(text: str) -> set[int]:
    return {int(value) for value in CITE_RE.findall(text)}


def render(sources: list[dict[str, Any]], ids: set[int]) -> str:
    selected = [source for source in sources if source["id"] in ids]
    if not selected:
        return ""
    lines = ["## Evidence", ""]
    for source in selected:
        title = source.get("title") or source["kind"]
        lines.append(f"- [E{source['id']}] {title} — {source['locator']}")
        for quote in source.get("quotes", []):
            lines.append(f"  > {quote}")
    return "\n".join(lines)


def replace_block(target: Path, block: str) -> None:
    existing = target.read_text(encoding="utf-8")
    lines = existing.splitlines()
    header = next((i for i, line in enumerate(lines) if HEADER_RE.match(line)), None)
    body = "\n".join(lines if header is None else lines[:header]).rstrip()
    target.write_text(body + "\n\n" + block + "\n", encoding="utf-8")


def verify(draft: Path, sources: list[dict[str, Any]], require_quotes: bool) -> list[str]:
    text = draft.read_text(encoding="utf-8")
    prose, listed = prose_and_block(text)
    citations = cited_ids(prose)
    by_id = {source["id"]: source for source in sources}
    errors: list[str] = []
    unknown = citations - set(by_id)
    if unknown:
        errors.append("unknown ledger IDs: " + ", ".join(f"E{i}" for i in sorted(unknown)))
    if citations and not listed:
        errors.append("cited evidence has no rendered `## Evidence` block")
    missing = citations - set(listed)
    if missing:
        errors.append("cited but absent from Evidence block: " + ", ".join(f"E{i}" for i in sorted(missing)))
    extra = set(listed) - citations
    if extra:
        errors.append("Evidence block lists uncited IDs: " + ", ".join(f"E{i}" for i in sorted(extra)))
    for source_id, locator in listed.items():
        source = by_id.get(source_id)
        if source and locator != source["locator"]:
            errors.append(f"Evidence block locator for E{source_id} differs from ledger")
    if require_quotes:
        without_quotes = [source_id for source_id in citations if source_id in by_id and not by_id[source_id]["quotes"]]
        if without_quotes:
            errors.append("cited IDs without exact quotes: " + ", ".join(f"E{i}" for i in sorted(without_quotes)))
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Misa task-scoped evidence ledger")
    parser.add_argument("--ledger", help="task ledger path; defaults to $MISA_EVIDENCE_LEDGER or .evidence/ledger.json")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("reset")
    url = commands.add_parser("add-url")
    url.add_argument("url")
    url.add_argument("--title", default="")
    file = commands.add_parser("add-file")
    file.add_argument("path")
    file.add_argument("--lines", required=True, help="inclusive line range, e.g. 42:58")
    command = commands.add_parser("add-command")
    command.add_argument("--label", required=True)
    command.add_argument("--from", dest="output", required=True, help="redacted captured output file")
    quote = commands.add_parser("quote")
    quote.add_argument("id", type=int)
    quote.add_argument("--text", required=True)
    quote.add_argument("--from", dest="evidence", required=True)
    commands.add_parser("list")
    render_command = commands.add_parser("render")
    render_command.add_argument("--cited-in")
    render_command.add_argument("--replace-in")
    verify_command = commands.add_parser("verify")
    verify_command.add_argument("draft")
    verify_command.add_argument("--evidence", action="store_true")
    args = parser.parse_args()
    path = ledger_path(args.ledger)

    if args.command == "reset":
        with Lock(path):
            save(path, {"version": VERSION, "sources": []})
        print(f"ledger reset: {path}")
        return 0
    if args.command == "add-url":
        source = add(path, "url", args.url, args.title)
    elif args.command == "add-file":
        target = Path(args.path)
        if not target.is_file():
            print(f"error: no such file: {target}", file=sys.stderr)
            return 2
        start, separator, end = args.lines.partition(":")
        if not separator or not start.isdigit() or not end.isdigit() or int(start) < 1 or int(end) < int(start):
            print("error: --lines must be an inclusive range such as 42:58", file=sys.stderr)
            return 2
        if int(start) > len(target.read_text(encoding="utf-8").splitlines()):
            print(f"error: {target} has no line {start}", file=sys.stderr)
            return 2
        source = add(path, "file", f"{target}:{start}-{end}", target.name)
    elif args.command == "add-command":
        output = Path(args.output)
        if not output.is_file():
            print(f"error: no such output file: {output}", file=sys.stderr)
            return 2
        source = add(path, "command", f"command:{args.label}", output.name)
    elif args.command == "quote":
        evidence = Path(args.evidence)
        if not evidence.is_file():
            print(f"error: no such evidence file: {evidence}", file=sys.stderr)
            return 2
        source_record = next((s for s in load(path)["sources"] if s["id"] == args.id), None)
        if source_record is None:
            print(f"error: unknown evidence id: E{args.id}", file=sys.stderr)
            return 2
        source = attach_quote(path, args.id, args.text, evidence_for_quote(source_record, evidence))
    elif args.command == "list":
        for source in load(path)["sources"]:
            print(f"[E{source['id']}] {source['title'] or source['kind']} — {source['locator']}")
        return 0
    elif args.command == "render":
        target_name = args.replace_in or args.cited_in
        if not target_name:
            print("error: render requires --cited-in or --replace-in", file=sys.stderr)
            return 2
        target = Path(target_name)
        prose, _ = prose_and_block(target.read_text(encoding="utf-8"))
        block = render(load(path)["sources"], cited_ids(prose))
        if not block:
            print("error: no cited evidence to render", file=sys.stderr)
            return 1
        if args.replace_in:
            replace_block(target, block)
            print(f"Evidence block rewritten in {target}")
        else:
            print(block)
        return 0
    elif args.command == "verify":
        errors = verify(Path(args.draft), load(path)["sources"], args.evidence)
        if errors:
            for error in errors:
                print(f"FAIL: {error}", file=sys.stderr)
            return 1
        print("evidence OK")
        return 0
    else:
        return 2
    print(f"[E{source['id']}] {source['title'] or source['kind']} — {source['locator']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
