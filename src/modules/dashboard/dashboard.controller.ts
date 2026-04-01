import { asyncHandler } from "../../core/async-handler";
import { buildExecutionContext } from "../../shared/request-context";
import type { DashboardService } from "./dashboard.service";
import { dashboardSummaryQuerySchema, dashboardTrendQuerySchema } from "./dashboard.validation";

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  getSummary = asyncHandler(async (req, res) => {
    const query = dashboardSummaryQuerySchema.parse(req.query);
    const summary = await this.dashboardService.getSummary(query, buildExecutionContext(req));
    res.status(200).json({ data: summary });
  });

  getTrend = asyncHandler(async (req, res) => {
    const query = dashboardTrendQuerySchema.parse(req.query);
    const trend = await this.dashboardService.getTrends(query, buildExecutionContext(req));
    res.status(200).json({ data: trend });
  });
}
