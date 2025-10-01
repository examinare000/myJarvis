import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  category: z.string().max(50).optional(),
  location: z.string().max(255).optional(),
  isAllDay: z.boolean().optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  category: z.string().max(50).optional(),
  location: z.string().max(255).optional(),
  isAllDay: z.boolean().optional(),
});

// GET /api/v1/calendar/events
router.get('/events', async (req: any, res) => {
  try {
    const { from, to } = req.query;

    const where: any = { userId: req.user?.id || 'cmg2w1nvv000277gwt71j8eqa' };

    // 日付フィルターが指定されている場合
    if (from || to) {
      where.OR = [
        // 開始時間が範囲内
        {
          startTime: {
            ...(from && { gte: new Date(from as string) }),
            ...(to && { lte: new Date(to as string) }),
          },
        },
        // 終了時間が範囲内
        {
          endTime: {
            ...(from && { gte: new Date(from as string) }),
            ...(to && { lte: new Date(to as string) }),
          },
        },
        // イベントが範囲をまたぐ場合
        {
          AND: [
            { startTime: { lte: new Date(from as string || '1970-01-01') } },
            { endTime: { gte: new Date(to as string || '2099-12-31') } },
          ],
        },
      ];
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// POST /api/v1/calendar/events
router.post('/events', async (req: any, res) => {
  try {
    const validation = createEventSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validation.error.errors
      });
    }

    const { title, description, startTime, endTime, color, category, location, isAllDay } = validation.data;

    // 開始時間と終了時間の検証
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startTime: start,
        endTime: end,
        color: color || '#1976D2',
        category: category || 'general',
        location,
        isAllDay: isAllDay || false,
        userId: req.user?.id || 'cmg2w1nvv000277gwt71j8eqa',
      },
    });

    return res.status(201).json(event);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

// PUT /api/v1/calendar/events/:id
router.put('/events/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const validation = updateEventSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validation.error.errors
      });
    }

    const updateData: any = {};
    const { title, description, startTime, endTime, color, category, location, isAllDay } = validation.data;

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (color !== undefined) updateData.color = color;
    if (category !== undefined) updateData.category = category;
    if (location !== undefined) updateData.location = location;
    if (isAllDay !== undefined) updateData.isAllDay = isAllDay;

    // 開始時間と終了時間の検証（両方更新される場合）
    if (updateData.startTime && updateData.endTime && updateData.startTime >= updateData.endTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const event = await prisma.calendarEvent.update({
      where: {
        id,
        userId: req.user?.id || 'cmg2w1nvv000277gwt71j8eqa',
      },
      data: updateData,
    });

    return res.json(event);
  } catch (error) {
    if ((error as any)?.message?.includes('Record to update not found')) {
      return res.status(404).json({ error: 'Calendar event not found' });
    } else {
      console.error('Error updating calendar event:', error);
      return res.status(500).json({ error: 'Failed to update calendar event' });
    }
  }
});

// DELETE /api/v1/calendar/events/:id
router.delete('/events/:id', async (req: any, res) => {
  try {
    const { id } = req.params;

    await prisma.calendarEvent.delete({
      where: {
        id,
        userId: req.user?.id || 'cmg2w1nvv000277gwt71j8eqa',
      },
    });

    res.status(204).send();
  } catch (error) {
    if ((error as any)?.message?.includes('Record to delete does not exist')) {
      res.status(404).json({ error: 'Calendar event not found' });
    } else {
      console.error('Error deleting calendar event:', error);
      res.status(500).json({ error: 'Failed to delete calendar event' });
    }
  }
});

// GET /api/v1/calendar/events/:id
router.get('/events/:id', async (req: any, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.calendarEvent.findFirst({
      where: {
        id,
        userId: req.user?.id || 'cmg2w1nvv000277gwt71j8eqa',
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Calendar event not found' });
    }

    return res.json(event);
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return res.status(500).json({ error: 'Failed to fetch calendar event' });
  }
});

export default router;