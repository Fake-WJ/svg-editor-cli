export class Tokenizer {
  tokenize(line: string): readonly string[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let token = '', quoted = false, active = false;
    for (let index = 0; index < line.length; index++) {
      const char = line[index]!;
      if (char === '"') {
        quoted = !quoted;
        active = true;
      } else if (quoted && char === '\\' && ['"', '\\'].includes(line[index + 1] ?? '')) {
        token += line[++index]!;
      } else if (!quoted && /\s/.test(char)) {
        if (active) tokens.push(token);
        token = '';
        active = false;
      } else {
        token += char;
        active = true;
      }
    }
    if (quoted) throw new Error('unterminated double quote');
    if (active) tokens.push(token);
    return tokens;
  }
}
