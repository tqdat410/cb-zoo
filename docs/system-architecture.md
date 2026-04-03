# System Architecture

## Modules

- `src/config.js`
  Exports static roll constants plus filesystem path helpers.

- `src/buddy-engine.js`
  Implements wyhash-based seeding, mulberry32 PRNG, rarity selection, stat generation, and `rollFrom(uuid)`.

- `src/breed-table.js`
  Stores the symmetric parent-species lookup table used to determine offspring species.

- `src/breed-engine.js`
  Builds target offspring traits from two parents and hunts UUIDs whose deterministic roll output matches those stored traits.

- `src/wyhash.js`
  Provides the wyhash helper used to seed deterministic buddy generation from UUID input.

- `src/claude-state.js`
  Resolves the Claude account state file, parses BOM-tolerant JSON, validates config and UUID shapes, and sanitizes readable/editable companion metadata.

- `src/companion-state.js`
  Reads the current stored companion, merges it with UUID-regenerated buddy bones for `--current`, and formats the current companion summary card.

- `src/settings-manager.js`
  Owns `~/.cb-zoo/settings.json`, migrates legacy `backup.json`, validates and normalizes backup data plus `maxBuddy`, `rollConfig`, `rollCharges`, `pendingBuddy`, and `breedEgg` including optional `hatchedUuid`, and persists atomic settings writes.

- `src/roll-charge-manager.js`
  Normalizes lazy charge refill math, formats next-refill countdowns, exposes shared charge snapshots, and consumes one charge for each brand-new roll.

- `src/uuid-manager.js`
  Owns atomic Claude-state writes, delegates backup persistence to `settings-manager`, rejects pre-existing temp write paths, creates the first UUID backup, applies UUID changes, updates current companion metadata, and restores the backup.

- `src/sprites.js`
  Stores ASCII species bodies and hat overlays, then renders a fixed 5-line sprite from roll traits.

- `src/gacha-animation.js`
  Handles the legacy/plain reveal flow plus reusable buddy-card rendering.

- `src/launch-mode.js`
  Decides whether the app should launch the default TUI or stay on an explicit plain CLI path.

- `src/tui/render-helpers.js`
  Owns shared TUI ANSI helpers, visible-width handling, and the single rarity-accent mapping used by roll, current, and collection surfaces.

- `src/tui/render-layout.js`
  Calculates centered shell metrics, enforces the bounded TUI width, renders a footer-only bottom bar for screen actions, supports right-aligned top-bar metadata, and falls back to a minimum-size warning when the terminal is smaller than `64x24`.

- `src/tui/*`
  Implements the centered cb-zoo TUI runtime: keypress handling, framed shell rendering, one-second redraw ticks for live countdown metadata, state transitions, roll flow, breed flow, egg timers, and individual views.

- `src/collection.js`
  Validates persisted collection state, rejects pre-existing temp write paths, enforces `maxBuddy` capacity from settings, appends minimal roll entries only when the user saves a reveal, preserves optional `bredFrom` lineage on bred entries, and removes saved entries on confirmed collection deletes.

- `src/cli.js`
  Parses arguments and orchestrates rolling, applying, restoring, and collection views. Breeding is currently exposed only through the default TUI.

- `scripts/check-release-contract.cjs`
  Verifies publish-facing repository invariants, required files, and syntax across `src/`, `scripts/`, `test/`, and `test-support/`.

- `scripts/smoke-cli.cjs`
  Exercises stable CLI smoke paths against temp fixtures so release checks cover shipped command behavior without touching real user state.

- `.github/workflows/ci.yml`
  Runs cross-platform test jobs plus a non-publishing release-check job on Ubuntu and Windows.

## Data Flow

