// Converts Prisma Decimal fields to plain numbers so they can be
// safely passed from Server Components to Client Components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}
