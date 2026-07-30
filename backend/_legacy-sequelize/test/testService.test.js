import assert from "node:assert/strict";
import test from "node:test";

import testService from "../services/testService.js";

test("getAllUsers returns the user list and its total", async () => {
  const result = await testService.getAllUsers();

  assert.equal(result.total, 2);
  assert.deepEqual(result.data, [
    { id: 1, name: "John" },
    { id: 2, name: "Jane" },
  ]);
});

test("getUserById accepts an id from route parameters", async () => {
  const user = await testService.getUserById("2");

  assert.deepEqual(user, { id: 2, name: "Jane" });
});

test("getUserById rejects an unknown user", async () => {
  await assert.rejects(testService.getUserById("999"), /User not found/);
});
