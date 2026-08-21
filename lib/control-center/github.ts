type GitHubTreeItem = { path: string; type: "blob" | "tree"; size?: number }

function headers() {
  const token = process.env.GITHUB_AUDIT_TOKEN
  if (!token) throw new Error("GITHUB_AUDIT_TOKEN non configurato")
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "4bid-control-center/1.0",
  }
}

async function githubJson<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: headers(),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`GitHub ${response.status}: ${detail.slice(0, 180)}`)
  }
  return response.json() as Promise<T>
}

export async function getRepositorySnapshot(repository: string, branch: string) {
  const [owner, repo] = repository.split("/")
  const encodedBranch = encodeURIComponent(branch)
  const commit = await githubJson<{
    sha: string
    html_url: string
    commit: { message: string; tree: { sha: string } }
  }>(`/repos/${owner}/${repo}/commits/${encodedBranch}`)
  const tree = await githubJson<{ tree: GitHubTreeItem[]; truncated: boolean }>(
    `/repos/${owner}/${repo}/git/trees/${commit.commit.tree.sha}?recursive=1`,
  )

  return {
    commit,
    tree: tree.tree,
    treeTruncated: tree.truncated,
    readText: async (path: string) => {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodedBranch}`,
        { headers: headers(), cache: "no-store", signal: AbortSignal.timeout(15_000) },
      )
      if (response.status === 404) return null
      if (!response.ok) throw new Error(`Impossibile leggere ${path}: GitHub ${response.status}`)
      const payload = (await response.json()) as { content?: string; encoding?: string }
      if (payload.encoding !== "base64" || !payload.content) return null
      return Buffer.from(payload.content.replace(/\n/g, ""), "base64").toString("utf8")
    },
  }
}

