import { NextResponse } from 'next/server';

// We generate the PDF on the client using jsPDF to keep this route simple.
// This route exists as a placeholder if you want server-side generation later.
export async function POST(req: Request) {
  return NextResponse.json({ ok: true, message: 'Use client-side jsPDF export.' });
}
