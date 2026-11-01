export interface ChatStreamEvent {
  event: string;
  data: unknown;
}

export class ChatStreamParser {
  private offset = 0;
  private buffer = '';

  read(text: string): ChatStreamEvent[] {
    if (text.length > 300000 || text.length < this.offset) throw new Error('Invalid chat stream');
    this.buffer += text.slice(this.offset);
    this.offset = text.length;
    const events: ChatStreamEvent[] = [];
    let match: RegExpExecArray | null;
    while ((match = /\r?\n\r?\n/.exec(this.buffer))) {
      const frame = this.buffer.slice(0, match.index);
      this.buffer = this.buffer.slice(match.index + match[0].length);
      let event = 'message';
      const data: string[] = [];
      for (const line of frame.split(/\r?\n/)) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
      }
      if (data.length) events.push({ event, data: JSON.parse(data.join('\n')) });
    }
    return events;
  }
}
