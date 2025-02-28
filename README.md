# Data Node Manager

A TypeScript library for managing linked data nodes with file system persistence. This library provides a flexible system for creating, managing, and linking data nodes with both local and reference-based content.

## Installation

```bash
npm install data-node-manager
```

## Features

- Create and manage linked data nodes
- File system persistence
- Support for local and reference data types
- Hierarchical node structure with next/child relationships
- TypeScript support with full type definitions

## Usage

### Basic Node Operations

```typescript
import {
  DataNodeManager,
  DataNodeValueLocal,
  FileDataStore,
} from "data-node-manager";
// Initialize the manager
const store = new FileDataStore("./data");
const manager = new DataNodeManager({
  baseUrl: "https://example.com",
  store,
});
// Create a node
const node = await manager.create({
  data: new DataNodeValueLocal("Hello, world!"),
  createdAt: new Date(),
  baseUrl: "https://example.com",
  uuid: "123",
});
// Read a node
const retrieved = await manager.read("123");
// Update a node
node.data = new DataNodeValueLocal("Updated content");
await manager.update(node);
// Delete a node
await manager.delete("123");
```

### Working with Node Relationships

```typescript
// Add a node as next
const parent = await manager.create({
  data: new DataNodeValueLocal("Parent"),
  createdAt: new Date(),
  baseUrl: "https://example.com",
  uuid: "parent",
});
const child = await manager.add(
  {
    data: new DataNodeValueLocal("Child"),
    createdAt: new Date(),
    baseUrl: "https://example.com",
    uuid: "child",
  },
  parent.uuid
);
// Add a node as child
const subChild = await manager.add(
  {
    data: new DataNodeValueLocal("SubChild"),
    createdAt: new Date(),
    baseUrl: "https://example.com",
    uuid: "subchild",
  },
  child.uuid,
  true // true for adding as child
);
```

## API Reference

### DataNodeManager

The main class for managing data nodes.

#### Constructor

```typescript
constructor(options: { baseUrl: string; store: DataStore })
```

#### Methods

- `create(options: DataNodeOptions): Promise<DataNode>`
  Creates a new node with the given options.

- `read(uuid: string): Promise<DataNode>`
  Reads a node by its UUID.

- `update(node: DataNode): Promise<void>`
  Updates an existing node.

- `delete(uuid: string): Promise<void>`
  Deletes a node by its UUID.

- `add(options: DataNodeOptions, parentUuid: string, asChild?: boolean): Promise<DataNode>`
  Adds a new node as next or child of the parent node.

- `moveUp(uuid: string, parentUuid: string): Promise<void>`
  Moves a node up in the hierarchy.

- `indent(uuid: string, parentUuid: string): Promise<void>`
  Indents a node under a parent.

- `unIndent(uuid: string, parentUuid: string): Promise<void>`
  Unindents a node from its parent.

### DataNode

Represents a single data node in the system.

#### Properties

- `data: DataNodeValue`
- `createdAt: Date`
- `baseUrl: string`
- `uuid: string`
- `next?: string | null`
- `child?: string | null`

### DataNodeValue

The value stored in a node, can be either:

- `DataNodeValueLocal<T>`: For storing local data
- `DataNodeValueReference`: For storing references to other resources

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
