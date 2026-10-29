import { next, rewrite } from '@vercel/functions';

export const config = { matcher: '/' };

export default function middleware(request: Request): Response {
  const ranges = (request.headers.get('accept') ?? '').split(',').map((entry) => {
    const [type, ...parameters] = entry.trim().toLowerCase().split(';');
    const quality = parameters.find((parameter) => parameter.trim().startsWith('q='));
    const value = quality?.trim().slice(2) ?? '1';
    return {
      type: type.trim(),
      quality: /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value) ? Number(value) : 0,
    };
  });
  const qualityFor = (type: string): number => {
    for (const candidate of [type, 'text/*', '*/*']) {
      const matches = ranges.filter((range) => range.type === candidate);
      if (matches.length) return Math.max(...matches.map((range) => range.quality));
    }
    return 0;
  };
  const markdownQuality = qualityFor('text/markdown');
  const wantsMarkdown =
    ['GET', 'HEAD'].includes(request.method) &&
    ranges.some((range) => range.type === 'text/markdown') &&
    markdownQuality > 0 &&
    markdownQuality >= qualityFor('text/html');
  const destination = new URL('/llms.txt', request.url);
  const response = wantsMarkdown ? rewrite(destination) : next();
  response.headers.set('Vary', 'Accept');
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  return response;
}
