import type { Command } from '../Command.js';
import { Arguments } from '../Arguments.js';

export class HelpCommand implements Command {
  constructor(private readonly values: readonly string[]) {}
  async execute(): Promise<string> {
    new Arguments(this.values, 'help').count(0);
    return [
      'init [w] [h]                     new canvas (default 800x600)',
      'read <file.svg>                   load SVG; fill in missing IDs',
      'save [file.svg]                   save SVG (locks undo/redo)',
      'canvas [w h]                     show or change canvas dimensions',
      'create rect <id> <x> <y> <w> <h> [fill] [in <containerId>]',
      'create circle <id> <cx> <cy> <r> [fill] [in <containerId>]',
      'create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]',
      'create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]',
      'create text <id> <x> <y> "content" [in <containerId>]',
      'create g <id> [in <containerId>]',
      'delete <id>                      remove a shape and its descendants',
      'move <id> <dx> <dy>               translate geometry',
      'scale <id> <factor>               scale coordinates and dimensions',
      'set <id> <attr> <value>            update style, geometry or text',
      'group <newGid> <id1> [id2...]      group existing shapes',
      'ungroup <gid>                    promote children (not top-level g)',
      'addto <gid> <id>                 move existing shape into a group',
      'front <id> / back <id>           change sibling drawing order',
      'tree [id] / show <id>            inspect structure or attributes',
      'undo / redo                     undo or redo one edit command',
      'help                            show this help',
      '# starts a whole-line comment. Double quotes preserve spaces.',
    ].join('\n');
  }
}
