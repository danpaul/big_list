interface NodeOptions<T> {
  data: T;
  createdAt: Date;
  baseUrl: string;
  uuid: string;
  next?: string | null;
  child?: string | null;
}

class Node<T> implements NodeOptions<T> {
  public data: T;
  public createdAt: Date;
  public baseUrl: string;
  public uuid: string;
  public next?: string | null;
  public child?: string | null;

  constructor(options: NodeOptions<T>) {
    this.data = options.data;
    this.createdAt = options.createdAt;
    this.baseUrl = options.baseUrl;
    this.uuid = options.uuid;
    this.next = options.next ?? null;
    this.child = options.child ?? null;
  }
}

export default Node;
export { type NodeOptions };
