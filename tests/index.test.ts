import { DataNode } from "../src";

describe("Node hierarchy", () => {
  describe("DataNode", () => {
    it("should create a DataNode with text body", () => {
      const now = new Date();
      const node = new DataNode({
        value: {
          meta: {
            createdAt: now,
            title: "Test Node",
            uuid: "123e4567-e89b-12d3-a456-426614174000",
            baseUrl: "https://example.com/base",
          },
          body: {
            type: "text",
            data: { text: "Hello world" },
          },
        },
      });

      expect(node.value.meta.title).toBe("Test Node");
      expect(node.value.meta.createdAt).toBe(now);
      expect(node.value.meta.uuid).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(node.value.meta.baseUrl).toBe("https://example.com/base");
      expect(node.value.body.type).toBe("text");
      expect((node.value.body.data as { text: string }).text).toBe(
        "Hello world"
      );
    });

    it("should create a DataNode with link body", () => {
      const node = new DataNode({
        value: {
          meta: {
            createdAt: new Date(),
            title: "Link Node",
            uuid: "987fcdeb-51a2-43d7-9b56-312214174000",
            baseUrl: "https://example.com",
          },
          body: {
            type: "link",
            data: { href: "https://example.com" },
          },
        },
      });

      expect(node.value.body.type).toBe("link");
      expect((node.value.body.data as { href: string }).href).toBe(
        "https://example.com"
      );
    });

    it("should compute fileLocation from uuid", () => {
      const node = new DataNode({
        value: {
          meta: {
            createdAt: new Date(),
            title: "Test Node",
            uuid: "123e4567-e89b-12d3-a456-426614174000",
            baseUrl: "https://example.com",
          },
          body: {
            type: "text",
            data: { text: "Hello world" },
          },
        },
      });

      expect(node.fileLocation).toBe(
        "123e4567-e89b-12d3-a456-426614174000.json"
      );
    });

    it("should compute url from baseUrl and fileLocation", () => {
      const node = new DataNode({
        value: {
          meta: {
            createdAt: new Date(),
            title: "Test Node",
            uuid: "123e4567-e89b-12d3-a456-426614174000",
            baseUrl: "https://example.com/base",
          },
          body: {
            type: "text",
            data: { text: "Hello world" },
          },
        },
      });

      expect(node.url).toBe(
        "https://example.com/base/123e4567-e89b-12d3-a456-426614174000.json"
      );
    });

    it("should serialize to JSON string including next and child", () => {
      const now = new Date();
      const node = new DataNode({
        value: {
          meta: {
            createdAt: now,
            title: "Test Node",
            uuid: "123e4567-e89b-12d3-a456-426614174000",
            baseUrl: "https://example.com/base",
          },
          body: {
            type: "text",
            data: { text: "Hello world" },
          },
        },
        next: "987fcdeb-51a2-43d7-9b56-312214174000",
        child: "child-reference-id",
      });

      const json = node.toJson();
      const parsed = JSON.parse(json);

      // Check main node
      expect(parsed.value.meta.title).toBe("Test Node");
      expect(new Date(parsed.value.meta.createdAt)).toEqual(now);
      expect(parsed.value.meta.uuid).toBe(
        "123e4567-e89b-12d3-a456-426614174000"
      );
      expect(parsed.value.meta.baseUrl).toBe("https://example.com/base");
      expect(parsed.value.body.type).toBe("text");
      expect(parsed.value.body.data.text).toBe("Hello world");

      // Check next and child references
      expect(parsed.next).toBe("987fcdeb-51a2-43d7-9b56-312214174000");
      expect(parsed.child).toBe("child-reference-id");
    });

    it("should deserialize from JSON string", () => {
      const now = new Date();
      const originalNode = new DataNode({
        value: {
          meta: {
            createdAt: now,
            title: "Test Node",
            uuid: "123e4567-e89b-12d3-a456-426614174000",
            baseUrl: "https://example.com/base",
          },
          body: {
            type: "text",
            data: { text: "Hello world" },
          },
        },
        next: "987fcdeb-51a2-43d7-9b56-312214174000",
        child: "child-reference-id",
      });

      const json = originalNode.toJson();
      const deserializedNode = DataNode.fromJson(json);

      // Check value
      expect(deserializedNode.value.meta.title).toBe("Test Node");
      expect(new Date(deserializedNode.value.meta.createdAt)).toEqual(now);
      expect(deserializedNode.value.meta.uuid).toBe(
        "123e4567-e89b-12d3-a456-426614174000"
      );
      expect(deserializedNode.value.meta.baseUrl).toBe(
        "https://example.com/base"
      );
      expect(deserializedNode.value.body.type).toBe("text");

      console.log(deserializedNode.value.body.data);

      expect(deserializedNode.value.body.data.text).toBe("Hello world");

      // Check next and child references
      expect(deserializedNode.next).toBe(
        "987fcdeb-51a2-43d7-9b56-312214174000"
      );
      expect(deserializedNode.child).toBe("child-reference-id");

      // Check computed properties
      expect(deserializedNode.fileLocation).toBe(
        "123e4567-e89b-12d3-a456-426614174000.json"
      );
      expect(deserializedNode.url).toBe(
        "https://example.com/base/123e4567-e89b-12d3-a456-426614174000.json"
      );
    });
  });
});
