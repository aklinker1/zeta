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

export class TooEarlyError extends HttpError {
  constructor(
    message: string = "TooEarly",
    additionalInfo?: Record<string, any>,
    options?: ErrorOptions,
  ) {
    super(Status.TooEarly, message, additionalInfo, options);
    this.name = "TooEarlyError";
  }
}

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
