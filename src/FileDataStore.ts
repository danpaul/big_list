import { promises as fs } from "fs";
import path from "path";
import { DataNode } from "./DataNode";

export interface DataStore {
  save(node: DataNode): Promise<void>;
  read(uuid: string): Promise<DataNode>;
  delete(uuid: string): Promise<void>;
}

export class FileDataStore implements DataStore {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  private getFilePath(uuid: string): string {
    return path.join(this.baseDir, `${uuid}.json`);
  }

  async save(node: DataNode): Promise<void> {
    const filePath = this.getFilePath(node.value.meta.uuid);
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(filePath, node.toJson());
  }

  async read(uuid: string): Promise<DataNode> {
    const filePath = this.getFilePath(uuid);
    const content = await fs.readFile(filePath, "utf-8");
    return DataNode.fromJson(content);
  }

  async delete(uuid: string): Promise<void> {
    const filePath = this.getFilePath(uuid);
    await fs.unlink(filePath);
  }
}
