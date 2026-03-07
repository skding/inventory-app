import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const totalItems = await prisma.item.count();
        const activeProjects = await prisma.project.count({
            where: { is_archived: false },
        });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentTransactions = await prisma.transaction.count({
            where: {
                timestamp: {
                    gte: thirtyDaysAgo,
                },
            },
        });

        return NextResponse.json({
            totalItems,
            activeProjects,
            recentTransactions,
        });
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json({ message: "Error fetching stats" }, { status: 500 });
    }
}
