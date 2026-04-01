import { asyncHandler } from "../../core/async-handler";
import { buildExecutionContext } from "../../shared/request-context";
import type { FinancialRecordService } from "./financial-record.service";
import { listFinancialRecordQuerySchema, recordIdParamSchema } from "./financial-record.validation";

export class FinancialRecordController {
  constructor(private readonly financialRecordService: FinancialRecordService) {}

  createRecord = asyncHandler(async (req, res) => {
    const createdRecord = await this.financialRecordService.createRecord(req.body, buildExecutionContext(req));
    res.status(201).json({ data: createdRecord });
  });

  listRecords = asyncHandler(async (req, res) => {
    const query = listFinancialRecordQuerySchema.parse(req.query);
    const { items, total } = await this.financialRecordService.listRecords(query, buildExecutionContext(req));
    res.status(200).json({
      data: items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
      },
    });
  });

  getRecordById = asyncHandler(async (req, res) => {
    const recordId = recordIdParamSchema.parse(req.params).recordId;
    const record = await this.financialRecordService.getRecordById(recordId, buildExecutionContext(req));
    res.status(200).json({ data: record });
  });

  updateRecord = asyncHandler(async (req, res) => {
    const recordId = recordIdParamSchema.parse(req.params).recordId;
    const updatedRecord = await this.financialRecordService.updateRecord(
      recordId,
      req.body,
      buildExecutionContext(req),
    );
    res.status(200).json({ data: updatedRecord });
  });

  deleteRecord = asyncHandler(async (req, res) => {
    const recordId = recordIdParamSchema.parse(req.params).recordId;
    await this.financialRecordService.deleteRecord(recordId, buildExecutionContext(req));
    res.status(204).send();
  });
}
