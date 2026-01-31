import { HttpStatus } from "./status";

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
 * throw new HttpError(HttpStatus.BadRequest, "Bad request")
 * // OR
 * throw new BadRequestError()
 * ```
 */
export class HttpError extends Error {
  constructor(
    readonly status: HttpStatus,
    message: string,
    readonly additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "HttpError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.BadRequest, "Bad Request", ...)` */
export class BadRequestHttpError extends HttpError {
  constructor(
    message: string = "Bad Request",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.BadRequest, message, additionalInfo, options);
    this.name = "BadRequestError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.Unauthorized, "Unauthorized", ...)` */
export class UnauthorizedHttpError extends HttpError {
  constructor(
    message: string = "Unauthorized",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.Unauthorized, message, additionalInfo, options);
    this.name = "UnauthorizedError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.PaymentRequired, "Payment Required", ...)` */
export class PaymentRequiredHttpError extends HttpError {
  constructor(
    message: string = "Payment Required",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.PaymentRequired, message, additionalInfo, options);
    this.name = "PaymentRequiredError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.Forbidden, "Forbidden", ...)` */
export class ForbiddenHttpError extends HttpError {
  constructor(
    message: string = "Forbidden",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.Forbidden, message, additionalInfo, options);
    this.name = "ForbiddenError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.NotFound, "Not Found", ...)` */
export class NotFoundHttpError extends HttpError {
  constructor(
    message: string = "Not Found",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.NotFound, message, additionalInfo, options);
    this.name = "NotFoundHttpError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.MethodNotAllowed, "Method Not Allowed", ...)` */
export class MethodNotAllowedHttpError extends HttpError {
  constructor(
    message: string = "Method Not Allowed",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.MethodNotAllowed, message, additionalInfo, options);
    this.name = "MethodNotAllowedError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.NotAcceptable, "Not Acceptable", ...)` */
export class NotAcceptableHttpError extends HttpError {
  constructor(
    message: string = "Not Acceptable",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.NotAcceptable, message, additionalInfo, options);
    this.name = "NotAcceptableError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.ProxyAuthenticationRequired, "Proxy Authentication Required", ...)` */
export class ProxyAuthenticationRequiredHttpError extends HttpError {
  constructor(
    message: string = "Proxy Authentication Required",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(
      HttpStatus.ProxyAuthenticationRequired,
      message,
      additionalInfo,
      options,
    );
    this.name = "ProxyAuthenticationRequiredError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.RequestTimeout, "Request Timeout", ...)` */
export class RequestTimeoutHttpError extends HttpError {
  constructor(
    message: string = "Request Timeout",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.RequestTimeout, message, additionalInfo, options);
    this.name = "RequestTimeoutError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.Conflict, "Conflict", ...)` */
export class ConflictHttpError extends HttpError {
  constructor(
    message: string = "Conflict",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.Conflict, message, additionalInfo, options);
    this.name = "ConflictError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.Gone, "Gone", ...)` */
export class GoneHttpError extends HttpError {
  constructor(
    message: string = "Gone",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.Gone, message, additionalInfo, options);
    this.name = "GoneError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.LengthRequired, "Length Required", ...)` */
export class LengthRequiredHttpError extends HttpError {
  constructor(
    message: string = "Length Required",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.LengthRequired, message, additionalInfo, options);
    this.name = "LengthRequiredError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.PreconditionFailed, "Precondition Failed", ...)` */
export class PreconditionFailedHttpError extends HttpError {
  constructor(
    message: string = "Precondition Failed",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.PreconditionFailed, message, additionalInfo, options);
    this.name = "PreconditionFailedError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.ContentTooLarge, "Content Too Large", ...)` */
export class ContentTooLargeHttpError extends HttpError {
  constructor(
    message: string = "Content Too Large",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.ContentTooLarge, message, additionalInfo, options);
    this.name = "ContentTooLargeError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.UriTooLong, "URI Too Long", ...)` */
export class UriTooLongHttpError extends HttpError {
  constructor(
    message: string = "URI Too Long",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.UriTooLong, message, additionalInfo, options);
    this.name = "UriTooLongError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.UnsupportedMediaType, "Unsupported Media Type", ...)` */
export class UnsupportedMediaTypeHttpError extends HttpError {
  constructor(
    message: string = "Unsupported Media Type",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.UnsupportedMediaType, message, additionalInfo, options);
    this.name = "UnsupportedMediaTypeError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.RangeNotSatisfiable, "Range Not Satisfiable", ...)` */
export class RangeNotSatisfiableHttpError extends HttpError {
  constructor(
    message: string = "Range Not Satisfiable",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.RangeNotSatisfiable, message, additionalInfo, options);
    this.name = "RangeNotSatisfiableError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.ExpectationFailed, "Expectation Failed", ...)` */
export class ExpectationFailedHttpError extends HttpError {
  constructor(
    message: string = "Expectation Failed",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.ExpectationFailed, message, additionalInfo, options);
    this.name = "ExpectationFailedError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.ImATeapot, "I'm a Teapot", ...)` */
export class ImATeapotHttpError extends HttpError {
  constructor(
    message: string = "I'm a Teapot",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.ImATeapot, message, additionalInfo, options);
    this.name = "ImATeapotError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.MisdirectedRequest, "Misdirected Request", ...)` */
export class MisdirectedRequestHttpError extends HttpError {
  constructor(
    message: string = "Misdirected Request",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.MisdirectedRequest, message, additionalInfo, options);
    this.name = "MisdirectedRequestError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.UnprocessableEntity, "Unprocessable Entity", ...)` */
export class UnprocessableEntityHttpError extends HttpError {
  constructor(
    message: string = "Unprocessable Entity",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.UnprocessableEntity, message, additionalInfo, options);
    this.name = "UnprocessableEntityError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.Locked, "Locked", ...)` */
export class LockedHttpError extends HttpError {
  constructor(
    message: string = "Locked",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.Locked, message, additionalInfo, options);
    this.name = "LockedError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.FailedDependency, "Failed Dependency", ...)` */
export class FailedDependencyHttpError extends HttpError {
  constructor(
    message: string = "Failed Dependency",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.FailedDependency, message, additionalInfo, options);
    this.name = "FailedDependencyError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.TooEarly, "Too Early", ...)` */
export class TooEarlyHttpError extends HttpError {
  constructor(
    message: string = "Too Early",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.TooEarly, message, additionalInfo, options);
    this.name = "TooEarlyError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.UpgradeRequired, "Upgrade Required", ...)` */
export class UpgradeRequiredHttpError extends HttpError {
  constructor(
    message: string = "Upgrade Required",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.UpgradeRequired, message, additionalInfo, options);
    this.name = "UpgradeRequiredError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.PreconditionRequired, "Precondition Required", ...)` */
export class PreconditionRequiredHttpError extends HttpError {
  constructor(
    message: string = "Precondition Required",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.PreconditionRequired, message, additionalInfo, options);
    this.name = "PreconditionRequiredError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.TooManyRequests, "Too Many Requests", ...)` */
export class TooManyRequestsHttpError extends HttpError {
  constructor(
    message: string = "Too Many Requests",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.TooManyRequests, message, additionalInfo, options);
    this.name = "TooManyRequestsError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.RequestHeaderFieldsTooLarge, "Request Header Fields Too Large", ...)` */
export class RequestHeaderFieldsTooLargeHttpError extends HttpError {
  constructor(
    message: string = "Request Header Fields Too Large",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(
      HttpStatus.RequestHeaderFieldsTooLarge,
      message,
      additionalInfo,
      options,
    );
    this.name = "RequestHeaderFieldsTooLargeError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.UnavailableForLegalReasons, "Unavailable For Legal Reasons", ...)` */
export class UnavailableForLegalReasonsHttpError extends HttpError {
  constructor(
    message: string = "Unavailable For Legal Reasons",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(
      HttpStatus.UnavailableForLegalReasons,
      message,
      additionalInfo,
      options,
    );
    this.name = "UnavailableForLegalReasonsError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.InternalServerError, "Internal Server Error", ...)` */
export class InternalServerErrorHttpError extends HttpError {
  constructor(
    message: string = "Internal Server Error",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.InternalServerError, message, additionalInfo, options);
    this.name = "InternalServerErrorError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.NotImplemented, "Not Implemented", ...)` */
export class NotImplementedHttpError extends HttpError {
  constructor(
    message: string = "Not Implemented",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.NotImplemented, message, additionalInfo, options);
    this.name = "NotImplementedHttpError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.BadGateway, "Bad Gateway", ...)` */
export class BadGatewayHttpError extends HttpError {
  constructor(
    message: string = "Bad Gateway",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.BadGateway, message, additionalInfo, options);
    this.name = "BadGatewayError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.ServiceUnavailable, "Service Unavailable", ...)` */
export class ServiceUnavailableHttpError extends HttpError {
  constructor(
    message: string = "Service Unavailable",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.ServiceUnavailable, message, additionalInfo, options);
    this.name = "ServiceUnavailableError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.GatewayTimeout, "Gateway Timeout", ...)` */
export class GatewayTimeoutHttpError extends HttpError {
  constructor(
    message: string = "Gateway Timeout",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.GatewayTimeout, message, additionalInfo, options);
    this.name = "GatewayTimeoutError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.HttpVersionNotSupported, "HTTP Version Not Supported", ...)` */
export class HttpVersionNotSupportedHttpError extends HttpError {
  constructor(
    message: string = "HTTP Version Not Supported",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.HttpVersionNotSupported, message, additionalInfo, options);
    this.name = "HttpVersionNotSupportedError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.VariantAlsoNegotiates, "Variant Also Negotiates", ...)` */
export class VariantAlsoNegotiatesHttpError extends HttpError {
  constructor(
    message: string = "Variant Also Negotiates",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.VariantAlsoNegotiates, message, additionalInfo, options);
    this.name = "VariantAlsoNegotiatesError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.InsufficientStorage, "Insufficient Storage", ...)` */
export class InsufficientStorageHttpError extends HttpError {
  constructor(
    message: string = "Insufficient Storage",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.InsufficientStorage, message, additionalInfo, options);
    this.name = "InsufficientStorageError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.LoopDetected, "Loop Detected", ...)` */
export class LoopDetectedHttpError extends HttpError {
  constructor(
    message: string = "Loop Detected",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.LoopDetected, message, additionalInfo, options);
    this.name = "LoopDetectedError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.NotExtended, "Not Extended", ...)` */
export class NotExtendedHttpError extends HttpError {
  constructor(
    message: string = "Not Extended",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(HttpStatus.NotExtended, message, additionalInfo, options);
    this.name = "NotExtendedError";
  }
}

/** Shorthand for `new HttpError(HttpStatus.NetworkAuthenticationRequired, "Network Authentication Required", ...)` */
export class NetworkAuthenticationRequiredHttpError extends HttpError {
  constructor(
    message: string = "Network Authentication Required",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(
      HttpStatus.NetworkAuthenticationRequired,
      message,
      additionalInfo,
      options,
    );
    this.name = "NetworkAuthenticationRequiredError";
  }
}
