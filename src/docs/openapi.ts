export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Finance Dashboard Backend API",
    version: "1.0.0",
    description: "RBAC-protected backend for finance records and dashboard analytics",
  },
  servers: [
    {
      url: "/api/v1",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
      },
    },
    "/auth/login": {
      post: {
        summary: "Login and receive JWT",
      },
    },
    "/users": {
      get: {
        summary: "List users (ADMIN)",
      },
      post: {
        summary: "Create user (ADMIN)",
      },
    },
    "/records": {
      get: {
        summary: "List financial records (ADMIN, ANALYST)",
      },
      post: {
        summary: "Create financial record (ADMIN)",
      },
    },
    "/dashboard/summary": {
      get: {
        summary: "Dashboard summary (ADMIN, ANALYST, VIEWER)",
      },
    },
    "/dashboard/trend": {
      get: {
        summary: "Dashboard trend (ADMIN, ANALYST, VIEWER)",
      },
    },
  },
};
