// app/api/contacts/import/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const groupId = formData.get("groupId") as string;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Validate data format
    if (!data.length) {
      return NextResponse.json(
        { error: "Excel file is empty" },
        { status: 400 }
      );
    }
    
    // Process contacts
    const results = {
      added: 0,
      errors: 0,
      duplicates: 0,
    };
    
    for (const row of data) {
      const record = row as Record<string, string>;
      
      // Skip rows without email
      if (!record.email && !record.Email) {
        results.errors++;
        continue;
      }
      
      const email = (record.email || record.Email).toString().trim();
      const firstName = (record.firstName || record.FirstName || '').toString();
      const lastName = (record.lastName || record.LastName || '').toString();
      
      try {
        // Check if contact exists
        const existingContact = await prisma.contact.findFirst({
          where: { email },
        });
        
        let contactId;
        
        if (existingContact) {
          contactId = existingContact.id;
          results.duplicates++;
        } else {
          // Create new contact
          const newContact = await prisma.contact.create({
            data: { email, firstName, lastName },
          });
          contactId = newContact.id;
          results.added++;
        }
        
        // Add to group if specified
        if (groupId) {
          await prisma.groupContact.upsert({
            where: {
              groupId_contactId: {
                groupId,
                contactId,
              },
            },
            update: {},
            create: {
              groupId,
              contactId,
            },
          });
        }
      } catch (error) {
        console.error('Error processing contact:', error);
        results.errors++;
      }
    }
    
    return NextResponse.json({
      message: "Import completed",
      results,
    });
  } catch (error) {
    console.error('Error importing contacts:', error);
    return NextResponse.json(
      { error: "Failed to import contacts" },
      { status: 500 }
    );
  }
}