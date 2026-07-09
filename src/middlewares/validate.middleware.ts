import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';
import { catchAsync } from '../utils/catchAsync';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Validates req[part] against the given Zod schema and replaces it with
 * the parsed (typed, coerced, defaulted) result. On failure, throws a
 * ZodError which the global error handler formats into { errorDetails }.
 *
 * Typed as ZodTypeAny (not AnyZodObject) so schemas built with
 * `.refine()`/`.transform()` — which return ZodEffects, not ZodObject —
 * are still accepted. Anything passed through `validate()` is expected
 * to parse to a plain object, since it replaces req[part] wholesale.
 *
 * Usage:
 *   router.post('/gear', validate(createGearSchema), gearController.create)
 *   router.get('/gear', validate(gearQuerySchema, 'query'), gearController.list)
 */
export const validate = (schema: ZodTypeAny, part: RequestPart = 'body') =>
  catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const parsed = await schema.parseAsync(req[part]);
    req[part] = parsed;
    next();
  });
