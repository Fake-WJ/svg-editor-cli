export class Numbers {
  static parse(value: string | number, name: string): number {
    if (typeof value === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
      throw new Error(`invalid number for ${name}: ${value}`);
    }
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`invalid number for ${name}: ${value}`);
    return number;
  }

  static positive(value: string | number, name: string): number {
    const number = this.parse(value, name);
    if (number <= 0) throw new Error(`${name} must be positive`);
    return number;
  }
}
