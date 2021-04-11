import * as minimatch from 'minimatch';

export class GlobMatcher {
  private globs: string[];

  constructor (globs: string[]) {
    this.globs = globs;
  }

  match (files: string[]) {
    if (!files || !files.length) {
      return [];
    }

    return files.filter(file => this.globs.every(glob => minimatch(file, glob)));
  }
}
