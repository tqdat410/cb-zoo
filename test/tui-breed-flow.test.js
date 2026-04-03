import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { rollFrom } from "../src/buddy-engine.js";
import { saveToCollection, loadCollection } from "../src/collection.js";
import { createInitialState } from "../src/tui/state.js";
import { createKeypressHandler } from "../src/tui/controller.js";
import { handleBreedKeypress, openBreedFlow } from "../src/tui/breed-flow.js";
import { clearBreedEgg, getBreedEgg, saveSettings, setBreedEgg, setPendingBuddy } from "../src/settings-manager.js";
import { withTempEnvironment } from "../test-support/with-temp-environment.js";

async function withMockedRandom(values, run) {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => values[Math.min(index++, values.length - 1)];
  try {
    return await run();
  } finally {
    Math.random = originalRandom;
  }
}

test("openBreedFlow still allows breeding when a pending roll exists", async () => {
  await withTempEnvironment(async () => {
    saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const state = createInitialState();
    setPendingBuddy(rollFrom("11111111-1111-4111-8111-111111111111"));

    await openBreedFlow(state, () => {});

    assert.equal(state.screen, "breed");
    assert.equal(state.breed.phase, "select-a");
  });
});

test("openBreedFlow enters parent-a selection when two buddies exist", async () => {
  await withTempEnvironment(async () => {
    saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const state = createInitialState();

    await openBreedFlow(state, () => {});

    assert.equal(state.screen, "breed");
    assert.equal(state.breed.phase, "select-a");
    assert.equal(state.breed.options.length, 2);
    assert.equal(state.statusMessage, "Choose the first parent.");
  });
});

test("openBreedFlow still allows breeding when collection is full", async () => {
  await withTempEnvironment(async () => {
    saveSettings({ backup: null, maxBuddy: 2, pendingBuddy: null, breedEgg: null });
    saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const state = createInitialState();

    await openBreedFlow(state, () => {});

    assert.equal(state.screen, "breed");
    assert.equal(state.breed.phase, "select-a");
  });
});

test("breed flow selects parents and creates an egg", async () => {
  await withTempEnvironment(async () => {
    saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const state = createInitialState();
    await openBreedFlow(state, () => {});

    await handleBreedKeypress(state, { name: "enter" }, () => {});
    assert.equal(state.breed.phase, "select-b");
    assert.equal(state.breed.options.length, 1);

    await handleBreedKeypress(state, { name: "enter" }, () => {});
    assert.equal(state.breed.phase, "confirm");

    await withMockedRandom([0.1, 0.1, 0.9, 0.9], async () => {
      await handleBreedKeypress(state, { name: "enter" }, () => {});
    });
    assert.equal(state.breed.phase, "egg");
    assert.equal(state.screen, "breed");
    assert.ok(getBreedEgg());
    assert.equal(getBreedEgg().parentA, state.breed.parentA.uuid);
    assert.equal(getBreedEgg().parentB, state.breed.parentB.uuid);
    await handleBreedKeypress(state, { name: "escape" }, () => {});
    clearBreedEgg();
  });
});

test("select-b escape returns to select-a before incubation", async () => {
  await withTempEnvironment(async () => {
    saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const state = createInitialState();

    await openBreedFlow(state, () => {});
    await handleBreedKeypress(state, { name: "enter" }, () => {});
    assert.equal(state.breed.phase, "select-b");

    await handleBreedKeypress(state, { name: "escape" }, () => {});

    assert.equal(state.breed.phase, "select-a");
    assert.equal(state.statusMessage, "Choose the first parent.");
  });
});

test("select-b left arrow returns to select-a before incubation", async () => {
  await withTempEnvironment(async () => {
    saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const state = createInitialState();

    await openBreedFlow(state, () => {});
    await handleBreedKeypress(state, { name: "enter" }, () => {});
    assert.equal(state.breed.phase, "select-b");

    await handleBreedKeypress(state, { name: "left" }, () => {});

    assert.equal(state.breed.phase, "select-a");
    assert.equal(state.statusMessage, "Choose the first parent.");
  });
});

test("confirm screen escape returns to select-b before incubation", async () => {
  await withTempEnvironment(async () => {
    saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const state = createInitialState();

    await openBreedFlow(state, () => {});
    await handleBreedKeypress(state, { name: "enter" }, () => {});
    await handleBreedKeypress(state, { name: "enter" }, () => {});
    assert.equal(state.breed.phase, "confirm");

    await handleBreedKeypress(state, { name: "escape" }, () => {});

    assert.equal(state.breed.phase, "select-b");
    assert.equal(state.statusMessage, "Choose the second parent.");
  });
});

