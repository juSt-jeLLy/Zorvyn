import { logger } from "./logging/logger";
import { getDatabase } from "./infrastructure/database/sqlite-client";
import { AuthController } from "./modules/auth/auth.controller";
import { createAuthGuards, type AuthGuards } from "./modules/auth/auth.middleware";
import { AuthService } from "./modules/auth/auth.service";
import { TokenService } from "./modules/auth/token.service";
import { DashboardController } from "./modules/dashboard/dashboard.controller";
import { DashboardService } from "./modules/dashboard/dashboard.service";
import { FinancialRecordController } from "./modules/financial-records/financial-record.controller";
import { SqliteFinancialRecordRepository } from "./modules/financial-records/financial-record.repository";
import { FinancialRecordService } from "./modules/financial-records/financial-record.service";
import { UserController } from "./modules/users/user.controller";
import { SqliteUserRepository } from "./modules/users/user.repository";
import { UserService } from "./modules/users/user.service";

export interface AppContainer {
  authController: AuthController;
  userController: UserController;
  financialRecordController: FinancialRecordController;
  dashboardController: DashboardController;
  authGuards: AuthGuards;
}

// Dependency Injection pattern: all dependencies are assembled once and injected into modules.
export const createContainer = async (): Promise<AppContainer> => {
  const database = await getDatabase();

  const userRepository = new SqliteUserRepository(database);
  const financialRecordRepository = new SqliteFinancialRecordRepository(database);

  const userService = new UserService(userRepository, logger);
  const tokenService = new TokenService(logger);
  const authService = new AuthService(userService, tokenService, logger);
  const financialRecordService = new FinancialRecordService(financialRecordRepository, logger);
  const dashboardService = new DashboardService(financialRecordRepository, logger);

  const authGuards = createAuthGuards(authService, userService);

  return {
    authController: new AuthController(authService),
    userController: new UserController(userService),
    financialRecordController: new FinancialRecordController(financialRecordService),
    dashboardController: new DashboardController(dashboardService),
    authGuards,
  };
};
