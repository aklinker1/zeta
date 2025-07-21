export function smartSerialize(value: unknown):
  | {
      contentType: string;
      serialized: BodyInit;
    }
  | undefined {
  if (value == null) return undefined;

  if (value instanceof FormData) {
    return {
      contentType: "multipart/form-data",
      serialized: value,
    };
  }

  if (value instanceof Blob) {
    return {
      contentType: value.type,
      serialized: value,
    };
  }

  switch (typeof value) {
    case "number":
    case "boolean":
    case "bigint":
    case "string":
      return { contentType: "text/plain", serialized: String(value) };
    case "object":
      return {
        contentType: "application/json",
        serialized: JSON.stringify(value),
      };
  }

  throw Error(
    "Could not serialize object for request: " + JSON.stringify(value),
  );
}

export async function smartDeserialize(
  arg: Response | Request,
): Promise<unknown> {
  const contentType = arg.headers.get("content-type");
  if (contentType == null) return;

  // JSON
  if (contentType.startsWith("application/json")) {
    return await arg.json();
  }

  // Forms
  if (
    contentType.startsWith("application/x-www-form-urlencoded") ||
    contentType.startsWith("multipart/form-data")
  ) {
    return await arg.formData();
  }

  // Text
  if (contentType.startsWith("text/")) {
    return await arg.text();
  }

  // Binary
  if (contentType.startsWith("application/octet-stream")) {
    return await arg.arrayBuffer();
  }

  // Unknown
  throw Error(`Unknown content type: "${contentType}"`);
}
