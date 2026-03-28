import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/connection.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const DEFAULT_SETTINGS = {
  general: JSON.stringify({})
};

router.get('/', (_req: AuthRequest, res: Response) => {
  const settings = db.prepare('SELECT * FROM settings LIMIT 1').get() as any;
  if (!settings) {
    res.json({ settings: { id: null, general: DEFAULT_SETTINGS.general } });
    return;
  }
  res.json({ settings });
});

router.put('/', (req: AuthRequest, res: Response) => {
  const { general } = req.body;
  const existing = db.prepare('SELECT * FROM settings LIMIT 1').get() as any;

  if (existing) {
    db.prepare(
      "UPDATE settings SET general = COALESCE(?, general), updated_at = datetime('now') WHERE id = ?"
    ).run(general ? JSON.stringify(general) : null, existing.id);
  } else {
    const id = uuidv4();
    db.prepare('INSERT INTO settings (id, general) VALUES (?, ?)').run(
      id, general ? JSON.stringify(general) : DEFAULT_SETTINGS.general
    );
  }

  const settings = db.prepare('SELECT * FROM settings LIMIT 1').get();
  res.json({ settings });
});

export default router;
