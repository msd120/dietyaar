# Nutrition development fixture boundary

Status: development-only, not approved for release.

Dietyaar's committed nutrition fixture contains searchable bilingual food names only. Every nutrient field is deliberately `NULL`; the fixture must never be displayed as verified nutrition data or promoted to `APPROVED`. It exists to exercise catalog search, owner-private user foods, unknown-value handling, portion resolution, and immutable meal provenance without inventing nutrient values.

The intended production-source candidate is USDA FoodData Central. USDA states that FoodData Central data are public domain and published under CC0 1.0, and provides versioned JSON/CSV downloads. Foundation Foods documentation defines values on a 100 g edible-portion basis and the portion formula `N = V × W / 100`.

- Licensing and citation: https://fdc.nal.usda.gov/api-guide/
- Versioned downloads: https://fdc.nal.usda.gov/download-datasets/
- Foundation Foods documentation: https://fdc.nal.usda.gov/Foundation_Foods_Documentation/

Before any catalog version is marked `APPROVED`, a separate reviewed import must record the exact dataset release, file checksum, FoodData Central IDs, nutrient identifiers, edible basis, transformation notes, and Iranian-food coverage review. The importer must preserve unavailable values as `NULL`, and confirmed meals must retain source ID/version snapshots.

The development fixture is idempotent and refuses non-local database hosts. It deletes/replaces only its own version namespace.
