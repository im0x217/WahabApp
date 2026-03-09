import postgres from 'postgres'
import type { Transaction, Vault } from '@/types/trading'
import { seedVaults } from '@/lib/trading'

const globalForSql = globalThis as typeof globalThis & {
  __wahabSqlClient?: postgres.Sql
  __wahabDbInitPromise?: Promise<void>
}

const getSql = () => {
  if (globalForSql.__wahabSqlClient) {
    return globalForSql.__wahabSqlClient
  }

  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required. Set it in your environment variables.')
  }

  const sqlClient = postgres(databaseUrl, {
    ssl: 'require',
    max: 5,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  globalForSql.__wahabSqlClient = sqlClient
  return sqlClient
}

const normalizeBalances = (balances: Partial<Vault['balances']> | null | undefined): Vault['balances'] => ({
  Dollars: Number(balances?.Dollars ?? 0),
  Euro: Number(balances?.Euro ?? 0),
  LYD: Number(balances?.LYD ?? 0),
  Gold: Number(balances?.Gold ?? 0),
  Silver: Number(balances?.Silver ?? 0),
})

const initializeDatabase = async () => {
  const sql = getSql()
  await sql`
    CREATE TABLE IF NOT EXISTS vaults (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      balances JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      vault_id TEXT NOT NULL,
      type TEXT NOT NULL,
      asset TEXT NOT NULL,
      amount NUMERIC NOT NULL CHECK (amount > 0),
      rate NUMERIC NOT NULL CHECK (rate >= 0),
      rate_unit TEXT NOT NULL DEFAULT 'unit',
      description TEXT,
      timestamp TIMESTAMPTZ NOT NULL
    )
  `

  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS rate_unit TEXT NOT NULL DEFAULT 'unit'`

  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions (timestamp DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_vault_id ON transactions (vault_id)`

  const [{ count }] = await sql<{ count: string }[]>`SELECT COUNT(*)::text AS count FROM vaults`
  if (Number(count) > 0) return

  const now = new Date().toISOString()
  await sql.begin(async (tx: any) => {
    for (const vault of seedVaults) {
      await tx`
        INSERT INTO vaults (id, name, kind, balances, updated_at)
        VALUES (${vault.id}, ${vault.name}, ${vault.kind}, ${tx.json(normalizeBalances(vault.balances))}, ${now})
      `
    }
  })
}

const ensureDbReady = () => {
  if (!globalForSql.__wahabDbInitPromise) {
    globalForSql.__wahabDbInitPromise = initializeDatabase()
  }
  return globalForSql.__wahabDbInitPromise
}

export const getVaults = async (): Promise<Vault[]> => {
  await ensureDbReady()
  const sql = getSql()
  const rows = await sql<Array<{ id: string; name: string; kind: Vault['kind']; balances: Vault['balances'] }>>`
    SELECT id, name, kind, balances
    FROM vaults
    ORDER BY name ASC
  `

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    balances: normalizeBalances(row.balances),
  }))
}

export const replaceVaults = async (vaults: Vault[]) => {
  await ensureDbReady()
  const sql = getSql()
  const now = new Date().toISOString()

  await sql.begin(async (tx: any) => {
    await tx`DELETE FROM vaults`
    for (const vault of vaults) {
      await tx`
        INSERT INTO vaults (id, name, kind, balances, updated_at)
        VALUES (${vault.id}, ${vault.name}, ${vault.kind}, ${tx.json(normalizeBalances(vault.balances))}, ${now})
      `
    }
  })
}

export const getTransactions = async (): Promise<Transaction[]> => {
  await ensureDbReady()
  const sql = getSql()
  const rows = await sql<
    Array<{
      id: string
      vault_id: string
      type: Transaction['type']
      asset: Transaction['asset']
      amount: number
      rate: number
      rate_unit: Transaction['rateUnit']
      description: string | null
      timestamp: string
    }>
  >`
    SELECT id, vault_id, type, asset, amount, rate, rate_unit, description, timestamp::text AS timestamp
    FROM transactions
    ORDER BY timestamp DESC
  `

  return rows.map((row) => ({
    id: row.id,
    vaultId: row.vault_id,
    type: row.type,
    asset: row.asset,
    amount: row.amount,
    rate: row.rate,
    rateUnit: row.rate_unit,
    description: row.description ?? undefined,
    timestamp: row.timestamp,
  }))
}

export const createTransaction = async (transaction: Transaction) => {
  await ensureDbReady()
  const sql = getSql()
  await sql`
    INSERT INTO transactions (id, vault_id, type, asset, amount, rate, rate_unit, description, timestamp)
    VALUES (
      ${transaction.id},
      ${transaction.vaultId},
      ${transaction.type},
      ${transaction.asset},
      ${transaction.amount},
      ${transaction.rate},
      ${transaction.rateUnit},
      ${transaction.description ?? null},
      ${transaction.timestamp}
    )
  `

  return transaction
}
