# FAMILY CFO 3.4.2

- Accounting and forecast corrections; dated reconciliation.
- Local backup migration to schema 2, generic child account identifiers, preview and atomic restore with rollback snapshot.
- Render failure protection, versioned assets, mobile layout and privacy improvements.

Validation: 28 automated tests passed before release preparation. Android test deployment: import, rollback, invalid backup rejection and real legacy backup checks confirmed by operator. Full database equivalence was not independently automated.

Before production: verify latest CI, preserve external backup, approve merge explicitly, verify Pages update and local migration. Keep test environment isolated until production verification. Historical Git contents are not sanitized by this release.
