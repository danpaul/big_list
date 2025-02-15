interface Meta {
  createdAt: Date;
  title: string;
  uuid: string;
  baseUrl: string;
}

interface DataNodeValue {
  meta: Meta;
  body:
    | DataNodeBodyValueText
    | DataNodeBodyValueLink
    | DataNodeBodyValueReference;
}

interface DataNodeBodyValueBase {
  type: "text" | "link" | "reference";
}

interface DataNodeBodyValueText extends DataNodeBodyValueBase {
  type: "text";
  data: { text: string };
}

interface DataNodeBodyValueLink extends DataNodeBodyValueBase {
  type: "link";
  data: { href: string };
}

interface DataNodeBodyValueReference extends DataNodeBodyValueBase {
  type: "reference";
  data: { href: string };
}

import Node, { NodeOptions } from "./Node";

export type DataNodeOptions = NodeOptions<DataNodeValue>;

export class DataNode extends Node<DataNodeValue> {
  constructor(options: DataNodeOptions) {
    super(options);
  }

  get fileLocation(): string {
    return `${this.value.meta.uuid}.json`;
  }

  get url(): string {
    return `${this.value.meta.baseUrl}/${this.fileLocation}`;
  }

  toJson(): string {
    const output = {
      value: this.value,
      next: this.next,
      child: this.child,
    };

    return JSON.stringify(output, null, 2);
  }

  static fromJson(json: string): DataNode {
    const parsed = JSON.parse(json);
    return new DataNode({
      ...parsed,
    });
  }
}

export default DataNode;
export type {
  Meta,
  DataNodeValue,
  DataNodeBodyValueBase,
  DataNodeBodyValueText,
  DataNodeBodyValueLink,
  DataNodeBodyValueReference,
};
