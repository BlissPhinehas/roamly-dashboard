import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { childName, emotionData, routineData, gameData, customPrompt } = await req.json();

  const emotionSummary = emotionData.length > 0
    ? emotionData.map((e: any) => e.island).join(', ')
    : 'no emotions recorded';

  const routineSummary = routineData.length > 0
    ? routineData.map((r: any) => {
        const done  = r.steps?.filter((s: any) => s.completed).length || 0;
        const total = r.steps?.length || 0;
        return `${r.date}: ${done}/${total} steps`;
      }).join(', ')
    : 'no routines recorded';

  const gameContext = gameData?.length > 0
    ? `\nGame performance this week: ${gameData.map((g: any) => `${g.game_type} (best: ${g.best_score}, accuracy: ${g.accuracy || 'N/A'}%)`).join(', ')}.`
    : '';

  const prompt = `You are a compassionate child development assistant helping caregivers of nonverbal and autistic children.

Child's name: ${childName}
This week's emotion check-ins: ${emotionSummary}
This week's routine completion: ${routineSummary}${gameContext}
${customPrompt ? `\nCaregiver's specific question: "${customPrompt}"` : ''}

Please provide:
1. A warm, plain-English weekly summary (2-3 sentences)
2. 2-3 patterns you observe in the data
3. 2-3 actionable suggestions for the caregiver
4. 2-3 helpful resources with title, url, and description

Return ONLY valid JSON in this exact format, no markdown:
{
  "summary": "string",
  "patterns": ["string", "string"],
  "suggestions": ["string", "string"],
  "resources": [
    { "title": "string", "url": "string", "description": "string" }
  ]
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await res.json();
    const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const insights = JSON.parse(clean);
    return NextResponse.json({ insights });
  } catch (_) {
    return NextResponse.json({
      insights: {
        summary: `${childName} had an active week. Keep encouraging their progress with consistent routines and emotional check-ins.`,
        patterns: ['Regular emotional check-ins were recorded this week.', 'Routine participation was tracked across multiple days.'],
        suggestions: ['Maintain consistent daily routines to build predictability.', 'Celebrate small wins to reinforce positive behaviour.'],
        resources: [
          { title: 'Autism Speaks', url: 'https://www.autismspeaks.org', description: 'Resources and support for autism families.' },
          { title: 'CDC Developmental Milestones', url: 'https://www.cdc.gov/ncbddd/actearly', description: 'Track developmental progress with CDC guidance.' },
        ],
      },
    });
  }
}
