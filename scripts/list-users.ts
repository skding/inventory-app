import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('--- Existing Users ---');
        users.forEach(u => console.log(`- ${u.email}`));
    } catch (error) {
        console.error('Error listing users:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
