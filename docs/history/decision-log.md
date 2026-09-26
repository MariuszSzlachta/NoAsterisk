# Historical Decision Log — Atomized Access

The original the legacy decision log was atomized into 59 independently retrievable legacy decision files. Three additional records, DEC-059–061, were recovered on 2026-08-01 from a separate untracked temporary workspace, producing 62 independently retrievable DEC records in total.

- [Decision index](./decisions/README.md)
- [Integrity issues](./decisions/integrity-issues.md)

DEC records preserve chronological project history; they are not automatically current guidance and are not formal ADRs. Use the [ADR index](../adr/README.md) and current implementation guides when determining authority.

## Frozen aggregate provenance

The complete pre-atomization aggregate remains available in Git commit
`582b3e8b147293c7b33dd0f839839aa81d7c8c20` at
`docs/history/decision-log.md`. This landing page replaces the aggregate as the
primary retrieval source.

The frozen aggregate ends at DEC-058. The later [recovered records and their corroboration](./decisions/integrity-issues.md#recovered-dec-059-dec-060-and-dec-061) have separate provenance and were not retroactively inserted into that snapshot.
