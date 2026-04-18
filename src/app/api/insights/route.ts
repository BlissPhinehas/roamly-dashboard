import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { childName, emotionData, routineData, gameData, customPrompt } = await req.json();

  const userPrompt = customPrompt ? `\n\nThe caregiver has a specific question: "${customPrompt}"` : '';
  
  const gameContext = gameData?.length > 0
    ? `\n\nGame performance this week: ${gameData.map((g: any) => `${g.game_type} (best: ${g.best_score}, accuracy: ${g.accuracy || 'N/A'}%)`).join(', ')}.`
    : '';

  const prompt = `You are a compassionate child development assistant helping caregivers of nonverbal and autistic children understand their child's week.

Child's name: ${childName}

Emotion check-in data this week:
${JSON.stringify(emotionData, null, 2)}

Daily routine completion this week:
${JSON.stringify(routineData, null, 2)}${gameContext}${userPrompt}

Here is what I need from you — respond ONLY as a valid JSON object with these exact fields:

{
  "summary": "2-3 warm sentences summarizing the child's week in plain language a parent can understand",
  "patterns": ["observation 1", "observation 2", "observation 3"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2"],
  "resources": [
    { "title": "Resource name", "url": "https://...", "description": "One sentence about why this helps" }
  ]
}

For resources, only use real reputable links from: CDC (cdc.gov), ABAI (abainternational.org), Autism Speaks (autismspeaks.org), ASHA (asha.org), or AAP (healthychildren.org).
Be warm, specific, and avoid clinical jargon. Write as if speaking to a loving parent.
Return ONLY the JSON object. No markdown, no explanation.`;

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
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const insights = JSON.parse(clean);
    return NextResponse.json({ ok: true, insights });
  } catch (e) {
    // Fallback so the dashboard never breaks even if Gemini is down
    return NextResponse.json({
      ok: true,
      insights: {
        summary: `${childName} had an active week. Check the emotion and routine panels below for a detailed breakdown of their progress.`,
        patterns: [
          'Review the emotion check-ins to spot recurring feelings across the week.',
          'Look at routine completion rates to identify which parts of the day go smoothly.',
          'Morning and evening patterns often reveal the most about a child\'s comfort levels.',
        ],
        suggestions: [
          'If you notice recurring overwhelmed or sad check-ins, consider adding a scheduled calm break.',
          'Share this report with your ABA therapist or speech therapist at your next session.',
        ],
        resources: [
          { title: 'CDC Autism Resources', url: 'https://www.cdc.gov/autism', description: 'Evidence-based information on autism spectrum disorder from the CDC.' },
          { title: 'Find an ABA Therapist', url: 'https://www.abainternational.org/i-need-help/find-a-behavior-analyst.aspx', description: 'Official ABAI directory to locate certified behavior analysts near you.' },
          { title: 'Autism Speaks Tool Kit', url: 'https://www.autismspeaks.org/tool-kits', description: 'Free downloadable guides for caregivers covering daily routines, communication, and more.' },
          { title: 'AAP Developmental Milestones', url: 'https://www.healthychildren.org/English/ages-stages/Pages/default.aspx', description: 'Age-by-age developmental guidance from the American Academy of Pediatrics.' },
        ],
      },
    });
  }
}
