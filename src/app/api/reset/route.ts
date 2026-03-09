import { NextRequest, NextResponse } from 'next/server'
import { resetAllSources } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { confirm?: boolean }

    if (body.confirm !== true) {
      return NextResponse.json({ error: 'Reset requires { confirm: true }.' }, { status: 400 })
    }

    await resetAllSources()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to reset sources', error)
    return NextResponse.json({ error: 'Unable to reset data right now.' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const confirm = request.nextUrl.searchParams.get('confirm')
    if (confirm !== 'YES') {
      return NextResponse.json({ error: 'Reset requires ?confirm=YES' }, { status: 400 })
    }

    await resetAllSources()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to reset sources', error)
    return NextResponse.json({ error: 'Unable to reset data right now.' }, { status: 500 })
  }
}
