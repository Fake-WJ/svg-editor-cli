import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../model/SvgDocument.js';

export class MoveCommand extends EditCommand {
  constructor(private readonly values: readonly string[]) { super(); }
  apply(document: SvgDocument): string {
    const args = new Arguments(this.values, 'move <id> <dx> <dy>').count(3);
    const shape = document.find(args.at(0));
    const dx = args.number(1), dy = args.number(2);
    shape.move(dx, dy);
    return `${shape.tag}#${shape.id} moved by (${dx},${dy})`;
  }
}
