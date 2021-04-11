import minimatch from 'minimatch';
import * as core from '@actions/core';

export class GlobMatcher {
  private globs: string[];

  constructor (globs: string[]) {
    this.globs = globs;
  }

  match (files: string[]) {
    if (!files || !files.length) {
      core.debug(`Match empty file list against rule "${this.globs.join(' ')}", skipped.`);
      return [];
    }

    const results = files.filter(file => this.globs.every(glob => minimatch(file, glob)));
    core.debug(`Match ${JSON.stringify(files)} against rule "${this.globs.join(' ')}": ${JSON.stringify(results)}`);
    return results;
  }
}
