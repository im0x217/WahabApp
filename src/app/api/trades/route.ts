import { NextRequest, NextResponse } from 'next/server'
import { createTransaction, getTransactions } from '@/lib/db'
import { Transaction } from '@/types/trading'

const validTradeTypes: Transaction['type'][] = ['Buy', 'Sell', 'Incoming', 'Outgoing']
const validAssets: Transaction['asset'][] = ['Dollars', 'LYD', 'Gold', 'Silver']

const isIsoDate = (value: string) => !Number.isNaN(Date.parse(value))

const parseTradePayload = (input: unknown): (Omit<Transaction, 'id'> & { id?: string }) | null => {
  if (!input || typeof input !== 'object') return null
  const candidate = input as Record<string, unknown>

  const id = typeof candidate.id === 'string' ? candidate.id : undefined
  const vaultId = typeof candidate.vaultId === 'string' ? candidate.vaultId : ''
  const type = candidate.type
  const asset = candidate.asset
  const amount = typeof candidate.amount === 'number' ? candidate.amount : Number.NaN
  const rate = typeof candidate.rate === 'number' ? candidate.rate : Number.NaN
  const description = typeof candidate.description === 'string' ? candidate.description : undefined
  const timestamp = typeof candidate.timestamp === 'string' ? candidate.timestamp : ''

  if (!vaultId || !validTradeTypes.includes(type as Transaction['type']) || !validAssets.includes(asset as Transaction['asset'])) {
    return null
  }

  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(rate) || rate < 0) {
    return null
  }

  if (!timestamp || !isIsoDate(timestamp)) {
    return null
  }

  return {
    id,
    vaultId,
    type: type as Transaction['type'],
    asset: asset as Transaction['asset'],
    amount,
    rate,
    description,
    timestamp,
  }
}

export async function GET() {
  try {
    const items = await getTransactions()
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

export async function POST(request: NextRequest) {
  const payload = parseTradePayload(await request.json())

  if (!payload) {
    return NextResponse.json({ error: 'Invalid trade payload.' }, { status: 400 })
  }

  try {
    const record = await createTransaction({
      id: payload.id ?? crypto.randomUUID(),
      vaultId: payload.vaultId,
      type: payload.type,
      asset: payload.asset,
      amount: payload.amount,
      rate: payload.rate,
      description: payload.description,
      timestamp: payload.timestamp,
    })
    return NextResponse.json(record, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unable to store trade right now.' }, { status: 500 })
  }
}
