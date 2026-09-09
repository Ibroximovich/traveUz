import { Request, Response, NextFunction } from 'express';
import { SupportedLanguage } from '../utils/i18n';

declare global {
  namespace Express {
    interface Request {
      lang: SupportedLanguage;
    }
  }
}

export function languageMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Check header 'accept-language' or query parameter '?lang=' or header 'x-lang'
  const rawLang =
    (req.query.lang as string) ||
    (req.headers['x-lang'] as string) ||
    (req.headers['accept-language'] as string) ||
    'uz';

  const lowerLang = rawLang.toLowerCase();

  if (lowerLang.includes('ru')) {
    req.lang = 'ru';
  } else if (lowerLang.includes('en')) {
    req.lang = 'en';
  } else {
    req.lang = 'uz';
  }

  next();
}
