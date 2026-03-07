import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    try {
        const body = await req.json();
        const { barcode, type, quantity: rawQuantity, project_id } = body;
        const quantity = parseInt(rawQuantity);

        if (!barcode || !type || isNaN(quantity)) {
            return NextResponse.json({ message: "Missing required fields or invalid quantity" }, { status: 400 });
        }

        // Find item by barcode
        const item = await prisma.item.findUnique({
            where: { barcode },
        });

        if (!item) {
            return NextResponse.json({ message: "Item not found" }, { status: 404 });
        }

        // Calculate new quantity
        let newQuantity = item.quantity;
        if (type === "IN") {
            newQuantity += quantity;
        } else if (type === "OUT") {
            if (item.quantity < quantity) {
                return NextResponse.json({ message: "Insufficient stock" }, { status: 400 });
            }
            newQuantity -= quantity;
        }

        // Update item and create transaction in a transaction
        const [updatedItem, transaction] = await prisma.$transaction([
            prisma.item.update({
                where: { id: item.id },
                data: { quantity: newQuantity },
            }),
            prisma.transaction.create({
                data: {
                    item_id: item.id,
                    type,
                    quantity,
                    project_id: project_id || null,
                    user_id: userId,
                },
            }),
        ]);

        return NextResponse.json({ updatedItem, transaction });
    } catch (error: any) {
        console.error("Transaction API error detail:", error);
        return NextResponse.json({
            message: "Error recording transaction",
            error: error.message
        }, { status: 500 });
    }
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const transactions = await prisma.transaction.findMany({
            include: {
                item: true,
                project: true,
                user: true,
            },
            orderBy: { timestamp: "desc" },
            take: 50,
        });
        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching transactions" }, { status: 500 });
    }
}
