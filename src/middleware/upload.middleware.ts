import multer from "multer";

/**
 * Multer middleware for handling file uploads.
 * Uses memory storage (no disk writes) — the file buffer is available on req.file.
 */
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
	fileFilter: (_req, file, cb) => {
		if (file.mimetype === "application/pdf") {
			cb(null, true);
		} else {
			cb(new Error("Only PDF files are accepted"));
		}
	},
});

export const uploadPdf = upload.single("pdf");
