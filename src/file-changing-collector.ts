import * as core from '@actions/core';
import { OctokitClient } from './octokit';

type Comparision = {
  added: string[];
  modified: string[];
  removed: string[];
  renamed: string[];
};

export class FileChangingCollector {
  private client: OctokitClient;
  private comparision = {
    added: [],
    modified: [],
    removed: [],
    renamed: [],
  } as Comparision;
  private compared = false;

  constructor (client: OctokitClient) {
    this.client = client;
  }

  async getComparision (): Promise<Comparision> {
    if (this.compared) {
      return this.comparision;
    }

    this.compared = true;
    const data = await this.client.compareBaseAndHead();
    data.files.forEach(file => {
      const { status, filename } = file;
      if (!this.comparision[status]) {
        core.setFailed(
          `One of your files includes an unsupported file status '${file.status}', expected 'added', 'modified', 'removed', or 'renamed'.`
        )
      }
      this.comparision[status].push(filename);
    });
    return this.comparision;
  }
}
