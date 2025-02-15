import express, { Router, Request, Response, NextFunction } from "express";
import request from "supertest";
import { DataNodeManager } from "../src/DataNodeManager";
import { DataNodeManagerApi } from "../src/DataNodeManagerApi";
import path from "path";
import { promises as fs } from "fs";

describe("DataNodeManagerApi", () => {
  const testDir = path.join(__dirname, "test-data-api");
  let app: express.Application;
  let manager: DataNodeManager;

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
    manager = new DataNodeManager({
      baseUrl: "https://example.com/data",
      baseDir: testDir,
    });

    const api = new DataNodeManagerApi(manager);
    app = express();
    app.use(express.json());
    app.use("/api", api.getRouter());
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("should create a new node", async () => {
    const response = await request(app)
      .post("/api/users/user123/nodes")
      .send({
        meta: {
          createdAt: new Date(),
          title: "Test Node",
          uuid: "test-uuid",
          baseUrl: "https://example.com/data",
        },
        body: {
          type: "text",
          data: { text: "Hello world" },
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.value.meta.title).toBe("Test Node");
    expect(response.body.value.body.data.text).toBe("Hello world");
  });

  it("should get a node by UUID", async () => {
    // First create a node
    const node = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Test Node",
        uuid: "test-uuid",
        baseUrl: "https://example.com/data",
      },
      body: {
        type: "text",
        data: { text: "Hello world" },
      },
    });

    const response = await request(app).get(
      "/api/users/user123/nodes/test-uuid"
    );

    expect(response.status).toBe(200);
    expect(response.body.value.meta.title).toBe("Test Node");
  });

  it("should update a node", async () => {
    // First create a node
    const node = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Test Node",
        uuid: "test-uuid",
        baseUrl: "https://example.com/data",
      },
      body: {
        type: "text",
        data: { text: "Hello world" },
      },
    });

    const response = await request(app)
      .put("/api/users/user123/nodes/test-uuid")
      .send({
        value: {
          meta: {
            ...node.value.meta,
            title: "Updated Title",
          },
          body: node.value.body,
        },
        next: "next-uuid",
        child: "child-uuid",
      });

    expect(response.status).toBe(200);
    expect(response.body.value.meta.title).toBe("Updated Title");
    expect(response.body.next).toBe("next-uuid");
    expect(response.body.child).toBe("child-uuid");
  });

  it("should delete a node", async () => {
    // First create nodes
    const nodeA = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node A",
        uuid: "a-uuid",
        baseUrl: "https://example.com/data",
      },
      body: { type: "text", data: { text: "Node A" } },
    });

    const nodeB = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node B",
        uuid: "b-uuid",
        baseUrl: "https://example.com/data",
      },
      body: { type: "text", data: { text: "Node B" } },
    });

    // Delete B with A as parent
    const response = await request(app)
      .delete("/api/users/user123/nodes/b-uuid")
      .query({ parentUuid: "a-uuid" });

    expect(response.status).toBe(204);

    // Verify node is deleted
    const getResponse = await request(app).get(
      "/api/users/user123/nodes/b-uuid"
    );
    expect(getResponse.status).toBe(404);
  });

  it("should move a node up", async () => {
    // First create nodes
    const nodeA = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node A",
        uuid: "a-uuid",
        baseUrl: "https://example.com/data",
      },
      body: { type: "text", data: { text: "Node A" } },
    });

    const nodeB = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node B",
        uuid: "b-uuid",
        baseUrl: "https://example.com/data",
      },
      body: { type: "text", data: { text: "Node B" } },
    });

    const response = await request(app)
      .post("/api/users/user123/nodes/b-uuid/move-up")
      .send({ parentUuid: "a-uuid" });

    expect(response.status).toBe(204);
  });

  it("should indent a node", async () => {
    // First create nodes
    const nodeA = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node A",
        uuid: "a-uuid",
        baseUrl: "https://example.com/data",
      },
      body: { type: "text", data: { text: "Node A" } },
    });

    const nodeB = await manager.create({
      meta: {
        createdAt: new Date(),
        title: "Node B",
        uuid: "b-uuid",
        baseUrl: "https://example.com/data",
      },
      body: { type: "text", data: { text: "Node B" } },
    });

    const response = await request(app)
      .post("/api/users/user123/nodes/b-uuid/indent")
      .send({ parentUuid: "a-uuid" });

    expect(response.status).toBe(204);
  });

  it("should require authentication for all non-GET routes", async () => {
    const authCallback = async (userId: string) => {
      return userId === "user123";
    };

    const api = new DataNodeManagerApi(manager, authCallback);
    const appWithAuth = express();
    appWithAuth.use(express.json());
    appWithAuth.use("/api", api.getRouter());

    // Test all non-GET routes with wrong user
    const routes = [
      ["post", "/api/users/wrong-user/nodes"],
      ["put", "/api/users/wrong-user/nodes/test-uuid"],
      ["post", "/api/users/wrong-user/nodes/test-uuid/move-up"],
      ["post", "/api/users/wrong-user/nodes/test-uuid/move-down"],
      ["post", "/api/users/wrong-user/nodes/test-uuid/indent"],
      ["post", "/api/users/wrong-user/nodes/test-uuid/unindent"],
      ["delete", "/api/users/wrong-user/nodes/test-uuid"],
    ];

    for (const [method, path] of routes) {
      const response = await request(appWithAuth)[method](path).send({});
      expect(response.status).toBe(401);
    }

    // Verify GET still works without auth
    const getResponse = await request(appWithAuth).get(
      "/api/users/wrong-user/nodes/test-uuid"
    );
    expect(getResponse.status).toBe(404);
  });
});
