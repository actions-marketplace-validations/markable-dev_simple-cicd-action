import * as core from '@actions/core';
import slugify from 'slugify';
import * as semver from 'semver';

export class Ref {
  type: string;
  name: string;
  slug: string;
  sha: string;
  release?: string;
  isReleaseFormat: boolean;

  constructor (ref: string, sha = process.env.GITHUB_SHA || '') {
    const [, type, name] = ref.split('/');
    this.type = type;
    this.name = name;
    this.slug = slugify(name);
    this.sha = sha;
    this.release = Ref.formatRelease(name);
    this.isReleaseFormat = this.release !== null;
  }

  static formatRelease (version: string): string | undefined {
    const v = semver.valid(version);
    if (v) {
      return `v${v}`;
    }
  }
}

export const getRef = (ref: string | Ref): Ref => {
  if (ref instanceof(Ref)) {
    return ref;
  }
  return new Ref(ref);
}

export const getSelfRef = async (): Promise<Ref> => {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (typeof eventPath !== 'string') {
    const msg = 'Event path is not defined in env.';
    core.setFailed(msg);
    throw new Error(msg);
  }

  const envData = await import(eventPath);
  if (envData.ref) {
    return new Ref(envData);
  }

  if (envData.pull_request) {
    console.log(envData);
    core.warning('Not support pr yet.');
    // const { pull_request: pr } = envData;
    // const [, type, name] = pr.split('/');
    // return {
    //   base: new Ref(envData.base_ref),
    //   sha: envData.pull_request.head.sha,
    //   after: envData.after,
    //   before: envData.before,
    // };
  }
  return { sha: process.env.GITHUB_SHA } as Ref;
};
