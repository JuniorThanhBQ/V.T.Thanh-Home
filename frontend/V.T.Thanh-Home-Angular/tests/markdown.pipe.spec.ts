import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownPipe } from '@/shared/pipes/markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;

  beforeEach(() => {
    pipe = TestBed.runInInjectionContext(() => new MarkdownPipe());
  });

  describe('Empty and boundary inputs', () => {
    it('returns empty string for null, undefined, or empty string', () => {
      expect(pipe.transform(null)).toBe('');
      expect(pipe.transform(undefined)).toBe('');
      expect(pipe.transform('')).toBe('');
      expect(pipe.transform('   ')).toBe('');
    });
  });

  describe('Valid Markdown preservation', () => {
    it('renders headings correctly', () => {
      const output = pipe.transform('# Heading 1\n## Heading 2');
      expect(output).toContain('<h1>Heading 1</h1>');
      expect(output).toContain('<h2>Heading 2</h2>');
    });

    it('renders inline text formatting like bold, italic, and strikethrough', () => {
      const output = pipe.transform('**bold** *italic* ~~strikethrough~~');
      expect(output).toContain('<strong>bold</strong>');
      expect(output).toContain('<em>italic</em>');
      expect(output).toContain('<del>strikethrough</del>');
    });

    it('renders lists and blockquotes correctly', () => {
      const markdown = '> quoted text\n\n- item 1\n- item 2';
      const output = pipe.transform(markdown);
      expect(output).toContain('<blockquote>');
      expect(output).toContain('<p>quoted text</p>');
      expect(output).toContain('<ul>');
      expect(output).toContain('<li>item 1</li>');
      expect(output).toContain('<li>item 2</li>');
    });

    it('renders tables correctly', () => {
      const markdown = '| Col 1 | Col 2 |\n|---|---|\n| Val 1 | Val 2 |';
      const output = pipe.transform(markdown);
      expect(output).toContain('<table>');
      expect(output).toContain('<thead>');
      expect(output).toContain('<th>Col 1</th>');
      expect(output).toContain('<tbody>');
      expect(output).toContain('<td>Val 1</td>');
    });

    it('renders legitimate links and images with safe attributes', () => {
      const markdown =
        '[Link Title](https://example.com) ![Alt Text](https://example.com/image.png)';
      const output = pipe.transform(markdown);
      expect(output).toContain('<a href="https://example.com">Link Title</a>');
      expect(output).toContain('<img src="https://example.com/image.png" alt="Alt Text">');
    });

    it('renders code blocks and inline code', () => {
      const markdown = '`inline code`\n\n```typescript\nconst x = 1;\n```';
      const output = pipe.transform(markdown);
      expect(output).toContain('<code>inline code</code>');
      expect(output).toContain('<pre><code');
      expect(output).toContain('const x = 1;');
    });
  });

  describe('Malicious HTML and XSS payload sanitization', () => {
    it('strips <script> tags and malicious script contents', () => {
      const payload = '# Title\n<script>alert("xss")</script>\nNormal text';
      const output = pipe.transform(payload);
      expect(output).not.toContain('<script');
      expect(output).not.toContain('alert(');
      expect(output).toContain('<h1>Title</h1>');
      expect(output).toContain('Normal text');
    });

    it('strips onerror and other event handlers from <img> tags', () => {
      const payload = '<img src="invalid.jpg" onerror="alert(document.cookie)">';
      const output = pipe.transform(payload);
      expect(output).not.toContain('onerror');
      expect(output).not.toContain('alert');
      expect(output).not.toContain('document.cookie');
    });

    it('strips disallowed tags like <iframe>, <object>, and <embed>', () => {
      const payload = '<iframe src="https://attacker.com"></iframe><embed src="evil.swf">';
      const output = pipe.transform(payload);
      expect(output).not.toContain('<iframe');
      expect(output).not.toContain('<embed');
    });

    it('strips javascript: pseudo-protocol from links', () => {
      const payload = '[Dangerous Link](javascript:alert("hacked"))';
      const output = pipe.transform(payload);
      expect(output).not.toContain('javascript:');
      expect(output).not.toContain('alert(');
    });

    it('strips onclick and inline event attributes from allowed tags', () => {
      const payload =
        '<div onclick="alert(1)">Click me</div><span onmouseover="evil()">Hover</span>';
      const output = pipe.transform(payload);
      expect(output).not.toContain('onclick');
      expect(output).not.toContain('onmouseover');
      expect(output).toContain('Click me');
      expect(output).toContain('Hover');
    });

    it('strips form elements and inputs', () => {
      const payload =
        '<form action="/steal"><input type="password" name="pwd"><button>Submit</button></form>';
      const output = pipe.transform(payload);
      expect(output).not.toContain('<form');
      expect(output).not.toContain('<input');
      expect(output).not.toContain('<button');
    });

    it('strips data-* and aria-* attributes as configured in DOMPurify options', () => {
      const payload = '<span data-secret="12345" aria-label="admin-flag">Safe label</span>';
      const output = pipe.transform(payload);
      expect(output).not.toContain('data-secret');
      expect(output).not.toContain('aria-label');
      expect(output).toContain('Safe label');
    });
  });
});
