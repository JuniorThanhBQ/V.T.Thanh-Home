import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  constructor() {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
  }

  transform(value: string | null | undefined): string {
    if (!value || typeof window === 'undefined' || !DOMPurify.isSupported) {
      return '';
    }
    const rawHtml = marked.parse(value, { async: false }) as string;
    return DOMPurify.sanitize(rawHtml, {
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
