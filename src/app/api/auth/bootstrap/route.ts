import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Temporary DB introspection endpoint. Remove after use.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "bootstrap-2026-xyz") {
    return NextResponse.json({ error: "no" }, { status: 403 });
  }

  try {
    // Get all tables and their columns
    const columns: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        c.udt_name
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      WHERE t.table_schema = 'public'
      ORDER BY t.table_name, c.ordinal_position
    `);

    // Get all unique constraints and indexes
    const indexes: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        t.relname AS table_name,
        i.relname AS index_name,
        ix.indisunique AS is_unique,
        ix.indisprimary AS is_primary,
        array_agg(a.attname ORDER BY k.n) AS columns
      FROM pg_index ix
      JOIN pg_class t ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_namespace ns ON ns.oid = t.relnamespace
      CROSS JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, n)
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
      WHERE ns.nspname = 'public'
      GROUP BY t.relname, i.relname, ix.indisunique, ix.indisprimary
      ORDER BY t.relname, i.relname
    `);

    // Get foreign keys
    const fkeys: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `);

    // Get enums
    const enums: any[] = await prisma.$queryRawUnsafe(`
      SELECT t.typname AS enum_name, e.enumlabel AS enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder
    `);

    // Organize by table
    const tables: Record<string, any> = {};
    for (const col of columns) {
      if (!tables[col.table_name]) {
        tables[col.table_name] = { columns: [], indexes: [], fkeys: [] };
      }
      tables[col.table_name].columns.push({
        name: col.column_name,
        type: col.udt_name,
        dataType: col.data_type,
        nullable: col.is_nullable === "YES",
        default: col.column_default,
        maxLength: col.character_maximum_length,
      });
    }

    // Add indexes
    for (const idx of indexes) {
      if (tables[idx.table_name]) {
        tables[idx.table_name].indexes.push({
          name: idx.index_name,
          unique: idx.is_unique,
          primary: idx.is_primary,
          columns: idx.columns,
        });
      }
    }

    // Add foreign keys
    for (const fk of fkeys) {
      if (tables[fk.table_name]) {
        tables[fk.table_name].fkeys.push({
          column: fk.column_name,
          foreignTable: fk.foreign_table_name,
          foreignColumn: fk.foreign_column_name,
        });
      }
    }

    // Organize enums
    const enumMap: Record<string, string[]> = {};
    for (const e of enums) {
      if (!enumMap[e.enum_name]) enumMap[e.enum_name] = [];
      enumMap[e.enum_name].push(e.enum_value);
    }

    return NextResponse.json({
      tableCount: Object.keys(tables).length,
      tables,
      enums: enumMap,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack?.substring(0, 1000) }, { status: 500 });
  }
}
