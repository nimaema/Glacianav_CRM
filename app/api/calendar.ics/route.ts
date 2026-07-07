import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function icsDate(d: Date) {
  return d.toISOString().slice(0, 10).replaceAll("-", "");
}

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

// Subscribe to this URL from Google/Apple Calendar to see interviews.
export async function GET() {
  const contacts = await prisma.contact.findMany({
    where: { interviewDate: { not: null } },
    select: { id: true, name: true, company: true, interviewDate: true, updatedAt: true },
  });

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GlaciaNav//CRM//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:GlaciaNav CRM interviews",
  ];

  for (const c of contacts) {
    const summary = c.company ? `Interview: ${c.name} (${c.company})` : `Interview: ${c.name}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${c.id}@crm.glacianav`,
      `DTSTAMP:${c.updatedAt.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `DTSTART;VALUE=DATE:${icsDate(c.interviewDate!)}`,
      `SUMMARY:${escapeText(summary)}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="glacianav-crm.ics"',
    },
  });
}
