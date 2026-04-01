import { asyncHandler } from "../../core/async-handler";
import { buildExecutionContext } from "../../shared/request-context";
import type { AuthService } from "./auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = asyncHandler(async (req, res) => {
    const loginResult = await this.authService.login(req.body, buildExecutionContext(req));
    res.status(200).json({ data: loginResult });
  });
}
