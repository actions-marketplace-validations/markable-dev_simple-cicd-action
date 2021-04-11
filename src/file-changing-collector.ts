import * as core from '@actions/core';
import { OctokitClient } from './octokit';

export type Comparision = {
  all: string[];
  added: string[];
  modified: string[];
  removed: string[];
  renamed: string[];
};

export type FileStatus = Exclude<keyof Comparision, 'all'>;
export type FileStatusOrAll = keyof Comparision;

export class FileChangingCollector {
  private client: OctokitClient;
  private comparision = {
    all: [],
    added: [],
    modified: [],
    removed: [],
    renamed: [],
  } as Comparision;
  private compared = false;

  constructor (client: OctokitClient) {
    this.client = client;
  }

  async getComparision (base?: string, head?: string): Promise<Comparision> {
    if (this.compared) {
      return this.comparision;
    }

    this.compared = true;
    const data = await this.client.compareCommits();
    data.files.forEach(file => {
      const { status, filename } = file;
      if (!this.comparision[status]) {
        core.setFailed(
          `One of your files includes an unsupported file status '${file.status}', expected 'added', 'modified', 'removed', or 'renamed'.`
        )
      }
      this.comparision.all.push(filename);
      this.comparision[status].push(filename);
    });
    return this.comparision;
  }
}
