import { DataNode, DataNodeValue } from "./DataNode";
import { DataStore } from "./FileDataStore";

interface DataNodeManagerOptions {
  baseUrl: string;
  store: DataStore;
}

interface DeleteOptions {
  parentUuid?: string;
}

export class DataNodeManager {
  private baseUrl: string;
  private store: DataStore;

  constructor(options: DataNodeManagerOptions) {
    this.baseUrl = options.baseUrl;
    this.store = options.store;
  }

  get url(): string {
    return this.baseUrl;
  }

  private getUrlFromUuid(uuid: string): string {
    return `${this.baseUrl}/${uuid}.json`;
  }

  private getUuidFromUrl(url: string): string {
    return url.split("/").pop()?.replace(".json", "") || "";
  }

  async create(value: DataNodeValue): Promise<DataNode> {
    const node = new DataNode({ value });
    await this.store.save(node);
    return node;
  }

  async read(uuid: string): Promise<DataNode> {
    const node = await this.store.read(uuid);
    if (!node) {
      throw new Error(`Node not found with uuid: ${uuid}`);
    }
    return node;
  }

  async update(node: DataNode): Promise<void> {
    await this.store.save(node);
  }

  async delete(uuid: string, options?: DeleteOptions): Promise<void> {
    if (options?.parentUuid) {
      const parentNode = await this.read(options.parentUuid);
      const nodeToDelete = await this.read(uuid);
      parentNode.next = nodeToDelete.next;
      await this.update(parentNode);
    }

    await this.store.delete(uuid);
  }

  async moveUp(uuid: string, parentUuid: string): Promise<void> {
    const [node, parentNode] = await Promise.all([
      this.read(uuid),
      this.read(parentUuid),
    ]);

    const nodeNext = node.next;

    parentNode.next = nodeNext;
    node.next = this.getUrlFromUuid(parentUuid);

    await Promise.all([this.update(node), this.update(parentNode)]);
  }

  async moveDown(uuid: string): Promise<void> {
    const node = await this.read(uuid);
    if (!node.next) return;

    const nextUuid = this.getUuidFromUrl(node.next);
    const [currentNode, nextNode] = await Promise.all([
      this.read(uuid),
      this.read(nextUuid),
    ]);

    const nextNodeNext = nextNode.next;

    // Swap positions
    nextNode.next = this.getUrlFromUuid(uuid);
    currentNode.next = nextNodeNext;

    await Promise.all([this.update(currentNode), this.update(nextNode)]);
  }

  async indent(uuid: string, parentUuid: string): Promise<void> {
    const [node, parentNode] = await Promise.all([
      this.read(uuid),
      this.read(parentUuid),
    ]);

    const nodeNext = node.next;

    parentNode.child = this.getUrlFromUuid(uuid);
    parentNode.next = nodeNext;
    node.next = null;

    await Promise.all([this.update(node), this.update(parentNode)]);
  }

  async unIndent(uuid: string, parentUuid: string): Promise<void> {
    const [node, parentNode] = await Promise.all([
      this.read(uuid),
      this.read(parentUuid),
    ]);

    // Store parent's next before changing
    const parentNext = parentNode.next;

    // Move node from child to next chain
    parentNode.child = null;
    parentNode.next = this.getUrlFromUuid(uuid);
    node.next = parentNext;

    await Promise.all([this.update(node), this.update(parentNode)]);
  }

  async add(
    value: DataNodeValue,
    parentUuid: string,
    asChild: boolean = false
  ): Promise<DataNode> {
    // Create the new node
    const node = new DataNode({ value });
    await this.store.save(node);

    // Get the parent node and update its references
    const parentNode = await this.read(parentUuid);
    if (asChild) {
      parentNode.child = this.getUrlFromUuid(node.value.meta.uuid);
    } else {
      // If adding as next, preserve the existing chain
      node.next = parentNode.next;
      parentNode.next = this.getUrlFromUuid(node.value.meta.uuid);
    }
    await this.store.save(parentNode);

    return node;
  }
}

export default DataNodeManager;
export type { DataNodeManagerOptions };
