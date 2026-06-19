import { z } from 'zod';

export const UuidParam = z.string().uuid();
