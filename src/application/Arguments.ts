import { Numbers } from '../model/Numbers.js';

export class Arguments {
  constructor(private readonly values: readonly string[], private readonly usage: string) {}
  count(min: number, max = min): this {
    if (this.values.length < min || this.values.length > max) throw new Error(`usage: ${this.usage}`);
    return this;
  }
  at(index: number): string {
    const value = this.values[index];
    if (value === undefined) throw new Error(`usage: ${this.usage}`);
    return value;
  }
  number(index: number): number { return Numbers.parse(this.at(index), `argument ${index + 1}`); }
}
