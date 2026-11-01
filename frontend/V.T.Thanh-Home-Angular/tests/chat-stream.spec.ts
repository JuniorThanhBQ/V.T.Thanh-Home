import { describe, expect, it } from 'vitest';
import { ChatStreamParser } from '../src/features/chat/services/chat-stream';

describe('Chat stream framing', () => {
  it('handles cumulative progress, split frames and Unicode without duplicating deltas', () => {
    const parser = new ChatStreamParser();
    const first = 'event: delta\r\ndata: {"text":"Xin ch\u00e0o \u65e5\u672c"}\r\n\r';
    expect(parser.read(first)).toEqual([]);
    const complete = first + '\n';
    expect(parser.read(complete)).toEqual([
      { event: 'delta', data: { text: 'Xin ch\u00e0o \u65e5\u672c' } },
    ]);
    expect(parser.read(complete)).toEqual([]);
    expect(
      parser.read(complete + ': heartbeat\n\nevent: done\ndata: {"messageId":1,"reply":"ok"}\n\n'),
    ).toEqual([{ event: 'done', data: { messageId: 1, reply: 'ok' } }]);
  });

  it('rejects malformed JSON and oversized or reset cumulative responses', () => {
    expect(() => new ChatStreamParser().read('data: invalid\n\n')).toThrow();
    expect(() => new ChatStreamParser().read('a'.repeat(300001))).toThrow();
    const parser = new ChatStreamParser();
    parser.read(': heartbeat\n\n');
    expect(() => parser.read('')).toThrow();
  });
});
