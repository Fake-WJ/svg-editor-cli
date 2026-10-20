import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { Cli } from './Cli.js';

export class Terminal {
  constructor(private readonly cli: Cli) {}

  async run(input: Readable, output: Writable, errors: Writable, interactive: boolean): Promise<boolean> {
    const lines = createInterface({ input, output, terminal: interactive, crlfDelay: Infinity });
    let success = true;
    if (interactive) {
      output.write("svg-editor 0.1 — type 'help' for commands\n");
      lines.setPrompt('svg> ');
      lines.prompt();
    }
    for await (const line of lines) {
      const result = await this.cli.execute(line);
      if (result.startsWith('error:')) {
        errors.write(`${result}\n`);
        success = false;
      } else if (result) output.write(`${result}\n`);
      if (interactive) lines.prompt();
    }
    return success;
  }
}
