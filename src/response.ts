import { createResponse } from "./create-response";
import type { ResponseOpts, Response } from "./types";

export const parseResponse = <TData = any, TPayload = any>(
  raw: any,
  payload: TPayload,
  isCancelled: () => boolean,
  cancel: () => void,
  opts?: ResponseOpts<TData, TPayload>
): Response<TData> | undefined => {
  if (!opts) return;

  const cancelIfNeeded = (): true | void => {
    if (check()) {
      opts.onCancel?.();
      return true;
    }
  };

  const check = () => isCancelled();

  if (opts.raw) {
    opts.raw(raw);
    if (cancelIfNeeded()) return;
  }

  const r = createResponse<TData>(raw);

  // Handle missing data
  if (!r.data) {
    opts.onEmptyData?.({ cancel, response: r });
    if (cancelIfNeeded()) return;

    if (opts.fallback) {
      r.data = opts.fallback;
    } else if (opts.onInvalidData) {
      r.data = opts.onInvalidData();
    }
  }

  // Handle success
  if (r.ok) {
    opts.onSuccessMsg?.(r.message || "");
    if (cancelIfNeeded()) return;

    opts.onSuccess?.({ response: r, payload });
    if (cancelIfNeeded()) return;

    if (r.data !== null && r.data !== undefined) {
      opts.onData?.({ data: r.data, payload, cancel });
      if (cancelIfNeeded()) return;
    }
  }

  // Handle error
  if (r.error) {
    opts.onErrorMsg?.({ err: r.error, cancel });
    if (cancelIfNeeded()) return;

    opts.onError?.({ response: r, cancel });
    if (cancelIfNeeded()) return;
  }

  opts.onAny?.({ response: r, payload });
  if (cancelIfNeeded()) return;

  // Always inspect
  opts.inspect?.({ response: r, payload });
  if (cancelIfNeeded()) return;

  // Cleanup
  opts.onCleanup?.();

  return r;
};
