import Node from "../src/Node";

describe("Node", () => {
  it("should create a new node with required properties", () => {
    const node = new Node({
      data: { text: "Hello, world!" },
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "123",
    });

    expect(node.data).toEqual({ text: "Hello, world!" });
    expect(node.createdAt).toEqual(new Date("2024-01-01"));
    expect(node.baseUrl).toBe("https://example.com");
    expect(node.uuid).toBe("123");
    expect(node.next).toBeNull();
    expect(node.child).toBeNull();
  });

  it("should create a node with optional next and child references", () => {
    const node = new Node({
      data: { text: "Hello, world!" },
      createdAt: new Date("2024-01-01"),
      baseUrl: "https://example.com",
      uuid: "123",
      next: "456",
      child: "789",
    });

    expect(node.next).toBe("456");
    expect(node.child).toBe("789");
  });
});
