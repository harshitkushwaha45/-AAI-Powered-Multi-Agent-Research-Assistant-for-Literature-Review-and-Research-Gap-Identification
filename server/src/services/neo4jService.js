import neo4j from "neo4j-driver";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let driver = null;
let isConnected = false;

/**
 * Initializes the Neo4j driver if NEO4J_URI is configured.
 * Safely falls back if connection cannot be established.
 */
export async function initNeo4j() {
  if (!env.neo4jUri) {
    logger.info("Neo4j URI not configured; using native MongoDB graph persistence.");
    return null;
  }

  try {
    driver = neo4j.driver(
      env.neo4jUri,
      neo4j.auth.basic(env.neo4jUser, env.neo4jPassword),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 5000,
      }
    );

    // Verify connectivity
    const serverInfo = await driver.getServerInfo();
    isConnected = true;
    logger.info(`Connected to Neo4j database: ${serverInfo.agent} at ${serverInfo.address}`);

    // Create uniqueness constraints and indexes
    await ensureConstraints();

    return driver;
  } catch (err) {
    logger.warn(`Neo4j connection failed (${err.message}); falling back to MongoDB graph store.`);
    isConnected = false;
    if (driver) {
      await driver.close().catch(() => {});
      driver = null;
    }
    return null;
  }
}

/**
 * Checks if Neo4j is actively connected and reachable.
 */
export function isNeo4jActive() {
  return Boolean(driver && isConnected);
}

/**
 * Ensures required uniqueness constraints and indices exist in Neo4j.
 */
async function ensureConstraints() {
  if (!isNeo4jActive()) return;

  const session = driver.session({ database: env.neo4jDatabase });
  try {
    // Unique constraint on (Entity:canonicalId, sessionId)
    await session.run(`
      CREATE CONSTRAINT unique_entity_canonical IF NOT EXISTS
      FOR (e:Entity) REQUIRE (e.sessionId, e.canonicalId) IS UNIQUE
    `);

    // Index on year for temporal snapshotting
    await session.run(`
      CREATE INDEX entity_year_idx IF NOT EXISTS
      FOR (e:Entity) ON (e.firstSeenYear)
    `);

    logger.info("Neo4j constraints and indices verified.");
  } catch (err) {
    logger.warn(`Neo4j constraint creation warning: ${err.message}`);
  } finally {
    await session.close();
  }
}

/**
 * Executes a Cypher query with parameters.
 *
 * @param {string} cypher - The Cypher statement
 * @param {Object} params - Query parameters
 * @param {string} [mode="WRITE"] - "READ" or "WRITE"
 * @returns {Promise<Array<Object>>}
 */
export async function runCypher(cypher, params = {}, mode = "WRITE") {
  if (!isNeo4jActive()) {
    throw new Error("Neo4j is not connected.");
  }

  const session = driver.session({
    database: env.neo4jDatabase,
    defaultAccessMode:
      mode === "READ" ? neo4j.session.READ : neo4j.session.WRITE,
  });

  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => record.toObject());
  } finally {
    await session.close();
  }
}

/**
 * Closes the Neo4j driver on application shutdown.
 */
export async function closeNeo4j() {
  if (driver) {
    await driver.close().catch(() => {});
    driver = null;
    isConnected = false;
  }
}
