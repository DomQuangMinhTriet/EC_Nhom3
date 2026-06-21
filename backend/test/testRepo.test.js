import assert from "node:assert/strict";
import test from "node:test";

import testRepo from "../repositories/testRepo.js";

test("repository finds a user when the route id is a string", async () => {
  const user = await testRepo.getUserById("1");

  assert.deepEqual(user, { id: 1, name: "John" });
});
