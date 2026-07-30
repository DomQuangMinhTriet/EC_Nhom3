import testService from "../services/testService.js";
import responseFormat from "../dto/responses/responseFormat.js";
import { RESPONSE_STATUS } from "../constants/responseStatus.js";

class TestController {
  async getAllUsers(req, res) {
    try {
      const result = await testService.getAllUsers();

      return res
        .status(RESPONSE_STATUS.SUCCESS.code)
        .json(
          responseFormat(
            RESPONSE_STATUS.SUCCESS,
            result,
            "Get users successfully",
          ),
        );
    } catch (error) {
      return res
        .status(RESPONSE_STATUS.INTERNAL_SERVER_ERROR.code)
        .json(
          responseFormat(
            RESPONSE_STATUS.INTERNAL_SERVER_ERROR,
            null,
            error.message,
          ),
        );
    }
  }

  async getUserById(req, res) {
    try {
      const result = await testService.getUserById(req.params.id);

      return res
        .status(RESPONSE_STATUS.SUCCESS.code)
        .json(
          responseFormat(
            RESPONSE_STATUS.SUCCESS,
            result,
            "Get user successfully",
          ),
        );
    } catch (error) {
      return res
        .status(RESPONSE_STATUS.NOT_FOUND.code)
        .json(responseFormat(RESPONSE_STATUS.NOT_FOUND, null, error.message));
    }
  }
}

export default new TestController();
