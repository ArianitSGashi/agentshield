# fast-glob

A faster Node.js library for [globbing](https://en.wikipedia.org/wiki/Glob_(programming)).

[![Build status](https://img.shields.io/github/actions/workflow/status/mrmlnc/fast-glob/ci.yml)](https://github.com/mrmlnc/fast-glob/actions)
[![npm version](https://img.shields.io/npm/v/fast-glob.svg)](https://www.npmjs.com/package/fast-glob)

## Install

```bash
npm install fast-glob
```

## Usage

```js
import fg from "fast-glob";

const entries = await fg(["src/**/*.ts", "!src/**/*.test.ts"]);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `cwd` | `string` | `process.cwd()` | The current working directory in which to search. |
| `absolute` | `boolean` | `false` | Return absolute paths instead of relative ones. |
| `dot` | `boolean` | `false` | Match files that begin with a dot. |
| `onlyFiles` | `boolean` | `true` | Only return paths to files. |

## Performance

`fast-glob` is roughly 2-3x faster than `node-glob` on large repositories. The
benchmark suite is in `bench/` if you want to reproduce the numbers.

## License

MIT (c) 2017 contributors.
