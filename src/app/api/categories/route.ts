import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { items: true },
                },
                items: {
                    select: {
                        id: true,
                        name: true,
                        barcode: true,
                        quantity: true,
                        unit_of_measure: true,
                    },
                },
            },
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error("Fetch categories error:", error);
        return NextResponse.json({ message: "Error fetching categories" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const { name, description, color } = await req.json();

        if (!name || !name.trim()) {
            return NextResponse.json({ message: "Category name is required" }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                color: color || "#3b82f6",
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        console.error("Create category error:", error);
        if (error.code === "P2002") {
            return NextResponse.json({ message: "Category with this name already exists" }, { status: 400 });
        }
        return NextResponse.json({ message: "Error creating category" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const { id, name, description, color } = await req.json();

        if (!id) {
            return NextResponse.json({ message: "Category ID is required" }, { status: 400 });
        }

        if (!name || !name.trim()) {
            return NextResponse.json({ message: "Category name is required" }, { status: 400 });
        }

        const category = await prisma.category.update({
            where: { id },
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                color: color || "#3b82f6",
            },
        });

        return NextResponse.json(category);
    } catch (error: any) {
        console.error("Update category error:", error);
        if (error.code === "P2002") {
            return NextResponse.json({ message: "Category with this name already exists" }, { status: 400 });
        }
        return NextResponse.json({ message: "Error updating category" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ message: "Category ID is required" }, { status: 400 });

    try {
        await prisma.category.delete({
            where: { id },
        });
        return NextResponse.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Delete category error:", error);
        return NextResponse.json({ message: "Error deleting category" }, { status: 500 });
    }
}
