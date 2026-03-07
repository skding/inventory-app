import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log('--- Manual User Creation ---');

    if (!process.env.DATABASE_URL) {
        console.error('Error: DATABASE_URL not found in environment variables.');
        process.exit(1);
    }

    const email = await new Promise<string>((resolve) => {
        rl.question('Enter email: ', resolve);
    });

    const password = await new Promise<string>((resolve) => {
        rl.question('Enter password: ', resolve);
    });

    if (!email || !password) {
        console.error('Email and password are required.');
        process.exit(1);
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });

        console.log(`User created successfully: ${user.email} (ID: ${user.id})`);
    } catch (error: any) {
        if (error.code === 'P2002') {
            console.error('User with this email already exists.');
        } else {
            console.error('Error creating user:', error);
        }
    } finally {
        await prisma.$disconnect();
        await pool.end();
        rl.close();
    }
}

main();