test("confirm screen left arrow returns to select-b before incubation", async () => {
  await withTempEnvironment(async () => {
    saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const state = createInitialState();

    await openBreedFlow(state, () => {});
    await handleBreedKeypress(state, { name: "enter" }, () => {});
    await handleBreedKeypress(state, { name: "enter" }, () => {});
    assert.equal(state.breed.phase, "confirm");

    await handleBreedKeypress(state, { name: "left" }, () => {});

    assert.equal(state.breed.phase, "select-b");
    assert.equal(state.statusMessage, "Choose the second parent.");
  });
});

test("ready egg can be added from the hatch screen", async () => {
  await withTempEnvironment(async () => {
    const parentA = saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    const parentB = saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
    const targetBuddy = rollFrom(targetUuid);
    const originalRandomUuid = crypto.randomUUID;
    crypto.randomUUID = () => targetUuid;
    try {
      setBreedEgg({
        parentA: parentA.uuid,
        parentB: parentB.uuid,
        species: targetBuddy.species,
        eye: targetBuddy.eye,
        hat: targetBuddy.hat,
        rarity: targetBuddy.rarity,
        shiny: false,
        createdAt: Date.now() - 2_000,
        hatchAt: Date.now() - 1_000
      });
      const state = createInitialState();

      await openBreedFlow(state, () => {});

      assert.equal(state.breed.phase, "hatch");
      assert.equal(state.breed.hatchedBuddy.uuid, targetUuid);
      assert.equal(getBreedEgg().hatchedUuid, targetUuid);

      await handleBreedKeypress(state, { name: "text", value: "a" }, () => {});

      assert.equal(state.screen, "home");
      assert.equal(getBreedEgg(), null);
      assert.equal(loadCollection().length, 3);
      assert.deepEqual(loadCollection().at(-1).bredFrom, [parentA.uuid, parentB.uuid]);
    } finally {
      crypto.randomUUID = originalRandomUuid;
      clearBreedEgg();
    }
  });
});

test("ready egg reuses its stored hatchedUuid when reopened", async () => {
  await withTempEnvironment(async () => {
    const parentA = saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    const parentB = saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
    const targetBuddy = rollFrom(targetUuid);
    setBreedEgg({
      parentA: parentA.uuid,
      parentB: parentB.uuid,
      species: targetBuddy.species,
      eye: targetBuddy.eye,
      hat: targetBuddy.hat,
      rarity: targetBuddy.rarity,
      shiny: false,
      hatchedUuid: targetUuid,
      createdAt: Date.now() - 2_000,
      hatchAt: Date.now() - 1_000
    });
    const state = createInitialState();

    await openBreedFlow(state, () => {});
    assert.equal(state.breed.phase, "hatch");
    assert.equal(state.breed.hatchedBuddy.uuid, targetUuid);

    await handleBreedKeypress(state, { name: "escape" }, () => {});
    assert.equal(state.screen, "home");

    await openBreedFlow(state, () => {});
    assert.equal(state.breed.phase, "hatch");
    assert.equal(state.breed.hatchedBuddy.uuid, targetUuid);

    clearBreedEgg();
  });
});

test("openBreedFlow resumes an incubating egg", async () => {
  await withTempEnvironment(async () => {
    const parentA = saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    const parentB = saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    setBreedEgg({
      parentA: parentA.uuid,
      parentB: parentB.uuid,
      species: "goose",
      eye: "✦",
      hat: "none",
      rarity: "uncommon",
      shiny: false,
      createdAt: Date.now(),
      hatchAt: Date.now() + 60_000
    });
    const state = createInitialState();

    await openBreedFlow(state, () => {});

    assert.equal(state.screen, "breed");
    assert.equal(state.breed.phase, "egg");
    assert.ok(state.breed.timer);
    assert.equal(state.statusMessage, "Egg incubating.");

    await handleBreedKeypress(state, { name: "escape" }, () => {});
    assert.equal(state.screen, "home");
    clearBreedEgg();
  });
});

