interface NodeOptions<T> {
  value: T;
  next?: string | null;
  child?: string | null;
}

class Node<T> {
  public value: T;
  public next: string | null;
  public child: string | null;

  constructor(options: NodeOptions<T>) {
    this.value = options.value;
    this.next = options.next ?? null;
    this.child = options.child ?? null;
  }
}

export default Node;
export { type NodeOptions };
