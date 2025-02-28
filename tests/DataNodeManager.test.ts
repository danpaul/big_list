import { DataNodeManager } from "../src/DataNodeManager";
import { DataNode } from "../src/DataNode";
import { DataNodeValueLocal } from "../src/DataNodeValue";
import { FileDataStore } from "../src/FileDataStore";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("DataNodeManager", () => {
  let manager: DataNodeManager;
  let store: FileDataStore;
  let testDir: string;

  beforeEach(async () => {
    // Create a test directory within /tests
    testDir = path.join(__dirname, "test-data");
    await fs.mkdir(testDir, { recursive: true });
    store = new FileDataStore(testDir);
    manager = new DataNodeManager({
      baseUrl: "https://example.com",
      store,
    });
  });

  afterEach(async () => {
    // Clean up test files after each test
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("should create a new node", async () => {
    const node = await manager.create({
      data: new DataNodeValueLocal("Test content"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "123",
    });

    expect(node.uuid).toBe("123");
    expect(node.data.data).toBe("Test content");
  });

  it("should read an existing node", async () => {
    const created = await manager.create({
      data: new DataNodeValueLocal("Test content"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "123",
    });

    const read = await manager.read("123");
    expect(read.uuid).toBe(created.uuid);
    expect(read.data.data).toBe(created.data.data);
  });

  it("should update a node", async () => {
    const node = await manager.create({
      data: new DataNodeValueLocal("Original content"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "123",
    });

    node.data = new DataNodeValueLocal("Updated content");
    await manager.update(node);

    const updated = await manager.read("123");
    expect(updated.data.data).toBe("Updated content");
  });

  it("should delete a node", async () => {
    await manager.create({
      data: new DataNodeValueLocal("Test content"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "123",
    });

    await manager.delete("123");
    try {
      await manager.read("123");
      fail("Expected read to throw an error");
    } catch (error) {
      //   expect(error?.message || "").toContain("ENOENT");
    }
  });

  it("should add a node as next", async () => {
    const parent = await manager.create({
      data: new DataNodeValueLocal("Parent"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "parent",
    });

    const child = await manager.add(
      {
        data: new DataNodeValueLocal("Child"),
        createdAt: new Date("2024-01-01"),
        baseUrl: "https://example.com",
        uuid: "child",
      },
      parent.uuid
    );

    const updatedParent = await manager.read(parent.uuid);
    expect(updatedParent.next).toBe("https://example.com/child.json");
  });

  it("should add a node as child", async () => {
    const parent = await manager.create({
      data: new DataNodeValueLocal("Parent"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "parent",
    });

    const child = await manager.add(
      {
        data: new DataNodeValueLocal("Child"),
        createdAt: new Date("2024-01-01"),
        baseUrl: "https://example.com",
        uuid: "child",
      },
      parent.uuid,
      true
    );

    const updatedParent = await manager.read(parent.uuid);
    expect(updatedParent.child).toBe("https://example.com/child.json");
  });

  it("should move a node up", async () => {
    const node1 = await manager.create({
      data: new DataNodeValueLocal("Node 1"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "node1",
    });

    const node2 = await manager.create({
      data: new DataNodeValueLocal("Node 2"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "node2",
    });

    node1.next = manager.getUrlFromUuid(node2.uuid);
    await manager.update(node1);

    await manager.moveUp(node2.uuid, node1.uuid);

    const updatedNode1 = await manager.read(node1.uuid);
    const updatedNode2 = await manager.read(node2.uuid);

    expect(updatedNode2.next).toBe("https://example.com/node1.json");
  });

  it("should indent a node", async () => {
    const parent = await manager.create({
      data: new DataNodeValueLocal("Parent"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "parent",
    });

    const child = await manager.create({
      data: new DataNodeValueLocal("Child"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "child",
    });

    await manager.indent(child.uuid, parent.uuid);

    const updatedParent = await manager.read(parent.uuid);
    const updatedChild = await manager.read(child.uuid);

    expect(updatedParent.child).toBe("https://example.com/child.json");
    expect(updatedChild.next).toBeNull();
  });

  it("should unindent a node", async () => {
    const parent = await manager.create({
      data: new DataNodeValueLocal("Parent"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "parent",
    });

    const child = await manager.create({
      data: new DataNodeValueLocal("Child"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "child",
    });

    parent.child = manager.getUrlFromUuid(child.uuid);
    await manager.update(parent);

    await manager.unIndent(child.uuid, parent.uuid);

    const updatedParent = await manager.read(parent.uuid);
    expect(updatedParent.child).toBeNull();
    expect(updatedParent.next).toBe("https://example.com/child.json");
  });
});
