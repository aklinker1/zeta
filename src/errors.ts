/**
 * Error classes that can be used by the server. Do not import this module in client code.
 * @module
 */
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { Status } from "./status";

export class ValidationError extends Error {
  constructor(
    readonly input: any,
    readonly issues: ReadonlyArray<StandardSchemaV1.Issue>,
  ) {
    super("Validation error");
    this.name = "ValidationError";
  }
}

/**
 * Base class of all HTTP errors. You can throw this error or throw any of the
 * subclasses. Zeta will automatically detect and handle these errors, setting
 * the appropriate status code and message.
 *
 * Error responses will include the stacktrace during development. To hide the
 * stacktrace in production, set the `NODE_ENV` environment variable to
 * `production`.
 *
 * @example
 * ```ts
 * throw new HttpError(Status.BadRequest, "Bad request")
 * // OR
 * throw new BadRequestError()
 * ```
 */
export class HttpError extends Error {
  constructor(
    readonly status: Status,
    message: string,
    readonly additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "HttpError";
  }
}

/** Shorthand for `new HttpError(Status.BadRequest, "Bad Request", ...)` */
export class BadRequestError extends HttpError {
  constructor(
    message: string = "Bad Request",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.BadRequest, message, additionalInfo, options);
    this.name = "BadRequestError";
  }
}

/** Shorthand for `new HttpError(Status.Unauthorized, "Unauthorized", ...)` */
export class UnauthorizedError extends HttpError {
  constructor(
    message: string = "Unauthorized",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.Unauthorized, message, additionalInfo, options);
    this.name = "UnauthorizedError";
  }
}

/** Shorthand for `new HttpError(Status.PaymentRequired, "Payment Required", ...)` */
export class PaymentRequiredError extends HttpError {
  constructor(
    message: string = "Payment Required",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.PaymentRequired, message, additionalInfo, options);
    this.name = "PaymentRequiredError";
  }
}

/** Shorthand for `new HttpError(Status.Forbidden, "Forbidden", ...)` */
export class ForbiddenError extends HttpError {
  constructor(
    message: string = "Forbidden",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.Forbidden, message, additionalInfo, options);
    this.name = "ForbiddenError";
  }
}

/** Shorthand for `new HttpError(Status.NotFound, "Not Found", ...)` */
export class NotFoundError extends HttpError {
  constructor(
    message: string = "Not Found",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.NotFound, message, additionalInfo, options);
    this.name = "NotFoundError";
  }
}

/** Shorthand for `new HttpError(Status.MethodNotAllowed, "Method Not Allowed", ...)` */
export class MethodNotAllowedError extends HttpError {
  constructor(
    message: string = "Method Not Allowed",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.MethodNotAllowed, message, additionalInfo, options);
    this.name = "MethodNotAllowedError";
  }
}

/** Shorthand for `new HttpError(Status.NotAcceptable, "Not Acceptable", ...)` */
export class NotAcceptableError extends HttpError {
  constructor(
    message: string = "Not Acceptable",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.NotAcceptable, message, additionalInfo, options);
    this.name = "NotAcceptableError";
  }
}

/** Shorthand for `new HttpError(Status.ProxyAuthenticationRequired, "Proxy Authentication Required", ...)` */
export class ProxyAuthenticationRequiredError extends HttpError {
  constructor(
    message: string = "Proxy Authentication Required",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.ProxyAuthenticationRequired, message, additionalInfo, options);
    this.name = "ProxyAuthenticationRequiredError";
  }
}

/** Shorthand for `new HttpError(Status.RequestTimeout, "Request Timeout", ...)` */
export class RequestTimeoutError extends HttpError {
  constructor(
    message: string = "Request Timeout",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.RequestTimeout, message, additionalInfo, options);
    this.name = "RequestTimeoutError";
  }
}

/** Shorthand for `new HttpError(Status.Conflict, "Conflict", ...)` */
export class ConflictError extends HttpError {
  constructor(
    message: string = "Conflict",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.Conflict, message, additionalInfo, options);
    this.name = "ConflictError";
  }
}

/** Shorthand for `new HttpError(Status.Gone, "Gone", ...)` */
export class GoneError extends HttpError {
  constructor(
    message: string = "Gone",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.Gone, message, additionalInfo, options);
    this.name = "GoneError";
  }
}

/** Shorthand for `new HttpError(Status.LengthRequired, "Length Required", ...)` */
export class LengthRequiredError extends HttpError {
  constructor(
    message: string = "Length Required",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.LengthRequired, message, additionalInfo, options);
    this.name = "LengthRequiredError";
  }
}

