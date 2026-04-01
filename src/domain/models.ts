export enum Role {
  VIEWER = "VIEWER",
  ANALYST = "ANALYST",
  ADMIN = "ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum RecordType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export interface UserModel {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialRecordModel {
  id: string;
  amountInCents: number;
  type: RecordType;
  category: string;
  occurredOn: Date;
  notes?: string;
  createdByUserId: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
