import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { PreferencesService } from "./preferences.service";
import { createPreferencesSchema, updatePreferencesSchema } from "./preferences.schema";

export const getPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const preferences = await PreferencesService.findByUserId(userId);


    if (!preferences) {
      return res.status(404).json({ message: "Preferences not found" });
    }

    res.json(preferences);
  } catch (error) {
    console.error("[PREFERENCES] GET failed:", error);
    res.status(500).json({ message: "Failed to retrieve preferences" });
  }
};

export const createPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const existing = await PreferencesService.findByUserId(userId);
    if (existing) {
      return res.status(409).json({ message: "Preferences already exist" });
    }

    const { body } = createPreferencesSchema.parse({ body: req.body });
    const preferences = await PreferencesService.create(userId, body);
    res.status(201).json(preferences);
  } catch (error) {
    console.error("[PREFERENCES] POST failed:", error);
    res.status(500).json({ message: "Failed to create preferences" });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { body } = updatePreferencesSchema.parse({ body: req.body });
    const preferences = await PreferencesService.update(userId, body);

    if (!preferences) {
      return res.status(404).json({ message: "Preferences not found" });
    }

    res.json(preferences);
  } catch (error) {
    console.error("[PREFERENCES] PATCH failed:", error);
    res.status(500).json({ message: "Failed to update preferences" });
  }
};

export const deletePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const deleted = await PreferencesService.deleteByUserId(userId);

    if (!deleted) {
      return res.status(404).json({ message: "Preferences not found" });
    }

    res.json({ message: "Preferences deleted" });
  } catch (error) {
    console.error("[PREFERENCES] DELETE failed:", error);
    res.status(500).json({ message: "Failed to delete preferences" });
  }
};
