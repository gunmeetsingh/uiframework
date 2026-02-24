import mysql, { Pool } from 'mysql2/promise';

/**
 * DatabaseManager: A singleton for managing multiple MySQL connection pools.
 * This pattern allows different products/screens to share a common configuration
 * but point to different database instances/schemas.
 */
class DatabaseManager {
    private pools: Map<string, Pool> = new Map();

    /**
     * Get or create a connection pool for a specific database name.
     * @param name - The identifier for the pool (e.g., 'CORE', 'GTP_PROXY')
     * @param connectionString - The MySQL URI for this pool
     */
    public async getPool(name: string, connectionString?: string): Promise<Pool> {
        if (this.pools.has(name)) {
            return this.pools.get(name)!;
        }

        if (!connectionString) {
            throw new Error(`Connection string required to initialize database pool: ${name}`);
        }

        console.log(`Initializing new database pool for: ${name}`);

        const pool = mysql.createPool(connectionString);
        this.pools.set(name, pool);

        return pool;
    }

    /**
     * Utility to close all pools on shutdown
     */
    public async closeAll(): Promise<void> {
        for (const [name, pool] of this.pools.entries()) {
            console.log(`Closing database pool: ${name}`);
            await pool.end();
            this.pools.delete(name);
        }
    }
}

// Export a singleton instance
export const dbManager = new DatabaseManager();
