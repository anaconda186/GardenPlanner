/**
 * Persistence, as an interface.
 *
 * The desktop app implements this over SQLite (the official WebAssembly build,
 * with the Electron main process owning a real `.sqlite` file). A future Expo app
 * implements the same interface over expo-sqlite. Nothing in packages/core knows
 * which, which is the whole reason the mobile port is cheap.
 *
 * Entity types and per-aggregate methods arrive in Phase 1 with the schema. This
 * file currently defines only what every stored record shares.
 */

/**
 * Fields every persisted record carries.
 *
 * UUIDs rather than autoincrement integers, and soft deletes with `updatedAt`,
 * because they cost nothing now and are what makes adding sync later a feature
 * rather than a schema rewrite. Two devices cannot agree on integer ids, and a
 * hard delete cannot be replicated.
 */
export interface Persisted {
  /** UUID v7: unique across devices, and sorts by creation time. */
  id: string;
  createdAt: Date;
  /** Last write. The comparison a sync layer uses to resolve conflicts. */
  updatedAt: Date;
  /** Soft delete. Null when live. */
  deletedAt: Date | null;
}

/** A single atomic unit of work. Either every write lands or none does. */
export interface UnitOfWork {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface Repository {
  /**
   * Bring the database schema up to date. Migrations are forward-only: never
   * edit one that has shipped, add a new one. See CLAUDE.md.
   */
  migrate(): Promise<void>;

  /** Run work in a transaction, rolling back if it throws. */
  transaction<T>(work: (uow: UnitOfWork) => Promise<T>): Promise<T>;

  close(): Promise<void>;
}
