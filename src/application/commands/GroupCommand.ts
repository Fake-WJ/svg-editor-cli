import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../model/SvgDocument.js';

export class GroupCommand extends EditCommand {
  constructor(private readonly values: readonly string[]) { super(); }
  apply(document: SvgDocument): string {
    new Arguments(this.values, 'group <newGid> <id1> [id2...]').count(2, Infinity);
    const group = document.group(this.values[0]!, this.values.slice(1));
    return `g#${group.id} created with ${group.children.length} children`;
  }
}
