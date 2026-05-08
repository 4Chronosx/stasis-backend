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
	},
	apis: ["./src/index.ts", "./src/modules/**/*.routes.ts", "./src/modules/**/*.controller.ts", "./dist/**/*.js"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
