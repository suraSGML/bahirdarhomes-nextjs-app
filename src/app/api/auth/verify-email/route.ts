import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({ token: z.string().min(1) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const record = await prisma.emailVerification.findUnique({
      where: { token: parsed.data.token },
      include: { user: true },
    })

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired verification link.' }, { status: 400 })
    }
    if (record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This verification link has expired. Please request a new one.' }, { status: 400 })
    }
    if (record.user.isEmailVerified) {
      return NextResponse.json({ message: 'Email already verified.' })
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { isEmailVerified: true } }),
      prisma.emailVerification.delete({ where: { id: record.id } }),
    ])

    return NextResponse.json({ message: 'Email verified successfully! You can now sign in.' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// Resend verification email
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.isEmailVerified) {
      return NextResponse.json({ message: 'If applicable, a new verification email has been sent.' })
    }

    // Delete old tokens
    await prisma.emailVerification.deleteMany({ where: { userId: user.id } })

    const { randomBytes } = await import('crypto')
    const token = randomBytes(32).toString('hex')
    await prisma.emailVerification.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    })

    const { sendEmailVerificationEmail } = await import('@/lib/email')
    await sendEmailVerificationEmail(email, token, user.fullName)

    return NextResponse.json({ message: 'Verification email sent.' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
