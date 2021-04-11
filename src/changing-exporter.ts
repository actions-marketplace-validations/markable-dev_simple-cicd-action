import { Comparision, FileStatusOrAll } from "./file-changing-collector";
import { GlobMatcher, GlobMatcherOptions } from "./glob-matcher";

export type OnFileChangeOpts = {
  globber?: GlobMatcher;
  changeTypes?: FileStatusOrAll | FileStatusOrAll[];
  key?: string;
  run?: string[] | string;
  exportKey?: boolean;
} & GlobMatcherOptions;

export const exporter = (comparision: Comparision, onFileChange: OnFileChangeOpts[]) => {
  const exportByKeys = {};
  const allChangedTypes = Object.keys(comparision);
  const changedFiles = allChangedTypes.reduce(
    (acc, type) => Object.assign(acc, { [type]: [] }),
    { added_modified: [] }
  ) as unknown as Comparision & { added_modified: string[] };
  onFileChange.forEach(opt => {
    if (!opt.files || !opt.files.length) {
      return;
    }
    opt.globber = new GlobMatcher(opt.files);
    opt.changeTypes = opt.changeTypes || 'all';
    if (!Array.isArray(opt.changeTypes)) {
      opt.changeTypes = [opt.changeTypes];
    }
    if (opt.changeTypes.includes('all')) {
      opt.changeTypes = allChangedTypes as FileStatusOrAll[];
      const index = opt.changeTypes.indexOf('all');
      index >= 0 && opt.changeTypes.splice(index, 1);
    }

    opt.changeTypes.forEach(changeType => {
      changedFiles[changeType] = opt.globber?.match(comparision[changeType]) || [];
      changedFiles.all.push(...changedFiles[changeType]);
    });
    changedFiles.added_modified = changedFiles.added.concat(changedFiles.modified);
    if (changedFiles.all.length && opt.key) {
      opt.exportKey = true;
      exportByKeys[opt.key] = opt;
    }
  });

  return {
    exportByKeys,
    changedFiles,
  };
};
