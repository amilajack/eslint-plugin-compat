module.exports = {
  branches: [
    "main",
    {
      name: "(feat|fix|chore)-*",
      prerelease: true,
    },
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    // Only commit the pkg.json changes on main branch
    ...(process.env.GITHUB_REF_NAME === "main" ? ["@semantic-release/git"] : []),
    "@semantic-release/github",
  ],
};