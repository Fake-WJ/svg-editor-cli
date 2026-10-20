import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../model/SvgDocument.js';

export class DeleteCommand extends EditCommand {
  constructor(private readonly values: readonly string[]) { super(); }
  apply(document: SvgDocument): string {
    const args = new Arguments(this.values, 'delete <id>').count(1);
    const shape = document.delete(args.at(0));
    return `${shape.tag}#${shape.id} deleted`;
  }
}
