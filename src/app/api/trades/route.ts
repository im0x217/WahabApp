import { NextRequest, NextResponse } from 'next/server'
import { pocketbase } from '@/lib/pocketbase'
import { Transaction } from '@/types/trading'

const fallbackTrades: Transaction[] = []

export async function GET() {
  try {
    if (!pocketbase) {
      return NextResponse.json({ items: fallbackTrades })
    }

    const items = await pocketbase.collection('transactions').getFullList({ sort: '-timestamp' })
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: fallbackTrades })
  }
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Omit<Transaction, 'id'>

  try {
    if (!pocketbase) {
      const record = { ...payload, id: crypto.randomUUID() }
      fallbackTrades.push(record)
      return NextResponse.json(record, { status: 201 })
    }

    const record = await pocketbase.collection('transactions').create(payload)
    return NextResponse.json(record, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unable to store trade right now.' }, { status: 500 })
  }
}
