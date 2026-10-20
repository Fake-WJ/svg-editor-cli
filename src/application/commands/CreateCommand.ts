import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import { ShapeFactory } from '../../model/ShapeFactory.js';
import type { SvgDocument } from '../../model/SvgDocument.js';

export class CreateCommand extends EditCommand {
  constructor(private readonly values: readonly string[]) { super(); }
  apply(document: SvgDocument): string {
    const args = new Arguments(this.values, 'create <type> <id> [params...] [in <containerId>]');
    const type = args.at(0);
    const id = args.at(1);
    document.ensureAvailable(id);
    const hasParent = this.values.length >= 4 && this.values.at(-2) === 'in';
    const parent = hasParent ? document.container(this.values.at(-1)!) : document.root;
    const parameters = this.values.slice(2, hasParent ? -2 : undefined);
    const shape = new ShapeFactory().create(type, id, parameters);
    document.add(shape, parent);
    return `${shape.tag}#${id} created${hasParent ? ` in g#${parent.id}` : ''}`;
  }
}
