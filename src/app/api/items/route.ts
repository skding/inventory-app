import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get("barcode");

    try {
        if (barcode) {
            const item = await prisma.item.findUnique({
                where: { barcode },
            });
            return NextResponse.json(item);
        }

        const items = await prisma.item.findMany({
            orderBy: { name: "asc" },
        });
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching items" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    try {
        const { sku, barcode, name, description, quantity, unit_of_measure, project_id } = await req.json();

        if (!barcode || !name) {
            return NextResponse.json({ message: "Barcode and Name are required" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const item = await tx.item.create({
                data: {
                    sku,
                    barcode,
                    name,
                    description,
                    quantity: quantity || 0,
                    unit_of_measure,
                },
            });

            if (quantity > 0) {
                await tx.transaction.create({
                    data: {
                        item_id: item.id,
                        type: "IN",
                        quantity,
                        project_id: project_id || null,
                        user_id: userId,
                    },
                });
            }
            return item;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("Create item error:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ message: "Barcode or SKU already exists" }, { status: 400 });
        }
        return NextResponse.json({ message: "Error creating item" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ message: "ID is required" }, { status: 400 });

    try {
        await prisma.item.delete({
            where: { id },
        });
        return NextResponse.json({ message: "Item deleted successfully" });
    } catch (error) {
        console.error("Delete item error:", error);
        return NextResponse.json({ message: "Error deleting item" }, { status: 500 });
    }
}
