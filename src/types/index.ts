export interface Response<T = any> {
  ok: boolean;
  message?: string;
  data?: T;
  error?: string;
  status?: number;
  code?: string | number;
  [key: string]: any; // catch-all for additional backend fields
}

export type PromiseRawDocument = Promise<Response<Record<string, any>>>;

export interface ApiRequestProps<
  TPayload,
  TAction extends (payload: TPayload) => Promise<any>,
> {
  payload: TPayload;
  action: TAction | null;
  prepareOptions?: PrepareOpts;
  responseOptions?: ResponseOpts;
  timeoutMs?: number;
}

export interface OnSuccess<TData = any, TPayload = any> {
  response: Response<TData>;
  payload: TPayload;
}

export type OnInspect<TData = any, TPayload = any> = (args: {
  response: Response<TData>;
  payload: TPayload;
}) => any;

export interface OnData<TData = any, TPayload = any> {
  data: NonNullable<TData>;
  payload: TPayload;
  cancel: () => void;
}

export interface OnPayload<TPayload = any> {
  payload: TPayload;
  cancel: () => void;
}

export interface OnError {
  response: Response;
  cancel: () => void;
}

export type OnErrorMsg = (args: { err: string; cancel: () => void }) => any;

export interface OnEmptyData<TData = any> {
  response: Response;
  cancel: () => void;
}

export type DataResponse<TData> = Promise<Response<TData>>;

export interface ResponseOpts<TData = any, TPayload = any> {
  onAny?: (data: OnSuccess<TData, TPayload>) => void;
  onSuccess?: (data: OnSuccess<TData, TPayload>) => void;
  onError?: (data: OnError) => void;
  onSuccessMsg?: (msg: string) => void;
  onErrorMsg?: OnErrorMsg;
  onData?: (data: OnData<TData, TPayload>) => void;
  onInvalidData?: () => any;
  onEmptyData?: (data: OnEmptyData<TData>) => any;
  inspect?: OnInspect<TData, TPayload>;
  fallback?: TData;
  onCleanup?: () => void;
  onCancel?: () => void;
  onTimeout?: () => void;
  raw?: (r: any) => void;
}

export interface PrepareOpts<TPayload = any> {
  onPayload?: (data: OnPayload<TPayload>) => void;
  onPrepare?: () => Promise<boolean>;
}

// 🧠 Explicitly define the shape of the API chain with generics
export type ApiChain<TPayload, TData> = {
  payload: (
    callback: (data: OnPayload<TPayload>) => void,
  ) => ApiChain<TPayload, TData>;
  onSuccessMsg: (callback: (msg: string) => void) => ApiChain<TPayload, TData>;
  onAny: (
    callback: (data: OnSuccess<TData, TPayload>) => any,
  ) => ApiChain<TPayload, TData>;
  onSuccess: (
    callback: (data: OnSuccess<TData, TPayload>) => any,
  ) => ApiChain<TPayload, TData>;
  onError: (callback: (data: OnError) => any) => ApiChain<TPayload, TData>;

  onData: (
    callback: (data: OnData<TData, TPayload>) => void,
  ) => ApiChain<TPayload, TData>;
  onEmptyData: (
    callback: (data: OnEmptyData<TData>) => any,
  ) => ApiChain<TPayload, TData>;
  onInvalidData: (fallback: any) => ApiChain<TPayload, TData>;
  onCleanup: (callback: () => void) => ApiChain<TPayload, TData>;
  onCancel: (callback: () => void) => ApiChain<TPayload, TData>;
  onTimeout: (callback: () => void) => ApiChain<TPayload, TData>;
  onPrepare: (callback: () => Promise<boolean>) => ApiChain<TPayload, TData>;
  fallback: (value: any) => ApiChain<TPayload, TData>;
  inspect: (callback: OnInspect<TData, TPayload>) => ApiChain<TPayload, TData>;
  onErrorMsg: (callback: OnErrorMsg) => ApiChain<TPayload, TData>;

  toJSON: () => string;
  timeout: (ms: number) => ApiChain<TPayload, TData>;
  run: () => Promise<Response<TData> | undefined>;
  on: <K extends keyof OnMethodKeyMap>(
    key: K,
    handler: NonNullable<ResponseOpts<TData, TPayload>[OnMethodKeyMap[K]]>,
  ) => ApiChain<TPayload, TData>;
};

export type OnMethodKeyMap = {
  any: "onAny";
  success: "onSuccess";
  successMsg: "onSuccessMsg";
  error: "onError";
  errorMsg: "onErrorMsg";
  data: "onData";
  emptyData: "onEmptyData";
  invalidData: "onInvalidData";
  cleanup: "onCleanup";
  fallback: "fallback";
  inspect: "inspect";
  cancel: "onCancel";
  timeout: "onTimeout";
};

export type OperationName = string;

export type Operation<OpName extends OperationName, Payload> = (
  pl: Payload,
) => Promise<any>;
