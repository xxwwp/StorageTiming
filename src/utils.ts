export function isNull(v: any): v is null {
  return Object.prototype.toString.call(v) === "[object Null]";
}

export function isNumber(v: any): v is number {
  return typeof v === "number" || Object.prototype.toString.call(v) === "[object Number]";
}

export function isString(v: any): v is string {
  return typeof v === "string" || Object.prototype.toString.call(v) === "[object String]";
}

export function isObject(v: any): v is Record<any, any> {
  return Object.prototype.toString.call(v) === "[object Object]";
}

export function isUndefined(v: any): v is undefined {
  return typeof v === "undefined";
}