test("existing egg takes priority over pending roll", async () => {
  await withTempEnvironment(async () => {
    const parentA = saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    const parentB = saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    setPendingBuddy(rollFrom("33333333-3333-4333-8333-333333333333"));
    setBreedEgg({
      parentA: parentA.uuid,
      parentB: parentB.uuid,
      species: "goose",
      eye: "✦",
      hat: "none",
      rarity: "uncommon",
      shiny: false,
      createdAt: Date.now(),
      hatchAt: Date.now() + 60_000
    });
    const state = createInitialState();

    await openBreedFlow(state, () => {});

    assert.equal(state.screen, "breed");
    assert.equal(state.breed.phase, "egg");
    await handleBreedKeypress(state, { name: "escape" }, () => {});
    clearBreedEgg();
  });
});

test("breed save failure keeps the egg recoverable", async () => {
  await withTempEnvironment(async () => {
    saveSettings({ backup: null, maxBuddy: 2, pendingBuddy: null, breedEgg: null });
    const parentA = saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    const parentB = saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
    const targetBuddy = rollFrom(targetUuid);
    const originalRandomUuid = crypto.randomUUID;
    crypto.randomUUID = () => targetUuid;
    try {
      setBreedEgg({
        parentA: parentA.uuid,
        parentB: parentB.uuid,
        species: targetBuddy.species,
        eye: targetBuddy.eye,
        hat: targetBuddy.hat,
        rarity: targetBuddy.rarity,
        shiny: false,
        createdAt: Date.now() - 2_000,
        hatchAt: Date.now() - 1_000
      });
      const state = createInitialState();
      state.menuIndex = 3;
      const handler = createKeypressHandler(state, () => {});

      await handler({ name: "enter" });
      assert.equal(state.breed.phase, "hatch");

      await handler({ name: "enter" });

      assert.equal(state.screen, "breed");
      assert.equal(state.breed.phase, "hatch");
      assert.match(state.statusMessage, /Collection full/i);
      assert.ok(getBreedEgg());
    } finally {
      crypto.randomUUID = originalRandomUuid;
      clearBreedEgg();
    }
  });
});

test("full collection blocks add on the hatch screen but keeps the egg recoverable", async () => {
  await withTempEnvironment(async () => {
    saveSettings({ backup: null, maxBuddy: 2, pendingBuddy: null, breedEgg: null });
    const parentA = saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    const parentB = saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
    const targetBuddy = rollFrom(targetUuid);
    setBreedEgg({
      parentA: parentA.uuid,
      parentB: parentB.uuid,
      species: targetBuddy.species,
      eye: targetBuddy.eye,
      hat: targetBuddy.hat,
      rarity: targetBuddy.rarity,
      shiny: false,
      hatchedUuid: targetUuid,
      createdAt: Date.now() - 2_000,
      hatchAt: Date.now() - 1_000
    });
    const state = createInitialState();

    await openBreedFlow(state, () => {});
    await handleBreedKeypress(state, { name: "text", value: "a" }, () => {});

    assert.equal(state.screen, "breed");
    assert.equal(state.breed.phase, "hatch");
    assert.match(state.statusMessage, /Collection full/i);
    assert.ok(getBreedEgg());
    assert.equal(loadCollection().length, 2);
  });
});

test("full collection blocks equip on the hatch screen but keeps the egg recoverable", async () => {
  await withTempEnvironment(async () => {
    saveSettings({ backup: null, maxBuddy: 2, pendingBuddy: null, breedEgg: null });
    const parentA = saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    const parentB = saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
    const targetBuddy = rollFrom(targetUuid);
    setBreedEgg({
      parentA: parentA.uuid,
      parentB: parentB.uuid,
      species: targetBuddy.species,
      eye: targetBuddy.eye,
      hat: targetBuddy.hat,
      rarity: targetBuddy.rarity,
      shiny: false,
      hatchedUuid: targetUuid,
      createdAt: Date.now() - 2_000,
      hatchAt: Date.now() - 1_000
    });
    const state = createInitialState();

    await openBreedFlow(state, () => {});
    await handleBreedKeypress(state, { name: "enter" }, () => {});

    assert.equal(state.screen, "breed");
    assert.equal(state.breed.phase, "hatch");
    assert.match(state.statusMessage, /Collection full/i);
    assert.ok(getBreedEgg());
    assert.equal(loadCollection().length, 2);
  });
});

