// constants/responseStatus.js

export const RESPONSE_STATUS = {
  SUCCESS: {
    code: 200,
    status: "SUCCESS",
  },

  CREATED: {
    code: 201,
    status: "CREATED",
  },

  BAD_REQUEST: {
    code: 400,
    status: "BAD_REQUEST",
  },

  UNAUTHORIZED: {
    code: 401,
    status: "UNAUTHORIZED",
  },

  FORBIDDEN: {
    code: 403,
    status: "FORBIDDEN",
  },

  NOT_FOUND: {
    code: 404,
    status: "NOT_FOUND",
  },

  INTERNAL_SERVER_ERROR: {
    code: 500,
    status: "INTERNAL_SERVER_ERROR",
  },
};
