import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./env";

const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Stasis API",
			version: "1.0.0",
			description: "API documentation for the Stasis backend.",
		},
		servers: [
			{
				url: `http://localhost:${env.PORT}`,
				description: "Local",
			},
		],
		components: {
			securitySchemes: {
				cookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "token",
				},
			},
			schemas: {
				User: {
					type: "object",
					properties: {
						id: { type: "string" },
						userId: { type: "string" },
						email: { type: "string", format: "email" },
						name: { type: "string" },
						pictureUrl: { type: "string" },
					},
				},
				Deck: {
					type: "object",
					properties: {
						id: { type: "integer" },
						user_id: { type: "string" },
						name: { type: "string" },
						description: { type: "string", nullable: true },
						created_at: { type: "string", format: "date-time" },
						updated_at: { type: "string", format: "date-time" },
					},
				},
				Card: {
					type: "object",
					properties: {
						id: { type: "integer" },
						deck_id: { type: "integer" },
						front: { type: "string" },
						back: { type: "string" },
						due: { type: "string", format: "date-time" },
						stability: { type: "number" },
						difficulty: { type: "number" },
						scheduled_days: { type: "integer" },
						reps: { type: "integer" },
						lapses: { type: "integer" },
						state: { type: "integer" },
						last_review: { type: "string", format: "date-time", nullable: true },
					},
				},
				SessionCard: {
					type: "object",
					properties: {
						id: { type: "integer" },
						front: { type: "string" },
						back: { type: "string" },
						state: { type: "integer" },
						intervals: {
							type: "object",
							properties: {
								again: { type: "string", format: "date-time" },
								hard: { type: "string", format: "date-time" },
								good: { type: "string", format: "date-time" },
								easy: { type: "string", format: "date-time" },
							},
						},
					},
				},
			},
		},
	},
	apis: ["./src/config/openapi.paths.yaml"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
