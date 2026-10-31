import { Pipe, PipeTransform, InjectionToken, inject } from '@angular/core';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export const MARKDOWN_PURIFIER = new InjectionToken<typeof DOMPurify>('MARKDOWN_PURIFIER');

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  private readonly purifier = inject(MARKDOWN_PURIFIER, { optional: true }) ?? DOMPurify;

  constructor() {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
  }

  transform(value: string | null | undefined): string {
    if (!value || !this.purifier.isSupported) {
      return '';
    }
    const rawHtml = marked.parse(value, { async: false }) as string;
    return this.purifier.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'del',
        'blockquote',
        'pre',
        'code',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'hr',
        'a',
        'img',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'div',
        'span',
      ],
      ALLOWED_ATTR: [
        'href',
        'title',
        'src',
        'alt',
        'width',
        'height',
        'align',
        'colspan',
        'rowspan',
        'start',
        'reversed',
      ],
      ALLOW_DATA_ATTR: false,
      ALLOW_ARIA_ATTR: false,
    });
  }
}
