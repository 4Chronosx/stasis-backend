import { google_ai } from "../../config/google";

export type GeneratedDeck = {
	name: string;
	description: string;
	cards: { question: string; answer: string }[];
};

/**
 * Sends a PDF to the Gemini API and returns generated flashcard data.
 *
 * @param pdfBuffer  Raw PDF file buffer (from multer memory storage)
 * @param cardCount  Maximum number of cards to generate (capped at 30)
 * @param name       Optional deck name — if omitted, Gemini generates one
 */
export async function generateDeck(
	pdfBuffer: Buffer,
	cardCount: number,
	name?: string,
): Promise<GeneratedDeck> {
	const pdfBase64 = pdfBuffer.toString("base64");

	const nameInstruction = name
		? `Use "${name}" as the deck name.`
		: `Generate a concise, descriptive deck name based on the main topic of the PDF.`;

	const prompt = `
You are an expert instructional designer converting a single document (the provided lesson text from a PDF) into objective, auto-gradable flashcards.

Critical constraints (enforce strictly):
- STRICT TOPIC: Use ONLY information present in the provided PDF. Do NOT introduce facts, examples, or context not found in the text.
- NO OUTSIDE KNOWLEDGE: Do not rely on or add external information, dates, author names, or references not in the document.
- If the PDF does not contain enough information to produce the requested number of cards, produce as many valid objective cards as possible and include no invented content.

Question and Format rules:
- Objective and auto-gradable only (single word, short phrase, number, TRUE/FALSE, or fill-in-the-blank).
- Avoid "why", "explain", or other open-ended phrasing.
- Prefer definitions, identification, true/false, fill-the-blank, or short numeric/application checks.
- Answers should be concise and directly verifiable from the text.

Return behavior:
- ${nameInstruction}
- Generate a short description (1-2 sentences) summarizing what the deck covers based on the PDF content.
- Create up to ${cardCount} objective, auto-gradable flashcards.
- If you cannot create the requested number of cards without inventing content, return fewer cards. Do NOT fabricate content.

Output format:
Return ONLY a valid JSON object with exactly these keys:
{
  "name": "string",
  "description": "string",
  "cards": [
    { "question": "string", "answer": "string" }
  ]
}

No markdown, no commentary, no explanations — only the JSON object.
	`.trim();

	const response = await google_ai.models.generateContent({
		model: "gemini-3.1-flash-lite",
		contents: [
			{
				inlineData: {
					mimeType: "application/pdf",
					data: pdfBase64,
				},
			},
			{ text: prompt },
		],
	});

	const rawText = response.text?.trim();
	if (!rawText) {
		throw new Error("Gemini returned an empty response");
	}

	// Strip markdown code fences if Gemini wraps the response
	const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

	let parsed: unknown;
	try {
		parsed = JSON.parse(cleaned);
	} catch {
		throw new Error("Failed to parse Gemini response as JSON");
	}

	// Validate structure
	if (
		!parsed ||
		typeof parsed !== "object" ||
		!("name" in parsed) ||
		!("description" in parsed) ||
		!("cards" in parsed) ||
		!Array.isArray((parsed as GeneratedDeck).cards)
	) {
		throw new Error("Gemini response does not match expected schema");
	}

	const result = parsed as GeneratedDeck;

	// Filter out any malformed cards
	result.cards = result.cards.filter(
		(card) =>
			card &&
			typeof card.question === "string" &&
			card.question.trim().length > 0 &&
			typeof card.answer === "string" &&
			card.answer.trim().length > 0,
	);

	return result;
}
