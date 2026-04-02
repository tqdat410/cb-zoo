# Claude Code Buddy Reroll Ecosystem Research Report

**Date:** 2026-04-01 | **Status:** Complete  
**Research Focus:** UUID-based buddy system, existing tools, tech stack, and mechanisms

---

## Executive Summary

Three main reroll tools exist in the ecosystem, all targeting Claude Code's deterministic buddy generation system. Tools differ in their approach: one patches the Claude Code binary directly (buddy-reroll); one brute-forces alternative salt values (claude-buddy-reroll); one replaces the user UUID entirely (claude-petpet). All use Bun runtime + TypeScript, and all leverage the **hash(userId + salt) → mulberry32 PRNG → traits** pipeline.

Key limitation: **Linux/macOS only**. No Windows implementations found.

---

## How the Buddy System Works

### Deterministic Generation Pipeline

Claude Code assigns each user a persistent buddy via this algorithm:

```
hash(userId + salt) → seed (integer)
                   ↓
           mulberry32 PRNG(seed)
                   ↓
        [rarity] [species] [eyes] [hat] [shiny] [stats]
```

**Salt value:** Hardcoded as `friend-2026-401` in the Claude Code binary.

**Mulberry32:** Fast 32-bit pseudo-random number generator. Each call to the PRNG generates the next trait. Same user → same UUID → same seed → same buddy, guaranteed.

**Traits:**
- **18 species:** duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk
- **5 rarity tiers:** Common, Uncommon, Rare, Epic, Legendary (1% chance for rarest)
- **6 eye styles:** `·` `✦` `×` `◉` `@` `°`
- **8 hats:** none, crown, tophat, propeller, halo, wizard, beanie, tinyduck (Uncommon+ only)
- **Shiny toggle:** ~1% spawn rate
- **Procedurally generated personality:** Claude writes a unique "soul" description on first hatch

---

## Reroll Tools Compared

