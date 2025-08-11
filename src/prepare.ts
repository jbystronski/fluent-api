import { type PrepareOpts } from "./types";

export const parsePrepare = async <TPayload = any>(
  payload: TPayload,
  opts?: PrepareOpts<TPayload>
) => {
  if (!opts) return true;

  if (opts.onPayload) {
    opts.onPayload({ payload, cancel: () => {} });
  }

  if (opts.onPrepare) {
    const res = await opts.onPrepare();

    if (!res) {
      return false;
    }
  }

  return true;
};
