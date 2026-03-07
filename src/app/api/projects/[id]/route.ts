import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const { name, description, is_archived } = await req.json();
        const project = await prisma.project.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(is_archived !== undefined && { is_archived })
            },
        });
        return NextResponse.json(project);
    } catch (error) {
        return NextResponse.json({ message: "Error updating project" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        await prisma.project.delete({
            where: { id },
        });
        return NextResponse.json({ message: "Project deleted" });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting project" }, { status: 500 });
    }
}
