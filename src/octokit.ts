import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

export class OctokitClient {
  private static PR = 'pull_request';
  private static PUSH = 'push';
  private static AVAILABLE_EVENTS = [OctokitClient.PUSH, OctokitClient.PR];
  private static instances = new Map<string, OctokitClient>();

  private client: InstanceType<typeof GitHub>;
  private context = context;
  private eventName = context.eventName;
  private head: string;
  private base: string;

  private constructor (token: string) {
    if (!OctokitClient.AVAILABLE_EVENTS.includes(this.eventName)) {
      core.setFailed(
        `This action only supports pull requests and pushes, ${this.eventName} events are not supported.`
      );
    }

    this.client = getOctokit(token, { required: true });
    this.head = this.getHead();
    this.base = this.getBase();
    OctokitClient.instances.set(token, this);
  }

  static getInstance (token: string): OctokitClient {
    return OctokitClient.instances.get(token) || new OctokitClient(token);
  }

  private getBase (): string {
    switch (this.eventName) {
      case 'push': {
        return this.context.payload.before;
      }
      default: {
        return this.context.payload.pull_request?.base?.sha;
      }
    }
  }

  private getHead (): string {
    switch (this.eventName) {
      case 'push': {
        return this.context.payload.after;
      }
      default: {
        return this.context.payload.pull_request?.head?.sha;
      }
    }
  }

  async compareBaseAndHead () {
    const response = await this.client.repos.compareCommits({
      base: this.base,
      head: this.head,
      owner: this.context.repo.owner,
      repo: context.repo.repo,
    });

    // Ensure that the request was successful.
    if (response.status !== 200) {
      core.setFailed(
        `The GitHub API for comparing the base and head commits for this ${context.eventName} event returned ${response.status}, expected 200. ` +
          "Please submit an issue on this action's GitHub repo."
      );
    }

    // Ensure that the head commit is ahead of the base commit.
    if (response.data.status !== 'ahead') {
      core.setFailed(
        `The head commit for this ${context.eventName} event is not ahead of the base commit. ` +
          "Please submit an issue on this action's GitHub repo."
      );
    }

    return response.data;
  }

  // get comment () { // Could be used with command parsing
  //   return this.context.payload.comment;
  // }
}