test("hatched buddy can be equipped from the hatch screen", async () => {
  await withTempEnvironment(async ({ readConfig }) => {
    const parentA = saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    const parentB = saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
    const targetBuddy = rollFrom(targetUuid);
    setBreedEgg({
      parentA: parentA.uuid,
      parentB: parentB.uuid,
      species: targetBuddy.species,
      eye: targetBuddy.eye,
      hat: targetBuddy.hat,
      rarity: targetBuddy.rarity,
      shiny: false,
      hatchedUuid: targetUuid,
      createdAt: Date.now() - 2_000,
      hatchAt: Date.now() - 1_000
    });
    const state = createInitialState();

    await openBreedFlow(state, () => {});
    await handleBreedKeypress(state, { name: "text", value: "e" }, () => {});

    assert.equal(state.screen, "home");
    assert.equal(getBreedEgg(), null);
    assert.equal(loadCollection().length, 3);
    assert.equal(readConfig().oauthAccount.accountUuid, targetUuid);
  });
});

test("delete discards the hatched buddy and clears the egg", async () => {
  await withTempEnvironment(async () => {
    const parentA = saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    const parentB = saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
    const targetBuddy = rollFrom(targetUuid);
    setBreedEgg({
      parentA: parentA.uuid,
      parentB: parentB.uuid,
      species: targetBuddy.species,
      eye: targetBuddy.eye,
      hat: targetBuddy.hat,
      rarity: targetBuddy.rarity,
      shiny: false,
      createdAt: Date.now() - 2_000,
      hatchAt: Date.now() - 1_000
    });
    const state = createInitialState();

    await openBreedFlow(state, () => {});
    await handleBreedKeypress(state, { name: "text", value: "d" }, () => {});

    assert.equal(state.screen, "home");
    assert.equal(getBreedEgg(), null);
    assert.equal(loadCollection().length, 2);
  });
});

test("hatch actions support left-right navigation", async () => {
  await withTempEnvironment(async () => {
    const parentA = saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    const parentB = saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
    const targetBuddy = rollFrom(targetUuid);
    setBreedEgg({
      parentA: parentA.uuid,
      parentB: parentB.uuid,
      species: targetBuddy.species,
      eye: targetBuddy.eye,
      hat: targetBuddy.hat,
      rarity: targetBuddy.rarity,
      shiny: false,
      createdAt: Date.now() - 2_000,
      hatchAt: Date.now() - 1_000
    });
    const state = createInitialState();

    await openBreedFlow(state, () => {});
    assert.equal(state.breed.hatchActionIndex, 0);

    await handleBreedKeypress(state, { name: "right" }, () => {});
    assert.equal(state.breed.hatchActionIndex, 1);

    await handleBreedKeypress(state, { name: "text", value: "l" }, () => {});
    assert.equal(state.breed.hatchActionIndex, 2);

    await handleBreedKeypress(state, { name: "left" }, () => {});
    assert.equal(state.breed.hatchActionIndex, 1);
  });
});

test("controller quit clears the incubating egg timer", async () => {
  await withTempEnvironment(async () => {
    const parentA = saveToCollection(rollFrom("11111111-1111-4111-8111-111111111111"));
    const parentB = saveToCollection(rollFrom("22222222-2222-4222-8222-222222222222"));
    setBreedEgg({
      parentA: parentA.uuid,
      parentB: parentB.uuid,
      species: "goose",
      eye: "✦",
      hat: "none",
      rarity: "uncommon",
      shiny: false,
      createdAt: Date.now(),
      hatchAt: Date.now() + 60_000
    });
    const state = createInitialState();
    state.menuIndex = 3;
    const handler = createKeypressHandler(state, () => {});

    await handler({ name: "enter" });
    assert.ok(state.breed.timer);

    await handler({ name: "text", value: "q" });

    assert.equal(state.shouldExit, true);
    assert.equal(state.breed.timer, null);
    clearBreedEgg();
  });
});

test("breed flow refuses to pair duplicate UUID entries", async () => {
  await withTempEnvironment(async () => {
    const duplicate = rollFrom("11111111-1111-4111-8111-111111111111");
    saveToCollection(duplicate);
    saveToCollection(duplicate);
    const state = createInitialState();

    await openBreedFlow(state, () => {});
    await handleBreedKeypress(state, { name: "enter" }, () => {});

    assert.equal(state.breed.phase, "select-a");
    assert.equal(state.statusMessage, "Choose a buddy with a different UUID.");
  });
});
