import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get("barcode");
    const categoryId = searchParams.get("category_id");
    const archivedParam = searchParams.get("archived");

    try {
        if (barcode) {
            const item = await prisma.item.findUnique({
                where: { barcode },
                include: { category: true },
            });
            return NextResponse.json(item);
        }

        const whereClause: any = {};
        if (categoryId) {
            whereClause.category_id = categoryId === "null" ? null : categoryId;
        }
        if (archivedParam === "true") {
            whereClause.is_archived = true;
        } else if (archivedParam === "false") {
            whereClause.is_archived = false;
        }

        const items = await prisma.item.findMany({
            where: whereClause,
            orderBy: { name: "asc" },
            include: { category: true },
        });
        return NextResponse.json(items);
    } catch (error) {
        console.error("Fetch items error:", error);
        return NextResponse.json({ message: "Error fetching items" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    try {
        const { sku, barcode, name, description, quantity, unit_of_measure, project_id, category_id } = await req.json();

        if (!barcode || !name) {
            return NextResponse.json({ message: "Barcode and Name are required" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const item = await tx.item.create({
                data: {
                    sku: sku || null,
                    barcode,
                    name,
                    description: description || null,
                    quantity: quantity || 0,
                    unit_of_measure: unit_of_measure || null,
                    category_id: category_id || null,
                },
                include: { category: true },
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
        if (error.code === "P2002") {
            return NextResponse.json({ message: "Barcode or SKU already exists" }, { status: 400 });
        }
        return NextResponse.json({ message: "Error creating item" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const { id, category_id, name, description, sku, unit_of_measure, barcode, is_archived } = await req.json();

        if (!id) return NextResponse.json({ message: "Item ID is required" }, { status: 400 });

        const updateData: any = {};
        if (category_id !== undefined) updateData.category_id = category_id || null;
        if (is_archived !== undefined) updateData.is_archived = Boolean(is_archived);
        if (name !== undefined) {
            if (!name.trim()) {
                return NextResponse.json({ message: "Item name cannot be empty" }, { status: 400 });
            }
            updateData.name = name.trim();
        }
        if (barcode !== undefined) {
            if (!barcode.trim()) {
                return NextResponse.json({ message: "Barcode cannot be empty" }, { status: 400 });
            }
            updateData.barcode = barcode.trim();
        }
        if (description !== undefined) updateData.description = description ? description.trim() : null;
        if (sku !== undefined) updateData.sku = sku ? sku.trim() : null;
        if (unit_of_measure !== undefined) updateData.unit_of_measure = unit_of_measure ? unit_of_measure.trim() : null;

        const updatedItem = await prisma.item.update({
            where: { id },
            data: updateData,
            include: { category: true },
        });

        return NextResponse.json(updatedItem);
    } catch (error: any) {
        console.error("Update item error:", error);
        if (error.code === "P2002") {
            return NextResponse.json({ message: "Barcode or SKU already exists" }, { status: 400 });
        }
        return NextResponse.json({ message: "Error updating item" }, { status: 500 });
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
