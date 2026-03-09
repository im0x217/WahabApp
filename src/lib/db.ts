import postgres from 'postgres'
import type { AssetDefinition, Transaction, Vault } from '@/types/trading'
import { seedVaults } from '@/lib/trading'
import { DEFAULT_ASSET_DEFINITIONS } from '@/types/trading'

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

const normalizeBalances = (balances: Partial<Vault['balances']> | null | undefined, assetIds: string[]): Vault['balances'] => {
  const normalized: Record<string, number> = {}
  for (const assetId of assetIds) {
    const value = balances?.[assetId]
    normalized[assetId] = typeof value === 'number' && Number.isFinite(value) ? value : 0
  }
  return normalized
}

const initializeDatabase = async () => {
  const sql = getSql()
  await sql`
    CREATE TABLE IF NOT EXISTS asset_types (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      supports_weight_rate BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  const [{ asset_count }] = await sql<{ asset_count: string }[]>`SELECT COUNT(*)::text AS asset_count FROM asset_types`
  if (Number(asset_count) === 0) {
    await sql.begin(async (tx: any) => {
      for (const asset of DEFAULT_ASSET_DEFINITIONS) {
        await tx`
          INSERT INTO asset_types (id, label, icon, color, supports_weight_rate)
          VALUES (${asset.id}, ${asset.label}, ${asset.icon}, ${asset.color}, ${asset.supportsWeightRate})
        `
      }
    })
  }

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

  const assetIds = (await sql<Array<{ id: string }>>`SELECT id FROM asset_types ORDER BY created_at ASC`).map((row) => row.id)

  const [{ count }] = await sql<{ count: string }[]>`SELECT COUNT(*)::text AS count FROM vaults`
  if (Number(count) > 0) return

  const now = new Date().toISOString()
  await sql.begin(async (tx: any) => {
    for (const vault of seedVaults) {
      await tx`
        INSERT INTO vaults (id, name, kind, balances, updated_at)
        VALUES (${vault.id}, ${vault.name}, ${vault.kind}, ${tx.json(normalizeBalances(vault.balances, assetIds))}, ${now})
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

const getAssetIds = async () => {
  const sql = getSql()
  return (await sql<Array<{ id: string }>>`SELECT id FROM asset_types ORDER BY created_at ASC`).map((row) => row.id)
}

const alignVaultBalancesWithAssets = async () => {
  const sql = getSql()
  const assetIds = await getAssetIds()
  const vaults = await sql<Array<{ id: string; balances: Record<string, number> }>>`SELECT id, balances FROM vaults`
  if (vaults.length === 0) return

  await sql.begin(async (tx: any) => {
    for (const vault of vaults) {
      const next = normalizeBalances(vault.balances, assetIds)
      await tx`UPDATE vaults SET balances = ${tx.json(next)}, updated_at = NOW() WHERE id = ${vault.id}`
    }
  })
}

export const getAssetTypes = async (): Promise<AssetDefinition[]> => {
  await ensureDbReady()
  const sql = getSql()
  const rows = await sql<
    Array<{ id: string; label: string; icon: string; color: string; supports_weight_rate: boolean }>
  >`SELECT id, label, icon, color, supports_weight_rate FROM asset_types ORDER BY created_at ASC`

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    icon: row.icon,
    color: row.color,
    supportsWeightRate: row.supports_weight_rate,
  }))
}

export const createAssetType = async (asset: AssetDefinition) => {
  await ensureDbReady()
  const sql = getSql()
  await sql`
    INSERT INTO asset_types (id, label, icon, color, supports_weight_rate)
    VALUES (${asset.id}, ${asset.label}, ${asset.icon}, ${asset.color}, ${asset.supportsWeightRate})
  `
  await alignVaultBalancesWithAssets()
  return asset
}

export const updateAssetType = async (asset: AssetDefinition) => {
  await ensureDbReady()
  const sql = getSql()
  await sql`
    UPDATE asset_types
    SET label = ${asset.label}, icon = ${asset.icon}, color = ${asset.color}, supports_weight_rate = ${asset.supportsWeightRate}
    WHERE id = ${asset.id}
  `
  return asset
}

export const deleteAssetType = async (id: string) => {
  await ensureDbReady()
  const sql = getSql()
  const [{ usage_count }] = await sql<{ usage_count: string }[]>`
    SELECT COUNT(*)::text AS usage_count FROM transactions WHERE asset = ${id}
  `

  if (Number(usage_count) > 0) {
    throw new Error('ASSET_IN_USE')
  }

  await sql`DELETE FROM asset_types WHERE id = ${id}`
  await alignVaultBalancesWithAssets()
}

export const getVaults = async (): Promise<Vault[]> => {
  await ensureDbReady()
  const sql = getSql()
  const assetIds = await getAssetIds()
  const rows = await sql<Array<{ id: string; name: string; kind: Vault['kind']; balances: Vault['balances'] }>>`
    SELECT id, name, kind, balances
    FROM vaults
    ORDER BY name ASC
  `

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    balances: normalizeBalances(row.balances, assetIds),
  }))
}

export const replaceVaults = async (vaults: Vault[]) => {
  await ensureDbReady()
  const sql = getSql()
  const now = new Date().toISOString()
  const assetIds = await getAssetIds()

  await sql.begin(async (tx: any) => {
    await tx`DELETE FROM vaults`
    for (const vault of vaults) {
      await tx`
        INSERT INTO vaults (id, name, kind, balances, updated_at)
        VALUES (${vault.id}, ${vault.name}, ${vault.kind}, ${tx.json(normalizeBalances(vault.balances, assetIds))}, ${now})
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
