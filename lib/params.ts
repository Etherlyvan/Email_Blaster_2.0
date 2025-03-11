// lib/params.ts
export function getParam<T extends string>(params: Record<T, string>, param: T): string {
    return params[param];
  }
  