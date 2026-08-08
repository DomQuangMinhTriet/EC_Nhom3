import { AppError } from "../../shared/errors/AppError";
import { HealthRepository } from "./health.repository";

export class HealthService {
  constructor(private readonly healthRepository = new HealthRepository()) {}

  getApiStatus() {
    return {
      status: "ok",
      service: "EC Voucher API",
    };
  }

  async getDatabaseStatus() {
    try {
      await this.healthRepository.pingDatabase();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      throw new AppError(`Database unreachable: ${message}`, 503);
    }

    return {
      database: "connected",
    };
  }
}
