# Changelog

## [1.6.0](https://github.com/RisoTron/RisoTron-Studio/compare/risotron-studio-v1.5.0...risotron-studio-v1.6.0) (2026-05-30)


### Features

* **data-layer:** implement project CRUD via IPC ([df0522a](https://github.com/RisoTron/RisoTron-Studio/commit/df0522ab40b3449ac42f0423c4afc748e30a1a12))
* implement project CRUD via IPC (US 28) ([be0abb1](https://github.com/RisoTron/RisoTron-Studio/commit/be0abb1921e78e5523d312250b5cd9c3385caffa))

## [1.5.0](https://github.com/RisoTron/RisoTron-Studio/compare/risotron-studio-v1.4.0...risotron-studio-v1.5.0) (2026-05-30)


### Features

* implement database schema migration system ([0e83ce5](https://github.com/RisoTron/RisoTron-Studio/commit/0e83ce589e61b7c7d95cb3eef625d2bdfeaffcf5))
* implement database schema migration system ([1e68e06](https://github.com/RisoTron/RisoTron-Studio/commit/1e68e06a0a103e2c5b8f68ee1cda3b0ddfa529a7))


### Bug Fixes

* regenerate lockfile with correct node engine to include esbuild optional deps ([2bb347a](https://github.com/RisoTron/RisoTron-Studio/commit/2bb347a40b76b5b813d1175a39020e0fd1dff87c))

## [1.4.0](https://github.com/RisoTron/RisoTron-Studio/compare/risotron-studio-v1.3.0...risotron-studio-v1.4.0) (2026-05-27)


### Features

* **data-layer:** implement Config Manager & VSCode Settings UI (US 29) ([#83](https://github.com/RisoTron/RisoTron-Studio/issues/83)) ([002ff33](https://github.com/RisoTron/RisoTron-Studio/commit/002ff3374bac06e66483ced1b41e338c9bbc71fa))

## [1.3.0](https://github.com/RisoTron/RisoTron-Studio/compare/risotron-studio-v1.2.0...risotron-studio-v1.3.0) (2026-05-27)


### Features

* [US-26] Project data persisted in SQLite ([#81](https://github.com/RisoTron/RisoTron-Studio/issues/81)) ([a2a0c6b](https://github.com/RisoTron/RisoTron-Studio/commit/a2a0c6b3ec819ec5041347c7679bb751d7118ecc))

## [1.2.0](https://github.com/RisoTron/RisoTron-Studio/compare/risotron-studio-v1.1.1...risotron-studio-v1.2.0) (2026-05-27)


### Features

* **electron-shell:** US-25 enforce single-instance ([8b4e357](https://github.com/RisoTron/RisoTron-Studio/commit/8b4e357b7d12bfece77f28f707750c7d952e966e))


### Bug Fixes

* **electron:** address review findings for single-instance lock ([601eafd](https://github.com/RisoTron/RisoTron-Studio/commit/601eafdfad5ea0ca2ecf79d37a9fb99a37e113a8))

## [1.1.1](https://github.com/RisoTron/RisoTron-Studio/compare/risotron-studio-v1.1.0...risotron-studio-v1.1.1) (2026-05-26)


### Bug Fixes

* **devops:** upgrade github actions to node 24 compatible versions ([#77](https://github.com/RisoTron/RisoTron-Studio/issues/77)) ([ee9c557](https://github.com/RisoTron/RisoTron-Studio/commit/ee9c5579f6ba72fad8b58c044047ebc2c69d9c85))

## [1.1.0](https://github.com/RisoTron/RisoTron-Studio/compare/risotron-studio-v1.0.0...risotron-studio-v1.1.0) (2026-05-26)


### Features

* **app-bootstrap:** scaffold electron forge with svelte 5 and vite ([d80dc6d](https://github.com/RisoTron/RisoTron-Studio/commit/d80dc6dcee6a1650c6ef0b61ec7932088aa22eb0))
* **devops:** implement CI/CD workflow for US 58 ([#75](https://github.com/RisoTron/RisoTron-Studio/issues/75)) ([0f0cc85](https://github.com/RisoTron/RisoTron-Studio/commit/0f0cc85195368482dbab08d94e45e7684c95d241))


### Bug Fixes

* **bootstrap:** address analyst feedback (app.whenReady, tsconfig, symlink) ([2a6689d](https://github.com/RisoTron/RisoTron-Studio/commit/2a6689df80e56aec4aab22a17ae73e6050361ce0))
* **build:** enforce node 22 and explicit cjs for preload ([0b67e1d](https://github.com/RisoTron/RisoTron-Studio/commit/0b67e1d55ec127636a036956f733cf019265a1b3))
* **build:** resolve ASAR index.html path by moving it to root ([e18ea9d](https://github.com/RisoTron/RisoTron-Studio/commit/e18ea9dd1b965b6ffdd6cd269fd13c6536e4dbed))
* **electron:** address critic feedback on ESM preload, sandbox, and file conflicts ([8492643](https://github.com/RisoTron/RisoTron-Studio/commit/84926436da6b943f70f3a9e582fa5c9e21d16061))
* resolve ESM require error by configuring Vite to output ES modules for main and preload ([d24f5ea](https://github.com/RisoTron/RisoTron-Studio/commit/d24f5ea552c94888d7bba6a7525917fb573c19c5))
