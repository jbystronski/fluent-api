import { parsePrepare } from "./prepare";
import { parseResponse } from "./response";
import type {
  OperationName,
  Operation,
  Response,
  ApiRequestProps,
  ResponseOpts,
  PrepareOpts,
  ApiChain,
} from "./types";

export function createApiBuilder<
  OpName extends OperationName,
  OpMap extends Record<OpName, Operation<OpName, any>>,
>(opMap: OpMap) {
  return function apiBuilder<Name extends OpName>(name: Name) {
    const action = opMap[name];
    type TAction = typeof action;
    type TPayload = Parameters<TAction>[0];
    type TData =
      Awaited<ReturnType<TAction>> extends Response<infer R> ? R : never;

    const setResponseOption = <K extends keyof ResponseOpts<TData, TPayload>>(
      key: K,
      value: ResponseOpts<TData, TPayload>[K]
    ) => {
      pd.responseOptions ??= {};
      pd.responseOptions[key] = value;
      return chain;
    };

    const pd: ApiRequestProps<TPayload, TAction> & {
      responseOptions?: ResponseOpts<TData, TPayload>;
      prepareOptions?: PrepareOpts<TPayload>;
      timeoutMs?: number;
    } = {
      payload: {} as TPayload,
      action,
    };

    const builder = {} as ApiChain<TPayload, TData> & {
      p: (opts: TPayload) => typeof builder;
      timeout: (ms: number) => typeof builder;
    };

    const chain: ApiChain<TPayload, TData> = {
      payload: (callback) => {
        pd.prepareOptions ??= {};
        pd.prepareOptions.onPayload = callback;
        return builder;
      },
      onPrepare: (callback) => {
        pd.prepareOptions ??= {};
        pd.prepareOptions.onPrepare = callback;
        return builder;
      },

      onAny: (callback) => setResponseOption("onAny", callback),
      onSuccess: (callback) => setResponseOption("onSuccess", callback),
      onSuccessMsg: (callback) => setResponseOption("onSuccessMsg", callback),
      onError: (callback) => setResponseOption("onError", callback),
      onErrorMsg: (callback) => setResponseOption("onErrorMsg", callback),
      onData: (callback) => setResponseOption("onData", callback),
      onEmptyData: (callback) => setResponseOption("onEmptyData", callback),
      onInvalidData: (fallback) => setResponseOption("onInvalidData", fallback),
      onCleanup: (callback) => setResponseOption("onCleanup", callback),
      onCancel: (callback) => setResponseOption("onCancel", callback),
      fallback: (callback) => setResponseOption("fallback", callback),
      inspect: (callback) => setResponseOption("inspect", callback),
      onTimeout: (callback) => setResponseOption("onTimeout", callback),
      toJSON: () => JSON.stringify(pd, null, 2),
      on: (key, handler) => {
        const keyMap: Record<string, string> = {
          any: "onAny",
          success: "onSuccess",
          successMsg: "onSuccessMsg",
          error: "onError",
          errorMsg: "onErrorMsg",
          data: "onData",
          emptyData: "onEmptyData",
          invalidData: "onInvalidData",
          cleanup: "onCleanup",
          fallback: "fallback",
          inspect: "inspect",
          cancel: "onCancel",
          timeout: "onTimeout",
        };

        const method = keyMap[key];
        if (!method) throw new Error(`Unknown response hook: '${key}'`);

        const fn = chain[method as keyof typeof chain];
        if (typeof fn === "function") {
          // @ts-expect-error handler is matched by mapped type above
          fn(handler);
        } else {
          throw new Error(`Invalid response method: '${method}'`);
        }

        return builder;
      },

      timeout: (ms: number) => {
        pd.timeoutMs = ms;
        return builder;
      },
      run: async ({ timeoutMs }: { timeoutMs?: number } = {}) => {
        if (pd.prepareOptions) {
          const ok = await parsePrepare<TPayload>(
            pd.payload,
            pd.prepareOptions
          );
          if (!ok) return;
        }

        if (!pd.action) throw new Error("Missing 'action' argument");

        let cancelled = false;
        const cancel = () => {
          cancelled = true;
        };

        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        if (pd.timeoutMs) {
          timeoutId = setTimeout(() => {
            pd.responseOptions?.onTimeout?.();
            cancel();
          }, pd.timeoutMs);
        }

        const res = await pd.action(pd.payload);

        if (timeoutId) clearTimeout(timeoutId);

        return parseResponse<TData, TPayload>(
          res,
          pd.payload,
          () => cancelled,
          cancel,
          pd.responseOptions
        );
      },
    };

    Object.assign(builder, chain, {
      p: (opts: TPayload) => {
        pd.payload = opts;
        return builder;
      },
    });

    return builder;
  };
}
