import { getRef, Ref } from './ref';

const REGEX_REG = /^\/(.+)\/(\w+)?$/;

type Patterns = {
  branches?: string | string[],
  tags?: string | string[],
}

type RefPattern = string | RegExp;

const parseRegex = (str: string): RefPattern => {
  const patterns = str.match(REGEX_REG);
  if (!patterns) {
    return str;
  }
  return new RegExp(patterns[1], patterns[2]);
};

export class RefMatcher {
  event: string;
  tags?: RefPattern[];
  branches?: RefPattern[];
  private matchRef: boolean;

  private static parsePattern (patterns?: string | string[]): RefPattern[] | undefined {
    if (typeof patterns === 'string') {
      patterns = [patterns];
    }
    if (!patterns || !patterns.length) {
      return;
    }
    return patterns.map(parseRegex);
  }

  constructor (event: string, patterns?: Patterns) {
    this.event = event;
    this.branches = RefMatcher.parsePattern(patterns?.branches);
    this.tags = RefMatcher.parsePattern(patterns?.tags);
    this.matchRef = Boolean(this.branches || this.tags);
  }

  match (event: string = process.env.GITHUB_EVENT_NAME || '', ref: string | Ref = process.env.GITHUB_REF || ''): boolean {
    if (this.event !== event) {
      return false;
    }
    if (!this.matchRef) {
      return true;
    }

    const { type, name } = getRef(ref);
    if (!this[type]) {
      return false;
    }

    return this[type].some((pattern: RefPattern) => {
      if (typeof pattern === 'string') {
        return name === pattern;
      }
      return pattern.test(name);
    });
  }
}
