import { NextResponse } from 'next/server'
import { pocketbase } from '@/lib/pocketbase'
import { seedVaults } from '@/lib/trading'

export async function GET() {
  try {
    if (!pocketbase) {
      return NextResponse.json({ items: seedVaults })
    }

    const result = await pocketbase.collection('vaults').getFullList({ sort: 'name' })
    return NextResponse.json({ items: result })
  } catch {
    return NextResponse.json({ items: seedVaults })
  }
}
