import assert from "node:assert/strict";
import test from "node:test";

import responseFormat from "../dto/responses/responseFormat.js";
import { RESPONSE_STATUS } from "../constants/responseStatus.js";

test("responseFormat creates the standard API response envelope", () => {
  const data = { id: 1, name: "John" };

  assert.deepEqual(
    responseFormat(RESPONSE_STATUS.SUCCESS, data, "Get user successfully"),
    {
      code: 200,
      status: "SUCCESS",
      message: "Get user successfully",
      data,
    },
  );
});
