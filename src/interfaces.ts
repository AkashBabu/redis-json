

/**
 * @hidden
 */
export interface IObj<T = any> {
  [anyProp: string]: T;
}

/**
 * @hidden
 */
export interface IResult {
  data: IObj<string>;
  typeInfo: IObj<string>;
  arrayInfo: IObj<boolean>;
}

/**
 * @hidden
 */
export type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends any[] ? Array<RecursivePartial<T[P]>>
    : T[P] extends any ? RecursivePartial<T[P]>
    : T[P];
};