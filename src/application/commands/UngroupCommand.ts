import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../model/SvgDocument.js';

export class UngroupCommand extends EditCommand {
  constructor(private readonly values: readonly string[]) { super(); }
  apply(document: SvgDocument): string {
    const args = new Arguments(this.values, 'ungroup <gid>').count(1);
    document.ungroup(args.at(0));
    return `g#${args.at(0)} ungrouped`;
  }
}
