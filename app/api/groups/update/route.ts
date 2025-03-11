import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!id || !name) {
      return NextResponse.json(
        { error: "Group ID and name are required" },
        { status: 400 }
      );
    }

    // Check if the group exists and belongs to the user
    const existingGroup = await prisma.group.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Update the group
    await prisma.group.update({
      where: { id },
      data: {
        name,
        description: description || null,
      },
    });

    // Redirect to the group detail page instead of returning JSON
    return NextResponse.redirect(new URL(`/groups/${id}`, request.url));
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}