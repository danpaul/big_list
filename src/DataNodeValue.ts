class DataNodeValue {}

class DataNodeValueReference extends DataNodeValue {
  readonly type = "reference";
  readonly data: string;

  constructor(data: string) {
    super();
    this.data = data;
  }
}

class DataNodeValueLocal<T> extends DataNodeValue {
  readonly type = "local";
  readonly data: T;

  constructor(data: T) {
    super();
    this.data = data;
  }
}

export { DataNodeValueReference, DataNodeValueLocal };