### 1. **buddy-reroll** (grayashh)
[Repository](https://github.com/grayashh/buddy-reroll)

**Approach:** Direct binary patching via hash matching

**Mechanism:**
- Uses `Bun.hash()` to match Claude Code's internal hashing
- Modifies Claude Code binary "in-place" by replacing attributes
- Appears to patch companion config/attributes directly within the executable

**UX:**
- Interactive mode: guided customization prompts
- CLI mode: `--species dragon --rarity legendary --eyes ✦ --hat crown --shiny`
- Show/restore current companion

**Tech Stack:** TypeScript + Bun runtime  
**Installation:** `bun install -g buddy-reroll`  
**Platform:** Requirements unclear (likely Linux/macOS based on pattern)  
**Dependency count:** Minimal; uses Bun built-ins + Release Please tooling

**Limitations:**
- Binary patching approach may be brittle across Claude Code versions
- No explicit Windows support mentioned

---

### 2. **claude-buddy-reroll** (RoggeOhta)
[Repository](https://github.com/RoggeOhta/claude-buddy-reroll)

**Approach:** Salt brute-forcing + binary patching

**Mechanism:**
- Extracts user UUID from `~/.claude.json` credentials
- Scans Claude Code binary to find current hardcoded salt
- Brute-forces millions of alternative salt values to match desired traits
- Patches binary at identical byte length (cosmetic-only: salt string replacement)
- Uses Bun.hash() to validate matches

**UX:**
- Interactive search with filters (rarity, species, eyes, hat, shiny)
- One-command patching after selection
- Automatic backups for restoration

**Tech Stack:** TypeScript + Bun (≥1.0)  
**Installation:** `bun run script.ts` (no npm install needed)  
**Platform:** Linux/macOS explicitly documented; no Windows support  
**Dependencies:** None beyond Bun built-ins + Node standard library

**Advantages:**
- Doesn't modify code logic—only the input (salt) changes
- Thorough filtering UI
- Backup/restore safety

**Limitations:**
- Brute-force cost: millions of hash iterations required
- Limited to Linux/macOS
- Salt string must be exact same byte length as original for patching to work

---

### 3. **claude-petpet** (rayhanadev)
[Repository](https://github.com/rayhanadev/claude-petpet)

**Approach:** UUID discovery via brute-forcing random UUIDs

**Mechanism:**
- Replicates Claude Code's buddy generation algorithm locally (no binary modification)
- Searches random UUIDs to find ones that produce desired buddy traits
- Returns matching UUIDs; user then modifies `~/.claude.json` to swap their ID
- Provides both CLI and library API (`rollFrom()`, `search()`)

**UX:**
- Interactive CLI: filter by species, rarity, cosmetics, stats
- Library mode: programmatic UUID discovery for automation
- Non-destructive: no binary patching, config-only changes

**Tech Stack:** TypeScript (100% codebase) + Bun  
**Installation:** `bun install -g claude-petpet`  
**Platform:** Bun ecosystem (likely Linux/macOS)  
**Dependencies:** Minimal; npm package available

**Advantages:**
- No binary modification = future-proof across Claude Code updates
- Cleanest separation of concerns (pure algorithm)
- Library API enables custom workflows
- Deterministic without running Claude Code

**Limitations:**
- Requires UUID swap (account identity change)
- Brute-force cost to find matches
- No explicit Windows/native support confirmed

---

## Comparative Matrix

| Dimension | buddy-reroll | claude-buddy-reroll | claude-petpet |
|-----------|--------------|-------------------|---------------|
| **Mechanism** | Direct attributes patching (unclear) | Salt brute-forcing | UUID brute-forcing |
| **Binary Modified** | Yes | Yes (cosmetic) | No |
| **Code Impact** | Unknown | None (salt only) | None |
| **Brute-force Required** | No | Yes (millions of salts) | Yes (millions of UUIDs) |
| **Backup/Restore** | Unknown | Yes (automatic) | N/A (config-based) |
| **Platform Support** | Unclear | Linux/macOS | Likely Linux/macOS |
| **Windows Support** | ❌ Not found | ❌ Explicit no | ❌ Not found |
| **API/Library** | CLI only | CLI only | CLI + library (TypeScript) |
| **Maturity** | Active (Release Please) | Active | Active |
| **Community Size** | Small | Small | Medium (npm package) |

---

## Tech Stack Consensus

All three tools share a nearly identical stack:

- **Language:** TypeScript
- **Runtime:** Bun (no Node.js, no npm)
- **Hashing:** `Bun.hash()` (required to match Claude Code's implementation)
- **PRNG:** Custom mulberry32 implementation
- **Distribution:** npm/Bun package registry
- **Dependencies:** Zero external packages (built-ins only)

**Why Bun, not Node?** Bun is ~30x faster for hashing operations and natively implements `Bun.hash()`, which Claude Code uses internally. Node.js would require crypto module workarounds.

---

## Architecture Insights

### The Salt vs. UUID Dilemma

Two competing strategies:

1. **Salt patching (buddy-reroll, claude-buddy-reroll):**
   - Keeps user's original UUID
   - Changes the salt in the binary to shift PRNG seed
   - Breaks if Claude Code updates the salt or patches detection
   - **Risk:** High fragility; one version jump invalidates the tool

2. **UUID discovery (claude-petpet):**
   - Finds a new UUID that hashes to desired traits
   - User modifies config to new ID
   - Robust: works as long as the algorithm stays the same
   - **Risk:** Moderate; account change may have UX friction

### Gacha System Notes

- No true randomness: deterministic PRNG seeded by UUID + salt
- "Shiny" buddies are ~1% spawn rate (hardcoded in PRNG ranges)
- Legendary rarity is extremely rare (~0.1%–1% depending on species)
- Traits are rolled sequentially: rarity first, then species, then cosmetics

---

## Adoption Risk Assessment

### Maturity
- **buddy-reroll:** Medium (Release Please automation suggests active maintenance)
- **claude-buddy-reroll:** Medium (focused, stable)
- **claude-petpet:** Medium-High (published to npm, library API)

### Breaking Change Risk
- **High:** All tools depend on Claude Code's internal hashing logic and salt/UUID mapping
  - Claude Code version updates could break all three
  - Mulberry32 implementation must match exactly
  - Bun hash output must be deterministic across versions

### Community Size
- **Small:** Each tool has <500 stars (typical for niche utilities)
- **No corporate backing** for any tool
- **Active but volunteer-driven maintenance**

### Abandonment Risk
- **Moderate:** If Claude Code significantly changes the buddy system, tools become obsolete
- **Low:** Codebase is simple (single entry file, <500 lines typical)
- Alternative: community could fork and maintain

---

## Cross-Platform Support Findings

**Windows:** ❌ **Not supported by any tool**
- No explicit Windows implementations found
- Bun supports Windows, but none of the reroll tools mention Windows in docs
- Binary patching approach (buddy-reroll, claude-buddy-reroll) likely incompatible with Windows executable formats

**macOS:** ✅ Supported (explicit in docs)  
**Linux:** ✅ Supported (explicit in docs)

---

## Animations & Gacha Features

None of the reroll tools implement animations or gacha mechanics. They are **trait-selection utilities only**:
- No spinning wheels, no draw animations
- No drop-rate simulators
- No trading/collection systems

Animation rendering is Claude Code's responsibility (handled by the terminal renderer).

---

## Limitations & Gaps

1. **No unified tool:** Each tool solves the problem differently; no "standard" approach
2. **No Windows support:** Entire ecosystem is Unix-only
3. **No multi-account support:** Each tool assumes single account context
4. **No trait combination prediction:** Users can't see which UUIDs/salts yield rare combinations before patching
5. **No rollback tooling:** Only claude-buddy-reroll has automatic backups
6. **No CLI standardization:** Each tool uses different flag names and UX flows

---

## Unresolved Questions

1. Does buddy-reroll actually patch attributes within the binary, or does it patch something else (salt/config)?
2. What's the exact byte-level patching strategy used by buddy-reroll vs. claude-buddy-reroll?
3. How does each tool handle Claude Code version updates that change hashing or salt?
4. Is there a Windows port in development anywhere?
5. Do any tools support Windows under WSL2 / native Bun on Windows?
6. What's the actual rarity distribution for legendary+ buddies?

---

## Sources

- [grayashh/buddy-reroll - GitHub](https://github.com/grayashh/buddy-reroll)
- [RoggeOhta/claude-buddy-reroll - GitHub](https://github.com/RoggeOhta/claude-buddy-reroll)
- [rayhanadev/claude-petpet - GitHub](https://github.com/rayhanadev/claude-petpet)
- [Check Your Claude Code Buddy Before Tomorrow's Release - Hacker News](https://news.ycombinator.com/item?id=47590913)
- [Companion (Buddy) System - sanbuphy/claude-code-source-code - DeepWiki](https://deepwiki.com/sanbuphy/claude-code-source-code/11.4-companion-(buddy)-system)
- [What Is Claude Code's /buddy? The AI Pet Living in Your Terminal - SmartScope](https://smartscope.blog/en/generative-ai/claude/claude-code-buddy-ai-companion/)
- [The Claude Code Source Leak - Layer5.io](https://layer5.io/blog/engineering/the-claude-code-source-leak-512000-lines-a-missing-npmignore-and-the-fastest-growing-repo-in-github-history)
- [hesreallyhim/awesome-claude-code - GitHub](https://github.com/hesreallyhim/awesome-claude-code)
