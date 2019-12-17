
export interface ISetOptions {
  expire?: number;
}

export interface IOptions {
  prefix?: string;
}

export interface IObj {
  [anyProp: string]: any;
}

export interface IJSONCache {
  set(key: string, obj: IObj, options: ISetOptions): Promise<any>;
  get(key: string, ...fields: string[]): Promise<IObj|undefined>;
  rewrite(key: string, obj: IObj): Promise<any>;
  clearAll(): Promise<any>;
}
