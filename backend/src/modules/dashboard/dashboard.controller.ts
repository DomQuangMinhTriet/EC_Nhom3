import type { Request, Response } from "express";
import { parseDateQuery } from "../../shared/http/requestParsers";
import { DashboardService } from "./dashboard.service";

export class DashboardController {
  constructor(private readonly dashboardService = new DashboardService()) {}

  getSummary = async (req: Request, res: Response) => {
    const from = parseDateQuery(req.query.from, "from");
    const to = parseDateQuery(req.query.to, "to", true);

    res.json({ data: await this.dashboardService.getSummary({ from, to }) });
  };
}
