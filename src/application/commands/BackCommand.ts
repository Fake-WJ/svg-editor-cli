import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../model/SvgDocument.js';

export class BackCommand extends EditCommand {
  constructor(private readonly values: readonly string[]) { super(); }
  apply(document: SvgDocument): string {
    const args = new Arguments(this.values, 'back <id>').count(1);
    document.reorder(args.at(0), false);
    const shape = document.find(args.at(0));
    return `${shape.tag}#${shape.id} sent to back`;
  }
}
