import {Octokit} from '@octokit/core'
import * as github from '@actions/github'
import {
  MergeStateStatus,
  PullRequestInfo,
  RepositoryPullRequestsInfo
} from './type'

export async function getMergePendingPullRequests(params: {
  octokit: Octokit
  approvedCount: number
}): Promise<PullRequestInfo | undefined> {
  const {octokit, approvedCount} = params
  const {owner, repo} = github.context.repo
  const result: RepositoryPullRequestsInfo = await octokit.graphql(
    `query ($owner: String!, $repo: String!) {
        repository(name: $repo, owner: $owner) {
          pullRequests(first: 10, states: OPEN) {
            nodes {
              title
              number
              mergeable
              reviews(states: APPROVED) {
                totalCount
              }
            }
          }
        }
      }`,
    {
      owner: owner,
      repo: repo
    }
  )

  const pullRequests = result.data.repository.pullRequests.nodes
  const behind = pullRequests.find(
    pr =>
      pr.mergeable === MergeStateStatus.BEHIND &&
      pr.reviews.totalCount >= approvedCount
  )
  return behind
}
