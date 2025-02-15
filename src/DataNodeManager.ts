import { promises as fs } from "fs";
import path from "path";
import { DataNode, DataNodeValue } from "./DataNode";

interface DataNodeManagerOptions {
  baseUrl: string;
  baseDir: string;
}

interface DeleteOptions {
  parentUuid?: string;
}

export class DataNodeManager {
  private baseUrl: string;
  private baseDir: string;

  constructor(options: DataNodeManagerOptions) {
    this.baseUrl = options.baseUrl;
    this.baseDir = options.baseDir;
  }

  get url(): string {
    return this.baseUrl;
  }

  get directory(): string {
    return this.baseDir;
  }

  private getFilePath(uuid: string): string {
    return path.join(this.baseDir, `${uuid}.json`);
  }

  private getUrlFromUuid(uuid: string): string {
    return `${this.baseUrl}/${uuid}.json`;
  }

  private getUuidFromUrl(url: string): string {
    return url.split("/").pop()?.replace(".json", "") || "";
  }

  async create(value: DataNodeValue): Promise<DataNode> {
    const node = new DataNode({ value });
    await this.save(node);
    return node;
  }

  async read(uuid: string): Promise<DataNode> {
    const filePath = this.getFilePath(uuid);
    const content = await fs.readFile(filePath, "utf-8");
    return DataNode.fromJson(content);
  }

  async update(node: DataNode): Promise<void> {
    await this.save(node);
  }

  async delete(uuid: string, options?: DeleteOptions): Promise<void> {
    if (options?.parentUuid) {
      const parentNode = await this.read(options.parentUuid);
      const nodeToDelete = await this.read(uuid);
      parentNode.next = nodeToDelete.next;
      await this.update(parentNode);
    }

    const filePath = this.getFilePath(uuid);
    await fs.unlink(filePath);
  }

  private async save(node: DataNode): Promise<void> {
    const filePath = this.getFilePath(node.value.meta.uuid);
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(filePath, node.toJson());
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
}

export default DataNodeManager;
export type { DataNodeManagerOptions };