/** Shorthand for `new HttpError(Status.PreconditionFailed, "Precondition Failed", ...)` */
export class PreconditionFailedError extends HttpError {
  constructor(
    message: string = "Precondition Failed",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.PreconditionFailed, message, additionalInfo, options);
    this.name = "PreconditionFailedError";
  }
}

/** Shorthand for `new HttpError(Status.ContentTooLarge, "Content Too Large", ...)` */
export class ContentTooLargeError extends HttpError {
  constructor(
    message: string = "Content Too Large",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.ContentTooLarge, message, additionalInfo, options);
    this.name = "ContentTooLargeError";
  }
}

/** Shorthand for `new HttpError(Status.UriTooLong, "URI Too Long", ...)` */
export class UriTooLongError extends HttpError {
  constructor(
    message: string = "URI Too Long",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.UriTooLong, message, additionalInfo, options);
    this.name = "UriTooLongError";
  }
}

/** Shorthand for `new HttpError(Status.UnsupportedMediaType, "Unsupported Media Type", ...)` */
export class UnsupportedMediaTypeError extends HttpError {
  constructor(
    message: string = "Unsupported Media Type",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.UnsupportedMediaType, message, additionalInfo, options);
    this.name = "UnsupportedMediaTypeError";
  }
}

/** Shorthand for `new HttpError(Status.RangeNotSatisfiable, "Range Not Satisfiable", ...)` */
export class RangeNotSatisfiableError extends HttpError {
  constructor(
    message: string = "Range Not Satisfiable",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.RangeNotSatisfiable, message, additionalInfo, options);
    this.name = "RangeNotSatisfiableError";
  }
}

/** Shorthand for `new HttpError(Status.ExpectationFailed, "Expectation Failed", ...)` */
export class ExpectationFailedError extends HttpError {
  constructor(
    message: string = "Expectation Failed",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.ExpectationFailed, message, additionalInfo, options);
    this.name = "ExpectationFailedError";
  }
}

/** Shorthand for `new HttpError(Status.ImATeapot, "I'm a Teapot", ...)` */
export class ImATeapotError extends HttpError {
  constructor(
    message: string = "I'm a Teapot",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.ImATeapot, message, additionalInfo, options);
    this.name = "ImATeapotError";
  }
}

/** Shorthand for `new HttpError(Status.MisdirectedRequest, "Misdirected Request", ...)` */
export class MisdirectedRequestError extends HttpError {
  constructor(
    message: string = "Misdirected Request",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.MisdirectedRequest, message, additionalInfo, options);
    this.name = "MisdirectedRequestError";
  }
}

/** Shorthand for `new HttpError(Status.UnprocessableEntity, "Unprocessable Entity", ...)` */
export class UnprocessableEntityError extends HttpError {
  constructor(
    message: string = "Unprocessable Entity",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.UnprocessableEntity, message, additionalInfo, options);
    this.name = "UnprocessableEntityError";
  }
}

/** Shorthand for `new HttpError(Status.Locked, "Locked", ...)` */
export class LockedError extends HttpError {
  constructor(
    message: string = "Locked",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.Locked, message, additionalInfo, options);
    this.name = "LockedError";
  }
}

/** Shorthand for `new HttpError(Status.FailedDependency, "Failed Dependency", ...)` */
export class FailedDependencyError extends HttpError {
  constructor(
    message: string = "Failed Dependency",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.FailedDependency, message, additionalInfo, options);
    this.name = "FailedDependencyError";
  }
}

/** Shorthand for `new HttpError(Status.TooEarly, "Too Early", ...)` */
export class TooEarlyError extends HttpError {
  constructor(
    message: string = "Too Early",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.TooEarly, message, additionalInfo, options);
    this.name = "TooEarlyError";
  }
}

/** Shorthand for `new HttpError(Status.UpgradeRequired, "Upgrade Required", ...)` */
export class UpgradeRequiredError extends HttpError {
  constructor(
    message: string = "Upgrade Required",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.UpgradeRequired, message, additionalInfo, options);
    this.name = "UpgradeRequiredError";
  }
}

/** Shorthand for `new HttpError(Status.PreconditionRequired, "Precondition Required", ...)` */
export class PreconditionRequiredError extends HttpError {
  constructor(
    message: string = "Precondition Required",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.PreconditionRequired, message, additionalInfo, options);
    this.name = "PreconditionRequiredError";
  }
}

/** Shorthand for `new HttpError(Status.TooManyRequests, "Too Many Requests", ...)` */
export class TooManyRequestsError extends HttpError {
  constructor(
    message: string = "Too Many Requests",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.TooManyRequests, message, additionalInfo, options);
    this.name = "TooManyRequestsError";
  }
}

