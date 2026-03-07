import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log('--- Manual User Creation ---');

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
        rl.close();
    }
}

main();
