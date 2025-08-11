import { type Response } from "./types";

export function createResponse<TData = any>(raw: any): Response<TData> {
  // Handle native Error
  if (raw instanceof Error) {
    return {
      ok: false,
      message: raw.message || "Unexpected error",
      error: raw.stack || String(raw),
    };
  }

  // Handle unexpected values (null, string, number, etc.)
  if (raw === null || typeof raw !== "object") {
    return {
      ok: true,
      message: "Success",
      data: raw,
    };
  }

  // Try to infer structure
  const {
    ok = raw.success ?? raw.status === 200 ?? true,
    message = raw.message ?? "Success",
    data = raw.data,
    error = raw.error,
    status = raw.status,
    code = raw.code,
    ...rest
  } = raw;

  return {
    ok: Boolean(ok),
    message,
    data: data as TData,
    error,
    status,
    code,
    ...rest,
  };
}
