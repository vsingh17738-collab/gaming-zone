export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "BAD_REQUEST",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ConfigurationError extends AppError {
  constructor(feature: string) {
    super(`${feature} is not configured`, 503, "NOT_CONFIGURED");
    this.name = "ConfigurationError";
  }
}
