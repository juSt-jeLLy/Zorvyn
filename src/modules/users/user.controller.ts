import { asyncHandler } from "../../core/async-handler";
import { buildExecutionContext } from "../../shared/request-context";
import type { UserService } from "./user.service";
import { userIdParamSchema, userListQuerySchema } from "./user.validation";

export class UserController {
  constructor(private readonly userService: UserService) {}

  createUser = asyncHandler(async (req, res) => {
    const createdUser = await this.userService.createUser(req.body, buildExecutionContext(req));
    res.status(201).json({ data: createdUser });
  });

  listUsers = asyncHandler(async (req, res) => {
    const query = userListQuerySchema.parse(req.query);
    const { items, total } = await this.userService.listUsers(query, buildExecutionContext(req));
    res.status(200).json({
      data: items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
      },
    });
  });

  getUserById = asyncHandler(async (req, res) => {
    const params = userIdParamSchema.parse(req.params);
    const user = await this.userService.getUserById(params.userId, buildExecutionContext(req));
    res.status(200).json({ data: user });
  });

  updateUser = asyncHandler(async (req, res) => {
    const params = userIdParamSchema.parse(req.params);
    const updatedUser = await this.userService.updateUser(params.userId, req.body, buildExecutionContext(req));
    res.status(200).json({ data: updatedUser });
  });
}
