import { repository, type Repository, type InsertRepository } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  getRepository(id: string): Promise<Repository | undefined>;
  getRepositoryByFullName(fullName: string): Promise<Repository | undefined>;
  createRepository(repo: InsertRepository): Promise<Repository>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private repositories: Map<string, Repository>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.repositories = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getRepository(id: string): Promise<Repository | undefined> {
    return this.repositories.get(id);
  }

  async getRepositoryByFullName(fullName: string): Promise<Repository | undefined> {
    return Array.from(this.repositories.values()).find(
      (repo) => repo.fullName === fullName,
    );
  }

  async createRepository(repo: InsertRepository): Promise<Repository> {
    const repository: Repository = {
      ...repo,
    };
    this.repositories.set(repo.id, repository);
    return repository;
  }
}

export const storage = new MemStorage();
