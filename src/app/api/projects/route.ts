import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const projects = await prisma.project.findMany({
            orderBy: { created_at: "desc" },
        });
        return NextResponse.json(projects);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching projects" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const { name, description } = await req.json();
        if (!name) return NextResponse.json({ message: "Name is required" }, { status: 400 });

        const project = await prisma.project.create({
            data: { name, description },
        });
        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error creating project" }, { status: 500 });
    }
}