/** Shorthand for `new HttpError(Status.RequestHeaderFieldsTooLarge, "Request Header Fields Too Large", ...)` */
export class RequestHeaderFieldsTooLargeError extends HttpError {
  constructor(
    message: string = "Request Header Fields Too Large",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.RequestHeaderFieldsTooLarge, message, additionalInfo, options);
    this.name = "RequestHeaderFieldsTooLargeError";
  }
}

/** Shorthand for `new HttpError(Status.UnavailableForLegalReasons, "Unavailable For Legal Reasons", ...)` */
export class UnavailableForLegalReasonsError extends HttpError {
  constructor(
    message: string = "Unavailable For Legal Reasons",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.UnavailableForLegalReasons, message, additionalInfo, options);
    this.name = "UnavailableForLegalReasonsError";
  }
}

/** Shorthand for `new HttpError(Status.InternalServerError, "Internal Server Error", ...)` */
export class InternalServerErrorError extends HttpError {
  constructor(
    message: string = "Internal Server Error",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.InternalServerError, message, additionalInfo, options);
    this.name = "InternalServerErrorError";
  }
}

/** Shorthand for `new HttpError(Status.NotImplemented, "Not Implemented", ...)` */
export class NotImplementedError extends HttpError {
  constructor(
    message: string = "Not Implemented",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.NotImplemented, message, additionalInfo, options);
    this.name = "NotImplementedError";
  }
}

/** Shorthand for `new HttpError(Status.BadGateway, "Bad Gateway", ...)` */
export class BadGatewayError extends HttpError {
  constructor(
    message: string = "Bad Gateway",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.BadGateway, message, additionalInfo, options);
    this.name = "BadGatewayError";
  }
}

/** Shorthand for `new HttpError(Status.ServiceUnavailable, "Service Unavailable", ...)` */
export class ServiceUnavailableError extends HttpError {
  constructor(
    message: string = "Service Unavailable",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.ServiceUnavailable, message, additionalInfo, options);
    this.name = "ServiceUnavailableError";
  }
}

/** Shorthand for `new HttpError(Status.GatewayTimeout, "Gateway Timeout", ...)` */
export class GatewayTimeoutError extends HttpError {
  constructor(
    message: string = "Gateway Timeout",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.GatewayTimeout, message, additionalInfo, options);
    this.name = "GatewayTimeoutError";
  }
}

/** Shorthand for `new HttpError(Status.HttpVersionNotSupported, "HTTP Version Not Supported", ...)` */
export class HttpVersionNotSupportedError extends HttpError {
  constructor(
    message: string = "HTTP Version Not Supported",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.HttpVersionNotSupported, message, additionalInfo, options);
    this.name = "HttpVersionNotSupportedError";
  }
}

/** Shorthand for `new HttpError(Status.VariantAlsoNegotiates, "Variant Also Negotiates", ...)` */
export class VariantAlsoNegotiatesError extends HttpError {
  constructor(
    message: string = "Variant Also Negotiates",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.VariantAlsoNegotiates, message, additionalInfo, options);
    this.name = "VariantAlsoNegotiatesError";
  }
}

/** Shorthand for `new HttpError(Status.InsufficientStorage, "Insufficient Storage", ...)` */
export class InsufficientStorageError extends HttpError {
  constructor(
    message: string = "Insufficient Storage",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.InsufficientStorage, message, additionalInfo, options);
    this.name = "InsufficientStorageError";
  }
}

/** Shorthand for `new HttpError(Status.LoopDetected, "Loop Detected", ...)` */
export class LoopDetectedError extends HttpError {
  constructor(
    message: string = "Loop Detected",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.LoopDetected, message, additionalInfo, options);
    this.name = "LoopDetectedError";
  }
}

/** Shorthand for `new HttpError(Status.NotExtended, "Not Extended", ...)` */
export class NotExtendedError extends HttpError {
  constructor(
    message: string = "Not Extended",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.NotExtended, message, additionalInfo, options);
    this.name = "NotExtendedError";
  }
}

/** Shorthand for `new HttpError(Status.NetworkAuthenticationRequired, "Network Authentication Required", ...)` */
export class NetworkAuthenticationRequiredError extends HttpError {
  constructor(
    message: string = "Network Authentication Required",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(
      Status.NetworkAuthenticationRequired,
      message,
      additionalInfo,
      options,
    );
    this.name = "NetworkAuthenticationRequiredError";
  }
}
