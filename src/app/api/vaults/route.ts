import { NextRequest, NextResponse } from 'next/server'
import { getVaults, replaceVaults } from '@/lib/db'
import { Vault } from '@/types/trading'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const validKinds: Vault['kind'][] = ['Main', 'Client']
const requiredAssets: Array<keyof Vault['balances']> = ['Dollars', 'Euro', 'LYD', 'Gold', 'Silver']

const isValidVault = (input: unknown): input is Vault => {
  if (!input || typeof input !== 'object') return false
  const vault = input as Record<string, unknown>

  if (typeof vault.id !== 'string' || !vault.id) return false
  if (typeof vault.name !== 'string' || !vault.name) return false
  if (!validKinds.includes(vault.kind as Vault['kind'])) return false
  if (!vault.balances || typeof vault.balances !== 'object') return false

  const balances = vault.balances as Record<string, unknown>
  return requiredAssets.every((asset) => {
    const value = balances[asset]
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
  })
}

export async function GET() {
  try {
    const items = await getVaults()
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Failed to load vaults', error)
    return NextResponse.json({ error: 'Unable to load vaults right now.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { items?: unknown[] }
    const items = payload.items

    if (!Array.isArray(items) || items.length === 0 || !items.every(isValidVault)) {
      return NextResponse.json({ error: 'Invalid vault payload.' }, { status: 400 })
    }

    await replaceVaults(items)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to store vaults', error)
    return NextResponse.json({ error: 'Unable to store vault balances right now.' }, { status: 500 })
  }
}
