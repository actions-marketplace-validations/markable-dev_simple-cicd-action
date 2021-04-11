import minimatch from 'minimatch';
import * as core from '@actions/core';

export class GlobMatcher {
  private globs: string[];

  constructor (globs: string[]) {
    this.globs = globs;
  }

  match (files: string[]) {
    if (!files || !files.length) {
      return [];
    }

    const results = files.filter(file => this.globs.every(glob => minimatch(file, glob)));
    core.debug(`Match ${JSON.stringify(files)} with "${this.globs.join(' ')}": ${JSON.stringify(results)}`);
    return results;
  }
}
