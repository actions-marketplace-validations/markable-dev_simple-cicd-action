import { Comparision, FileStatusOrAll } from "./file-changing-collector";
import { GlobMatcher } from "./glob-matcher";

export type OnFileChangeOpts = {
  key: string;
  files: string | string[];
  match?: FileStatusOrAll | FileStatusOrAll[];
  run?: string[] | string;
};

export class ChangedFileMatcher {
  key: string;
  private matches: string[];
  private globber: GlobMatcher;

  constructor (key: string, options: OnFileChangeOpts) {
    const match = options.match || 'all';
    this.matches = typeof match === 'string' ? [match] : match;
    this.key = key;
    this.globber = new GlobMatcher(typeof options.files === 'string' ? options.files.split(' ') : options.files);
  }

  match (comparision: Comparision) {
    const allChangedTypes = Object.keys(comparision);
    const changedFiles = allChangedTypes.reduce(
      (acc, type) => Object.assign(acc, { [type]: [] }),
      { added_modified: [] }
    ) as unknown as Comparision & { added_modified: string[] };

    this.matches.forEach(changeType => {
      changedFiles[changeType] = this.globber?.match(comparision[changeType]) || [];
      changedFiles.all.push(...changedFiles[changeType]);
    });
    changedFiles.added_modified = changedFiles.added.concat(changedFiles.modified);

    return changedFiles;
  }
}

export const exporter = (comparision: Comparision, onFileChange: OnFileChangeOpts[]) => {
  const matchers = onFileChange.map(opts => new ChangedFileMatcher(opts.key, opts));

  return matchers.reduce((acc, matcher) => {
    acc[matcher.key] = matcher.match(comparision);
    return acc;
  }, {});
};
