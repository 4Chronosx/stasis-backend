import multer from "multer";
import { RequestHandler } from "express";

/**
 * Multer middleware for handling file uploads.
 * Uses memory storage (no disk writes) — the file buffer is available on req.file.
 */
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
});

export const uploadFile: RequestHandler = (req, res, next) => {
	upload.single("file")(req, res, (err: unknown) => {
		if (err) {
			const message = err instanceof Error ? err.message : "File upload error";
			if (message === "Field name missing") {
				return res.status(400).json({
					error: "Malformed form-data. Ensure your file field has the key 'file'."
				});
			}
			return res.status(400).json({ error: message });
		}

		next();
	});
};
