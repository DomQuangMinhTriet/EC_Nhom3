import type { Request, Response } from "express";
import { HealthService } from "./health.service";

export class HealthController {
  constructor(private readonly healthService = new HealthService()) {}

  getApiStatus = (_req: Request, res: Response) => {
    res.json(this.healthService.getApiStatus());
  };

  getDatabaseStatus = async (_req: Request, res: Response) => {
    const status = await this.healthService.getDatabaseStatus();

    res.json(status);
  };
}