1. Entry routing sends interactive no-flag TTY runs into the default TUI, while `--plain`, direct command flags (`--quick`, `--collection`, `--current`, edit/backup/restore), help, and non-TTY runs stay on explicit/plain CLI-safe paths.
2. TUI or CLI validates existing collection state, and settings-backed flows load `~/.cb-zoo/settings.json` or migrate legacy `backup.json` into it on first read.
3. Roll-charge manager reads `settings.rollConfig` and `settings.rollCharges`, lazily regenerates charges from elapsed time, and blocks brand-new rolls at `0` with a next-refill countdown. Defaults are `100` max charges and `300000` ms per refill.
4. Buddy engine rolls deterministic traits from the UUID via wyhash-seeded Mulberry32.
5. Plain CLI spends one charge before each brand-new reveal, then renders the buddy card and immediately tries to save the roll into `~/.cb-zoo/collection.json`. If local persistence fails before the prompt loop becomes active, cb-zoo restores the previous charge snapshot instead of silently burning the roll.
6. The default TUI also spends one charge per new reveal or reroll, but it commits that decrement only through the same atomic `settings.json` write that persists `settings.pendingBuddy`, so failed pending-save paths leave the shared charge pool unchanged.
7. If the user chooses Add or Equip from the TUI roll screen, collection storage appends a minimal record to `~/.cb-zoo/collection.json` only after the existing file parses as a valid buddy-entry array and current count is below `maxBuddy` (`50` by default).
8. If the user chooses Back from the TUI roll screen, cb-zoo returns home without mutating collection or UUID state and keeps `pendingBuddy` so the home action becomes "Resume Roll".
9. If the user chooses Equip, UUID manager updates the resolved Claude account state file after the collection write succeeds. If pending-clear or UUID-apply fails, the collection save is rolled back and the pending buddy is restored.
10. If the user opens the TUI Collection view, they can inspect saved buddies, see current count/capacity, apply the selected UUID directly without removing the saved entry, or delete the selected entry after confirmation. Collection apply creates the UUID backup first when needed.
11. Home-menu rendering checks settings state so `roll` becomes `Resume Roll` when `pendingBuddy` exists, while the breed action becomes `View Egg` or `Hatch Egg` when `breedEgg` exists. Shared shell rendering shows current reroll inventory and the next refill countdown in the top-right header instead of in the home body.
12. If the user opens Breed from the TUI and a persisted egg already exists, breed flow resumes that egg immediately. Without an egg, breeding only requires at least two saved collection entries, so pending rolls and a full collection do not block parent selection.
13. Breed parent selection reads from the saved collection in reverse order, uses a collection-style list-plus-detail picker, shows the chosen `parent A` in the top subtitle with a visible `← Back` affordance instead of rendering a second body box, and colors the parent summary with that buddy's rarity accent.
14. After the second parent is chosen, breed flow rejects duplicate UUID pairs and opens a dedicated confirm screen whose top subtitle shows both parents with rarity-colored summaries while the body renders compact `parent A × parent B` cards before any egg is started.
15. Incubation target traits derive species from `src/breed-table.js`, inherit eye/hat from parents, use floor-averaged parent rarity with a capped one-tier upgrade chance, force `hat: "none"` on `common`, and keep a 1% shiny chance.
16. Confirming the pairing derives target offspring traits, then writes `settings.breedEgg` with parent UUIDs, target traits, `createdAt`, and `hatchAt`, where `hatchAt` comes from the rarity-based egg timer map in `src/config.js`.
17. The TUI runtime redraws once per second so both egg timers and shared reroll refill countdowns keep ticking live, and breed flow still keeps its hatch-check timer while leaving the screen with the `escape` key returns home without clearing the egg from settings.
18. Once the egg is ready, breed flow hunts a real UUID whose deterministic roll output matches the stored target traits, persists it as `breedEgg.hatchedUuid`, and stages a hatched buddy with `bredFrom: [parentAUuid, parentBUuid]` so later resumes reopen the same offspring.
19. The hatch screen offers Add, Equip, and Delete. Add appends the buddy to the collection, Equip appends and applies the UUID, and Delete discards the hatch. Add and Equip remain blocked while the collection is already at `maxBuddy`.
20. The ready-hatch reveal reuses the shared ANSI buddy-card renderer so rarity accent, sprite, text, and stat bars stay visually consistent with roll and current-buddy screens.
21. If Add or Equip fails, the egg stays persisted so the hatch can be retried later. Equip failures also roll back the collection save and restore `breedEgg` before returning control to the hatch screen.
22. If the user relaunches the TUI or re-enters roll while `pendingBuddy` exists, controller/state rebuild the revealed roll state and resume that buddy without spending another charge.
23. If the user runs `--current` or opens the current-buddy TUI view, companion-state reads stored soul data, regenerates UUID-derived bones, and renders the merged summary.
24. If the user edits the current buddy name or personality, UUID manager mutates only those stored companion metadata fields and leaves UUID-derived bones unchanged.

