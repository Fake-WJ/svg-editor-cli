import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../model/SvgDocument.js';

export class FrontCommand extends EditCommand {
  constructor(private readonly values: readonly string[]) { super(); }
  apply(document: SvgDocument): string {
    const args = new Arguments(this.values, 'front <id>').count(1);
    document.reorder(args.at(0), true);
    const shape = document.find(args.at(0));
    return `${shape.tag}#${shape.id} brought to front`;
  }
}
