export function smartSerialize(value: unknown):
  | {
      contentType: string | undefined;
      value: BodyInit;
    }
  | undefined {
  if (value == null) return undefined;

  switch (typeof value) {
    case "string":
      return { contentType: "text/plain", value };
    case "number":
    case "boolean":
    case "bigint":
      return { contentType: "text/plain", value: String(value) };
  }

  if (value instanceof FormData) {
    return {
      contentType: undefined, // Let fetch set the content type with a boundary
      value,
    };
  }

  if (value instanceof File) {
    const form = new FormData();
    form.append("file", value);
    return {
      contentType: undefined,
      value: form,
    };
  }

  if (typeof FileList !== "undefined" && value instanceof FileList) {
    const form = new FormData();
    for (let i = 0; i < value.length; i++) {
      form.append("files", value.item(i)!);
    }
    return {
      contentType: undefined,
      value: form,
    };
  }

  if (value instanceof Blob) {
    return {
      contentType: value.type,
      value,
    };
  }

  return {
    contentType: "application/json",
    value: JSON.stringify(value),
  };
}

export function smartDeserialize(
  arg: Response | Request,
): Promise<unknown> | undefined {
  if (arg instanceof Request && arg.method === "GET") return;

  const contentType = arg.headers.get("content-type");
  if (contentType == null) return;

  // JSON
  if (contentType.startsWith("application/json")) {
    return arg.json();
  }

  // Forms
  if (
    contentType.startsWith("application/x-www-form-urlencoded") ||
    contentType.startsWith("multipart/form-data")
  ) {
    return arg.formData();
  }

  // Text
  if (contentType.startsWith("text/")) {
    return arg.text();
  }

  // Binary
  if (contentType.startsWith("application/octet-stream")) {
    return arg.arrayBuffer();
  }

  // Unknown
  throw Error(`Unknown content type: "${contentType}"`);
}
