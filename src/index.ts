import * as core from '@actions/core';

async function run(): Promise<void> {
  // Languages:
  //   - Node
  //   - Python
  //   - Java
  // Strategies:
  //   - Single project in each repo
  //   - Multiple projects in one repo, triggered by file changing
  // Flows:
  //   1 Lint
  //     1.1 Command lines only
  //   2 Test
  //     1.1 Command lines only
  //   3 Build
  //     3.3 Build docker image with at least two strategies:
  //       3.3.1 commit id as tag
  //       3.3.2 release tag as tag
  //   4 Deployment
  //     4.1 Dev deployments in multiple strategies:
  //       4.1.1 Command lines
  //       4.1.2 ArgoCD
  //       4.1.3 Helm
}
