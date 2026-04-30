import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { sendEmailVerificationEmail } from '@/lib/email'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  role:     z.enum(['TENANT', 'LANDLORD']).default('TENANT'),
})

export async function POST(req: NextRequest) {
  // Rate limit: 10 registrations per hour per IP
  const ip = getClientIp(req)
  const rl = rateLimit(ip, 'register', { limit: 10, windowSec: 60 * 60 })
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { email, password, fullName, role } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { email, passwordHash, fullName, role },
    })

    // Send verification email (fire-and-forget)
    const verifyToken = randomBytes(32).toString('hex')
    prisma.emailVerification.create({
      data: { userId: user.id, token: verifyToken, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    }).then(() => sendEmailVerificationEmail(email, verifyToken, fullName)).catch(() => {})

    const token = await signToken({ userId: user.id, email: user.email, role: user.role })

    const response = NextResponse.json({
      token,
      user: { userId: user.id, email: user.email, role: user.role, fullName: user.fullName, avatarUrl: user.avatarUrl },
    }, { status: 201 })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
