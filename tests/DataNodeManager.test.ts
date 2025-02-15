import { DataNodeManager } from "../src/DataNodeManager";
import { promises as fs } from "fs";
import path from "path";

describe("DataNodeManager", () => {
  const testDir = path.join(__dirname, "test-data");
  let manager: DataNodeManager;

  beforeEach(async () => {
    manager = new DataNodeManager({
      baseUrl: "https://example.com/data",
      baseDir: testDir,
    });
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("should create a DataNodeManager with base URL and directory", () => {
    expect(manager.url).toBe("https://example.com/data");
    expect(manager.directory).toBe(testDir);
  });

  it("should create and save a new node", async () => {
    const now = new Date();
    const node = await manager.create({
      meta: {
        createdAt: now,
        title: "Test Node",
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Hello world" },
      },
    });

    const filePath = path.join(testDir, `${node.value.meta.uuid}.json`);
    const exists = await fs
      .stat(filePath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("should read an existing node", async () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000";
    const now = new Date();
    const originalNode = await manager.create({
      meta: {
        createdAt: now,
        title: "Test Node",
        uuid,
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Hello world" },
      },
    });

    const loadedNode = await manager.read(uuid);
    expect(loadedNode.value.meta.title).toBe(originalNode.value.meta.title);
    expect(loadedNode.value.body.type).toBe(originalNode.value.body.type);
    expect(new Date(loadedNode.value.meta.createdAt)).toEqual(now);
  });

  it("should update an existing node", async () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000";
    const node = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Test Node",
        uuid,
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Hello world" },
      },
    });

    node.value.meta.title = "Updated Title";
    await manager.update(node);

    const loadedNode = await manager.read(uuid);
    expect(loadedNode.value.meta.title).toBe("Updated Title");
  });

  it("should delete a node", async () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000";
    await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Test Node",
        uuid,
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Hello world" },
      },
    });

    await manager.delete(uuid);

    const filePath = path.join(testDir, `${uuid}.json`);
    const exists = await fs
      .stat(filePath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });

  it("should unlink a node and update references", async () => {
    // Create a chain of nodes: A -> B -> C
    const nodeC = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node C",
        uuid: "c-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node C" },
      },
    });

    const nodeB = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node B",
        uuid: "b-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node B" },
      },
    });

    const nodeA = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node A",
        uuid: "a-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node A" },
      },
    });
  });

  it("should update previous node when deleting", async () => {
    // Create a chain: A -> B -> C
    const nodeC = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node C",
        uuid: "c-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node C" },
      },
    });

    const nodeB = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node B",
        uuid: "b-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node B" },
      },
    });
    nodeB.next = "c-uuid";
    await manager.update(nodeB);

    const nodeA = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node A",
        uuid: "a-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node A" },
      },
    });
    nodeA.next = "b-uuid";
    await manager.update(nodeA);

    // Delete B with A as previous
    await manager.delete("b-uuid", { parentUuid: "a-uuid" });

    // Check that A now points to C
    const updatedNodeA = await manager.read("a-uuid");
    expect(updatedNodeA.next).toBe("c-uuid");
  });

  it("should move a node up in the list", async () => {
    // Create a chain: A -> B -> C
    const nodeC = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node C",
        uuid: "c-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node C" },
      },
    });

    const nodeB = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node B",
        uuid: "b-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node B" },
      },
    });
    nodeB.next = "c-uuid";
    await manager.update(nodeB);

    const nodeA = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node A",
        uuid: "a-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node A" },
      },
    });
    nodeA.next = "b-uuid";
    await manager.update(nodeA);

    // Move B up (swap with A)
    await manager.moveUp("b-uuid", "a-uuid");

    // Verify new order: B -> A -> C
    const updatedNodeB = await manager.read("b-uuid");
    const updatedNodeA = await manager.read("a-uuid");

    expect(updatedNodeB.next).toBe("a-uuid");
    expect(updatedNodeA.next).toBe("c-uuid");
  });

  it("should move a node down in the list", async () => {
    // Create a chain: A -> B -> C
    const nodeC = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node C",
        uuid: "c-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node C" },
      },
    });

    const nodeB = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node B",
        uuid: "b-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node B" },
      },
    });
    nodeB.next = `${manager.url}/c-uuid.json`;
    await manager.update(nodeB);

    const nodeA = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node A",
        uuid: "a-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node A" },
      },
    });
    nodeA.next = `${manager.url}/b-uuid.json`;
    await manager.update(nodeA);

    // Move A down (swap with B)
    await manager.moveDown("a-uuid");

    // Verify new order: B -> A -> C
    const updatedNodeB = await manager.read("b-uuid");
    const updatedNodeA = await manager.read("a-uuid");

    expect(updatedNodeB.next).toBe(`${manager.url}/a-uuid.json`);
    expect(updatedNodeA.next).toBe(`${manager.url}/c-uuid.json`);
  });

  it("should indent a node making it a child of previous node", async () => {
    // Create a chain: A -> B -> C
    const nodeC = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node C",
        uuid: "c-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node C" },
      },
    });

    const nodeB = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node B",
        uuid: "b-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node B" },
      },
    });
    nodeB.next = `${manager.url}/c-uuid.json`;
    await manager.update(nodeB);

    const nodeA = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node A",
        uuid: "a-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node A" },
      },
    });
    nodeA.next = `${manager.url}/b-uuid.json`;
    await manager.update(nodeA);

    // Indent B under A
    await manager.indent("b-uuid", "a-uuid");

    // Verify new structure: A(->C, child:B) -> B
    const updatedNodeA = await manager.read("a-uuid");
    const updatedNodeB = await manager.read("b-uuid");

    expect(updatedNodeA.next).toBe(`${manager.url}/c-uuid.json`);
    expect(updatedNodeA.child).toBe(`${manager.url}/b-uuid.json`);
    expect(updatedNodeB.next).toBeNull();
  });

  it("should unindent a node making it next of parent node", async () => {
    // Create a chain: A(child:B) -> C
    const nodeC = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node C",
        uuid: "c-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node C" },
      },
    });

    const nodeB = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node B",
        uuid: "b-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node B" },
      },
    });

    const nodeA = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node A",
        uuid: "a-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Node A" },
      },
    });

    // Set up initial structure
    nodeA.next = `${manager.url}/c-uuid.json`;
    nodeA.child = `${manager.url}/b-uuid.json`;
    await manager.update(nodeA);

    // Unindent B from under A
    await manager.unIndent("b-uuid", "a-uuid");

    // Verify new structure: A -> B -> C
    const updatedNodeA = await manager.read("a-uuid");
    const updatedNodeB = await manager.read("b-uuid");

    expect(updatedNodeA.next).toBe(`${manager.url}/b-uuid.json`);
    expect(updatedNodeA.child).toBeNull();
    expect(updatedNodeB.next).toBe(`${manager.url}/c-uuid.json`);
  });

  it("should add a node as next to parent node", async () => {
    // Create parent node
    const parentNode = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Parent Node",
        uuid: "parent-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Parent Node" },
      },
    });

    // Add new node as next
    const newNode = await manager.add(
      {
        meta: {
          createdAt: new Date(),
          title: "New Node",
          uuid: "new-uuid",
          baseUrl: manager.url,
        },
        body: {
          type: "text",
          data: { text: "New Node" },
        },
      },
      "parent-uuid",
      false
    );

    // Verify the linkage
    const updatedParent = await manager.read("parent-uuid");
    expect(updatedParent.next).toBe(`${manager.url}/new-uuid.json`);
  });

  it("should add a node as child to parent node", async () => {
    // Create parent node
    const parentNode = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Parent Node",
        uuid: "parent-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Parent Node" },
      },
    });

    // Add new node as child
    const newNode = await manager.add(
      {
        meta: {
          createdAt: new Date(),
          title: "New Node",
          uuid: "new-uuid",
          baseUrl: manager.url,
        },
        body: {
          type: "text",
          data: { text: "New Node" },
        },
      },
      "parent-uuid",
      true
    );

    // Verify the linkage
    const updatedParent = await manager.read("parent-uuid");
    expect(updatedParent.child).toBe(`${manager.url}/new-uuid.json`);
  });

  it("should preserve existing next reference when adding as next", async () => {
    // Create a chain: Parent -> Existing -> null
    const existingNode = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Existing Node",
        uuid: "existing-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Existing Node" },
      },
    });

    const parentNode = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Parent Node",
        uuid: "parent-uuid",
        baseUrl: manager.url,
      },
      body: {
        type: "text",
        data: { text: "Parent Node" },
      },
    });
    parentNode.next = `${manager.url}/existing-uuid.json`;
    await manager.update(parentNode);

    // Add new node as next to parent
    const newNode = await manager.add(
      {
        meta: {
          createdAt: new Date(),
          title: "New Node",
          uuid: "new-uuid",
          baseUrl: manager.url,
        },
        body: {
          type: "text",
          data: { text: "New Node" },
        },
      },
      "parent-uuid",
      false
    );

    // Verify the chain: Parent -> New -> Existing -> null
    const updatedParent = await manager.read("parent-uuid");
    const updatedNew = await manager.read("new-uuid");

    expect(updatedParent.next).toBe(`${manager.url}/new-uuid.json`);
    expect(updatedNew.next).toBe(`${manager.url}/existing-uuid.json`);
  });
});
