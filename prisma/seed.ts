import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const adminHash    = await bcrypt.hash('Admin@1234', 12)
  const landlordHash = await bcrypt.hash('Landlord@1234', 12)
  const tenantHash   = await bcrypt.hash('Tenant@1234', 12)

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@bahirdarhomes.com' },
    update: {},
    create: { email: 'admin@bahirdarhomes.com', passwordHash: adminHash, fullName: 'Admin User', role: 'ADMIN' },
  })

  const landlord = await prisma.user.upsert({
    where:  { email: 'landlord@example.com' },
    update: {},
    create: { email: 'landlord@example.com', passwordHash: landlordHash, fullName: 'Abebe Kebede', role: 'LANDLORD' },
  })

  await prisma.user.upsert({
    where:  { email: 'tigist@example.com' },
    update: {},
    create: { email: 'tigist@example.com', passwordHash: tenantHash, fullName: 'Tigist Alemu', role: 'TENANT' },
  })

  const properties = [
    {
      title: '2-Bedroom Apartment near BDU',
      description: 'Modern apartment close to Bahir Dar University. Quiet neighborhood, great for students and professionals.',
      listingType: 'RENT' as const, propertyType: 'APARTMENT' as const, subCity: 'FASILO' as const,
      streetAddress: 'Near BDU Main Gate', price: 6000, bedrooms: 2, bathrooms: 1, areaSqm: 75,
      hasWaterTank: true, hasBackupPower: true, isFurnished: false, hasParking: false, hasInternet: true, hasGuard: true,
      distBduMain: 300, distCityCenter: 1500, verificationStatus: 'VERIFIED' as const,
    },
    {
      title: 'Furnished Studio near Lake Tana',
      description: 'Beautiful furnished studio with lake view. Perfect for single professionals.',
      listingType: 'RENT' as const, propertyType: 'STUDIO' as const, subCity: 'TANA' as const,
      streetAddress: 'Tana Waterfront Area', price: 4500, bedrooms: 0, bathrooms: 1, areaSqm: 40,
      hasWaterTank: true, hasBackupPower: false, isFurnished: true, hasParking: false, hasInternet: true, hasGuard: false,
      distLakeTana: 200, distCityCenter: 800, verificationStatus: 'VERIFIED' as const,
    },
    {
      title: '3-Bedroom Villa with Garden',
      description: 'Spacious villa with private garden and parking. Ideal for families.',
      listingType: 'RENT' as const, propertyType: 'VILLA' as const, subCity: 'BELAY_ZELEKE' as const,
      streetAddress: 'Belay Zeleke Residential Area', price: 15000, bedrooms: 3, bathrooms: 2, areaSqm: 200,
      hasWaterTank: true, hasBackupPower: true, isFurnished: true, hasParking: true, hasInternet: true, hasGuard: true,
      distCityCenter: 2000, distMarket: 500, verificationStatus: 'VERIFIED' as const,
    },
    {
      title: 'Commercial Space in City Center',
      description: 'Prime commercial space suitable for office or retail. High foot traffic area.',
      listingType: 'RENT' as const, propertyType: 'COMMERCIAL' as const, subCity: 'GINBOT_20' as const,
      streetAddress: 'Main Commercial Street', price: 25000, bedrooms: 0, bathrooms: 1, areaSqm: 120,
      hasWaterTank: false, hasBackupPower: true, isFurnished: false, hasParking: true, hasInternet: true, hasGuard: true,
      distCityCenter: 100, verificationStatus: 'PENDING' as const,
    },
    {
      title: 'Land for Sale - Sefene Selam',
      description: '500 sqm land with title deed. Suitable for residential construction.',
      listingType: 'SALE' as const, propertyType: 'LAND' as const, subCity: 'SEFENE_SELAM' as const,
      price: 800000, bedrooms: 0, bathrooms: 0, areaSqm: 500,
      hasWaterTank: false, hasBackupPower: false, isFurnished: false, hasParking: false, hasInternet: false, hasGuard: false,
      verificationStatus: 'STANDARD' as const,
    },
  ]

  for (const prop of properties) {
    await prisma.property.create({ data: { ...prop, ownerId: landlord.id } })
  }

  console.log('✅ Seed complete!')
  console.log('📧 Test accounts:')
  console.log('   Admin:    admin@bahirdarhomes.com  / Admin@1234')
  console.log('   Landlord: abebe@example.com        / Landlord@1234')
  console.log('   Tenant:   tigist@example.com       / Tenant@1234')
}

main().catch(console.error).finally(() => prisma.$disconnect())
