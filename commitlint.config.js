// Conventional Commits. Заголовки: feat/fix/refactor/test/docs/chore/ci/build/perf/style.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'ci', 'build', 'perf', 'style', 'revert'],
    ],
  },
};
