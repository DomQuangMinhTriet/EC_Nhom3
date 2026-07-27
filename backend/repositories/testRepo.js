import db from "../models/index.js";

class TestRepo {
  async getAllUsers() {
    return db.TestUser.findAll({
      attributes: ["id", "name"],
      raw: true,
    });
  }

  async getUserById(id) {
    return db.TestUser.findByPk(id, {
      attributes: ["id", "name"],
      raw: true,
    });
  }
}

export default new TestRepo();
