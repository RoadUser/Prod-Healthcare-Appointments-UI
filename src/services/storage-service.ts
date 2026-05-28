export class StorageService {
  private static instance: StorageService;
//edrfestrt
  static getInstance(): StorageService {
    if (!StorageService.instance) StorageService.instance = new StorageService();
    return StorageService.instance;
  }

  get<T>(key: string): T | null {
    try {
      const v = localStorage.getItem(key);
      if (!v) return null;
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }
}
