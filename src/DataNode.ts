import { DataNodeValueReference, DataNodeValueLocal } from "./DataNodeValue";
import path from "path";

type DataNodeValue = DataNodeValueReference | DataNodeValueLocal<string>;

import Node, { NodeOptions } from "./Node";

export type DataNodeOptions = NodeOptions<DataNodeValue>;

export class DataNode extends Node<DataNodeValue> {
  constructor(options: DataNodeOptions) {
    super(options);
  }

  get fileLocation(): string {
    return `${this.uuid}.json`;
  }

  get url(): string {
    return path.posix.join(this.baseUrl, this.fileLocation);
  }

  toJson(): string {
    return JSON.stringify(this);
  }

  static fromJson(json: string): DataNode {
    const parsed = JSON.parse(json);
    return new DataNode({
      ...parsed,
    });
  }
}

export default DataNode;
export type { DataNodeValue };
