import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  constructor() {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
  }

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }
    const rawHtml = marked.parse(value, { async: false }) as string;
    const cleanHtml =
      typeof window !== 'undefined'
        ? DOMPurify.sanitize(rawHtml, {
            ADD_ATTR: ['target', 'rel', 'style', 'class', 'width', 'height', 'align'],
            ADD_TAGS: ['div', 'span', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
          })
        : rawHtml;
    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
