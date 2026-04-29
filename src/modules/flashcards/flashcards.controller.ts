import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { FlashcardsService } from "./flashcards.service";
import { createFlashcardSchema, updateFlashcardSchema } from "./flashcards.schema";

export const getFlashcard = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const flashcard = await FlashcardsService.findById(id);

    if (!flashcard) {
      return res.status(404).json({ message: "Flashcard not found" });
    }

    res.json(flashcard);
  } catch (error) {
    console.error("[FLASHCARDS] GET failed:", error);
    res.status(500).json({ message: "Failed to retrieve flashcard" });
  }
};

export const createFlashcard = async (req: AuthRequest, res: Response) => {
  try {
    const { body } = createFlashcardSchema.parse({ body: req.body });
    const flashcard = await FlashcardsService.create(body);
    res.status(201).json(flashcard);
  } catch (error) {
    console.error("[FLASHCARDS] POST failed:", error);
    res.status(500).json({ message: "Failed to create flashcard" });
  }
};

export const updateFlashcard = async (req: AuthRequest, res: Response) => {
  try {
    const { params, body } = updateFlashcardSchema.parse({
      params: req.params,
      body: req.body,
    });
    const id = Number(params.id);
    const flashcard = await FlashcardsService.update(id, body);

    if (!flashcard) {
      return res.status(404).json({ message: "Flashcard not found" });
    }

    res.json(flashcard);
  } catch (error) {
    console.error("[FLASHCARDS] PATCH failed:", error);
    res.status(500).json({ message: "Failed to update flashcard" });
  }
};

export const deleteFlashcard = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const deleted = await FlashcardsService.deleteById(id);

    if (!deleted) {
      return res.status(404).json({ message: "Flashcard not found" });
    }

    res.json({ message: "Flashcard deleted" });
  } catch (error) {
    console.error("[FLASHCARDS] DELETE failed:", error);
    res.status(500).json({ message: "Failed to delete flashcard" });
  }
};
