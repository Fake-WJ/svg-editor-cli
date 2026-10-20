import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { EditorSession } from './application/EditorSession.js';
import { FileDocumentStore } from './io/FileDocumentStore.js';
import { Cli } from './cli/Cli.js';
import { Terminal } from './cli/Terminal.js';

const args = process.argv.slice(2);
const terminal = new Terminal(new Cli(new EditorSession(new FileDocumentStore())));
try {
  let input: Readable = process.stdin;
  if (args.length) {
    if (args.length !== 2 || args[0] !== '--script') throw new Error('usage: npm run cli -- [--script <file>]');
    let script: string;
    try { script = await readFile(args[1]!, 'utf8'); }
    catch { throw new Error(`cannot read script: ${args[1]}`); }
    input = Readable.from([script]);
  }
  const interactive = input === process.stdin && Boolean(process.stdin.isTTY);
  const success = await terminal.run(input, process.stdout, process.stderr, interactive);
  if (!interactive && !success) process.exitCode = 1;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`error: ${message.replace(/[\r\n]+/g, ' ')}\n`);
  process.exitCode = 1;
}
