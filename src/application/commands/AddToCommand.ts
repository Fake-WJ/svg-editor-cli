import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../model/SvgDocument.js';

export class AddToCommand extends EditCommand {
  constructor(private readonly values: readonly string[]) { super(); }
  apply(document: SvgDocument): string {
    const args = new Arguments(this.values, 'addto <gid> <id>').count(2);
    const group = document.container(args.at(0));
    const shape = document.find(args.at(1));
    group.insert(shape);
    return `${shape.tag}#${shape.id} added to g#${group.id}`;
  }
}
