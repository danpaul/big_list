import DataNode from "../src/DataNode";
import { DataNodeValueLocal } from "../src/DataNodeValue";

describe("DataNode", () => {
  it("should create a new data node with local content", () => {
    const dataNode = new DataNode({
      data: new DataNodeValueLocal("Hello, world!"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "123",
    });

    expect(dataNode.data.type).toBe("local");
    expect(dataNode.data.data).toBe("Hello, world!");
    expect(dataNode.uuid).toBe("123");
    expect(dataNode.baseUrl).toBe("https://example.com");
    expect(dataNode.createdAt).toEqual(new Date("2024-01-01"));
  });

  it("should generate correct file location and URL", () => {
    const dataNode = new DataNode({
      data: new DataNodeValueLocal("Test content"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "456",
    });

    expect(dataNode.fileLocation).toBe("456.json");
    expect(dataNode.baseUrl).toBe("https://example.com");
  });

  it("should serialize and deserialize correctly", () => {
    const original = new DataNode({
      data: new DataNodeValueLocal("Test content"),
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "789",
    });

    const json = original.toJson();
    const restored = DataNode.fromJson(json);

    expect(restored).toBeInstanceOf(DataNode);
    expect(restored.data.data).toBe("Test content");
    expect(restored.uuid).toBe("789");
    expect(restored.baseUrl).toBe("https://example.com");
    expect(new Date(restored.createdAt)).toEqual(new Date("2024-01-01"));
  });
});
