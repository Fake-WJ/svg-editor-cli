import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../model/SvgDocument.js';

export class SetCommand extends EditCommand {
  constructor(private readonly values: readonly string[]) { super(); }
  apply(document: SvgDocument): string {
    const args = new Arguments(this.values, 'set <id> <attr> <value>').count(3);
    const shape = document.find(args.at(0));
    shape.set(args.at(1), args.at(2));
    return `${shape.tag}#${shape.id} updated: ${args.at(1)}=${JSON.stringify(args.at(2))}`;
  }
}
