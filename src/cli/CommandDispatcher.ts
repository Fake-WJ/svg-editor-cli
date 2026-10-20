import type { Command } from '../application/Command.js';
import { InitCommand } from '../application/commands/InitCommand.js';
import { ReadCommand } from '../application/commands/ReadCommand.js';
import { SaveCommand } from '../application/commands/SaveCommand.js';
import { CanvasCommand } from '../application/commands/CanvasCommand.js';
import { CreateCommand } from '../application/commands/CreateCommand.js';
import { DeleteCommand } from '../application/commands/DeleteCommand.js';
import { MoveCommand } from '../application/commands/MoveCommand.js';
import { ScaleCommand } from '../application/commands/ScaleCommand.js';
import { SetCommand } from '../application/commands/SetCommand.js';
import { GroupCommand } from '../application/commands/GroupCommand.js';
import { UngroupCommand } from '../application/commands/UngroupCommand.js';
import { AddToCommand } from '../application/commands/AddToCommand.js';
import { FrontCommand } from '../application/commands/FrontCommand.js';
import { BackCommand } from '../application/commands/BackCommand.js';
import { TreeCommand } from '../application/commands/TreeCommand.js';
import { ShowCommand } from '../application/commands/ShowCommand.js';
import { HelpCommand } from '../application/commands/HelpCommand.js';
import { UndoCommand } from '../application/commands/UndoCommand.js';
import { RedoCommand } from '../application/commands/RedoCommand.js';

export class CommandDispatcher {
  // Allowed name dispatch #2. Replace with command registration in a later phase.
  private readonly constructors: Readonly<Record<string, new (args: readonly string[]) => Command>> = {
    init: InitCommand, read: ReadCommand, save: SaveCommand, canvas: CanvasCommand,
    create: CreateCommand, delete: DeleteCommand, move: MoveCommand, scale: ScaleCommand,
    set: SetCommand, group: GroupCommand, ungroup: UngroupCommand, addto: AddToCommand,
    front: FrontCommand, back: BackCommand, tree: TreeCommand, show: ShowCommand,
    help: HelpCommand, undo: UndoCommand, redo: RedoCommand,
  };
  dispatch(tokens: readonly string[]): Command {
    const name = tokens[0]!;
    if (!Object.hasOwn(this.constructors, name)) throw new Error(`unknown command: ${name}`);
    return new this.constructors[name]!(tokens.slice(1));
  }
}
