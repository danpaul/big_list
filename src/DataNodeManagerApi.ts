import express, { Router, Request, Response, NextFunction } from "express";
import { DataNodeManager } from "./DataNodeManager";
import { DataNodeValue } from "./DataNode";

type AuthCallback = (userId: string, req: Request) => Promise<boolean>;

export class DataNodeManagerApi {
  private manager: DataNodeManager;
  private router: Router;
  private authCallback?: AuthCallback;

  constructor(manager: DataNodeManager, authCallback?: AuthCallback) {
    this.manager = manager;
    this.router = express.Router();
    this.authCallback = authCallback;
    this.setupRoutes();
  }

  private async checkAuth(req: Request, res: Response, next: NextFunction) {
    if (!this.authCallback || req.method === "GET") {
      return next();
    }
    try {
      const isAuthorized = await this.authCallback(req.params.userId, req);
      if (isAuthorized) {
        next();
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    } catch (error) {
      res.status(401).json({ error: "Unauthorized" });
    }
  }

  private setupRoutes(): void {
    // Create a new node
    this.router.post(
      "/users/:userId/nodes",
      this.checkAuth.bind(this),
      async (req: Request, res: Response) => {
        try {
          const value = req.body as DataNodeValue;
          const node = await this.manager.create(value);
          res.status(201).json(JSON.parse(node.toJson()));
        } catch (error) {
          res.status(400).json({ error: (error as Error).message });
        }
      }
    );

    // Get a node by UUID
    this.router.get(
      "/users/:userId/nodes/:uuid",
      async (req: Request, res: Response) => {
        try {
          const node = await this.manager.read(req.params.uuid);
          res.json(JSON.parse(node.toJson()));
        } catch (error) {
          res.status(404).json({ error: "Node not found" });
        }
      }
    );

    // Update a node
    this.router.put(
      "/users/:userId/nodes/:uuid",
      this.checkAuth.bind(this),
      async (req: Request, res: Response) => {
        try {
          const node = await this.manager.read(req.params.uuid);
          Object.assign(node.value, req.body.value);
          node.next = req.body.next;
          node.child = req.body.child;
          await this.manager.update(node);
          res.json(JSON.parse(node.toJson()));
        } catch (error) {
          res.status(404).json({ error: "Node not found" });
        }
      }
    );

    // Move a node up
    this.router.post(
      "/users/:userId/nodes/:uuid/move-up",
      this.checkAuth.bind(this),
      async (req: Request, res: Response) => {
        try {
          await this.manager.moveUp(req.params.uuid, req.body.parentUuid);
          res.status(204).send();
        } catch (error) {
          res.status(404).json({ error: "Node not found" });
        }
      }
    );

    // Move a node down
    this.router.post(
      "/users/:userId/nodes/:uuid/move-down",
      this.checkAuth.bind(this),
      async (req: Request, res: Response) => {
        try {
          await this.manager.moveDown(req.params.uuid);
          res.status(204).send();
        } catch (error) {
          res.status(404).json({ error: "Node not found" });
        }
      }
    );

    // Indent a node
    this.router.post(
      "/users/:userId/nodes/:uuid/indent",
      this.checkAuth.bind(this),
      async (req: Request, res: Response) => {
        try {
          await this.manager.indent(req.params.uuid, req.body.parentUuid);
          res.status(204).send();
        } catch (error) {
          res.status(404).json({ error: "Node not found" });
        }
      }
    );

    // Unindent a node
    this.router.post(
      "/users/:userId/nodes/:uuid/unindent",
      this.checkAuth.bind(this),
      async (req: Request, res: Response) => {
        try {
          await this.manager.unIndent(req.params.uuid, req.body.parentUuid);
          res.status(204).send();
        } catch (error) {
          res.status(404).json({ error: "Node not found" });
        }
      }
    );

    // Delete a node
    this.router.delete(
      "/users/:userId/nodes/:uuid",
      this.checkAuth.bind(this),
      async (req: Request, res: Response) => {
        try {
          await this.manager.delete(req.params.uuid, {
            parentUuid: req.query.parentUuid as string,
          });
          res.status(204).send();
        } catch (error) {
          res.status(404).json({ error: "Node not found" });
        }
      }
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default DataNodeManagerApi;