## Release Verification Flow

1. `npm run check` validates package publish contract, required repo files, and JavaScript syntax.
2. `npm run smoke` runs temp-fixture CLI smoke checks for help, collection, current, and plain quick-roll flows.
3. `npm run release:verify` chains contract checks, `npm test`, smoke checks, and `npm run test:coverage`.
4. `npm run release:check` adds `npm pack --dry-run`, and GitHub Actions mirrors that gate on Ubuntu and Windows without publishing.

## Storage

- Claude account state:
  - preferred: `~/.claude.json`
  - supported override: `$CLAUDE_CONFIG_DIR/.claude.json`
  - fallback-only legacy/community paths when preferred files are missing or unusable: `~/.claude/.config.json`, `%APPDATA%\\Claude\\config.json`
- Settings: `~/.cb-zoo/settings.json`
  - `backup`: original UUID plus pinned Claude state file metadata
  - `maxBuddy`: positive integer collection capacity, default `50`
  - `rollConfig`: user-tunable roll cap and refill interval; defaults to `100` charges and `300000` ms
  - `rollCharges`: mutable roll inventory with `available` and refill anchor `updatedAt`
  - `pendingBuddy`: last revealed-but-unsaved TUI buddy, cleared on successful Add or Equip
  - `breedEgg`: persisted incubating egg with parent UUIDs, target traits, `createdAt`, `hatchAt`, and optional `hatchedUuid`
  - legacy `backup.json` is migrated into `settings.json` on first settings load
- Collection: `~/.cb-zoo/collection.json`
  - standard roll entries store UUID, buddy traits, `total`, and `rolledAt`
  - bred entries may also store `bredFrom` as a two-UUID lineage tuple

## Failure Handling

- Missing Claude account state throws a clear setup error with checked path candidates.
- BOM-prefixed JSON is normalized before parse.
- Malformed UUIDs and invalid config container shapes are rejected before config writes.
- Companion metadata edits fail closed when the resolved Claude state has no valid stored companion or when trimmed edit values are empty.
- TUI startup must restore terminal state on exit or thrown errors.
- TUI layout falls back to a minimum-size warning when the terminal is smaller than `64x24`.
- Pre-existing temp write paths are rejected before config, settings, or collection writes.
- Missing backup throws a restore-specific error.
- Invalid `settings.json` content blocks settings-backed flows until the file is fixed or removed.
- Malformed backup data inside `settings.json` blocks backup/apply/restore paths before any config mutation.
- Invalid `rollConfig` or `rollCharges` payloads normalize back to safe defaults on load instead of crashing the app.
- Invalid `pendingBuddy` payloads are dropped to `null` on load instead of resuming bad state.
- Invalid `breedEgg` payloads, including duplicate parent UUIDs or unsupported cosmetics, are dropped to `null` on load.
- Invalid collection JSON or invalid entry shapes block roll mode before backup, reveal, or collection writes, and preserve the existing file for manual recovery.
- Collection saves fail with `Collection full (n/max)` once saved entries reach `maxBuddy`, and failed TUI Add/Equip keeps the pending buddy available to resume.
- Brand-new CLI or TUI rolls fail fast with `No rolls left. Next +1 in mm:ss.` when the shared charge counter is empty, but resuming an already pending reveal stays allowed.
- Plain CLI refunds a charge when reveal-side persistence fails before the prompt loop commits the roll, and TUI reveal-start paths fail closed because charge spend and `pendingBuddy` persistence share one settings write.
- Breed start refuses to open a new pairing only when fewer than two saved buddies exist.
- Hatch Add and Equip failures leave `breedEgg` in settings so the user can return and retry instead of losing the ready egg, while Delete intentionally clears it.
- `CB_ZOO_DATA_DIR` cannot resolve to protected Claude state directories such as `.claude` or Windows `%APPDATA%\\Claude`, or any nested path inside them.
