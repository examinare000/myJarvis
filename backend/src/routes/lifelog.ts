import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createLifelogSchema = z.object({
  content: z.string().min(1).max(280),
  tags: z.array(z.string()).optional(),
  mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']).optional(),
  images: z.array(z.string()).optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  locationName: z.string().optional(),
});

const updateLifelogSchema = createLifelogSchema.partial();

// GET /api/v1/lifelog/entries
router.get('/entries', async (req: any, res) => {
  try {
    const { limit = '20', offset = '0' } = req.query;

    const entries = await prisma.lifelogEntry.findMany({
      where: { userId: req.user?.id || 'test-user' },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json(entries);
  } catch (error) {
    console.error('Error fetching lifelog entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// POST /api/v1/lifelog/entries
router.post('/entries', async (req: any, res) => {
  try {
    const data = createLifelogSchema.parse(req.body);

    const entry = await prisma.lifelogEntry.create({
      data: {
        ...data,
        userId: req.user?.id || 'test-user',
      },
    });

    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      console.error('Error creating lifelog entry:', error);
      res.status(500).json({ error: 'Failed to create entry' });
    }
  }
});

// PUT /api/v1/lifelog/entries/:id
router.put('/entries/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const data = updateLifelogSchema.parse(req.body);

    const entry = await prisma.lifelogEntry.update({
      where: {
        id,
        userId: req.user?.id || 'test-user',
      },
      data,
    });

    res.json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else if ((error as any)?.message?.includes('Record to update not found')) {
      res.status(404).json({ error: 'Entry not found' });
    } else {
      console.error('Error updating lifelog entry:', error);
      res.status(500).json({ error: 'Failed to update entry' });
    }
  }
});

// DELETE /api/v1/lifelog/entries/:id
router.delete('/entries/:id', async (req: any, res) => {
  try {
    const { id } = req.params;

    await prisma.lifelogEntry.delete({
      where: {
        id,
        userId: req.user?.id || 'test-user',
      },
    });

    res.status(204).send();
  } catch (error) {
    if ((error as any)?.message?.includes('Record to delete does not exist')) {
      res.status(404).json({ error: 'Entry not found' });
    } else {
      console.error('Error deleting lifelog entry:', error);
      res.status(500).json({ error: 'Failed to delete entry' });
    }
  }
});

// GET /api/v1/lifelog/entries/search
router.get('/entries/search', async (req: any, res) => {
  try {
    const { q, tag, mood, from, to, limit = '20', offset = '0' } = req.query;

    const where: any = { userId: req.user?.id || 'test-user' };

    if (q) {
      where.content = { contains: q, mode: 'insensitive' };
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (mood) {
      where.mood = mood;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }

    const entries = await prisma.lifelogEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json(entries);
  } catch (error) {
    console.error('Error searching lifelog entries:', error);
    res.status(500).json({ error: 'Failed to search entries' });
  }
});

export default router;