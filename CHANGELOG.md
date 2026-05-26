# Changelog

## [1.1.2](https://github.com/RisoTron/RisoTron-Studio/compare/risotron-studio-v1.1.1...risotron-studio-v1.1.2) (2026-05-26)


### Bug Fixes

* **devops:** add executableName to packagerConfig to fix linux builds ([#73](https://github.com/RisoTron/RisoTron-Studio/issues/73)) ([c0056a2](https://github.com/RisoTron/RisoTron-Studio/commit/c0056a2d0d164ef994589ff7472a44c4b18a7b9e))

## [1.1.1](https://github.com/RisoTron/RisoTron-Studio/compare/risotron-studio-v1.1.0...risotron-studio-v1.1.1) (2026-05-26)


### Bug Fixes

* **devops:** chain build jobs to release-please to bypass GITHUB_TOKEN trigger limits ([#69](https://github.com/RisoTron/RisoTron-Studio/issues/69)) ([6b6d5c4](https://github.com/RisoTron/RisoTron-Studio/commit/6b6d5c405decb52870518d80d0cd7aa66e1e5379))
* **devops:** explicitly check string value for release_created in if condition ([#71](https://github.com/RisoTron/RisoTron-Studio/issues/71)) ([b18613c](https://github.com/RisoTron/RisoTron-Studio/commit/b18613cdc2d97c72bd0e5a60e7fffb7be0eb0f30))

## [1.1.0](https://github.com/RisoTron/RisoTron-Studio/compare/risotron-studio-v1.0.0...risotron-studio-v1.1.0) (2026-05-26)


### Features

* **app-bootstrap:** scaffold electron forge with svelte 5 and vite ([d80dc6d](https://github.com/RisoTron/RisoTron-Studio/commit/d80dc6dcee6a1650c6ef0b61ec7932088aa22eb0))
* **devops:** implement build and publish workflow ([#68](https://github.com/RisoTron/RisoTron-Studio/issues/68)) ([b11fc97](https://github.com/RisoTron/RisoTron-Studio/commit/b11fc979f54aedd5bdfc7b3a17b84e2819a79aa1))
* **devops:** setup release please workflow ([#64](https://github.com/RisoTron/RisoTron-Studio/issues/64)) ([1511bd0](https://github.com/RisoTron/RisoTron-Studio/commit/1511bd08532d282d68146d58c039f503954e93fa))
* **devops:** setup validate workflow ([#63](https://github.com/RisoTron/RisoTron-Studio/issues/63)) ([3a1dcc6](https://github.com/RisoTron/RisoTron-Studio/commit/3a1dcc6c99d5354745e7da7084778f514c0b9d93))


### Bug Fixes

* **bootstrap:** address analyst feedback (app.whenReady, tsconfig, symlink) ([2a6689d](https://github.com/RisoTron/RisoTron-Studio/commit/2a6689df80e56aec4aab22a17ae73e6050361ce0))
* **build:** enforce node 22 and explicit cjs for preload ([0b67e1d](https://github.com/RisoTron/RisoTron-Studio/commit/0b67e1d55ec127636a036956f733cf019265a1b3))
* **build:** resolve ASAR index.html path by moving it to root ([e18ea9d](https://github.com/RisoTron/RisoTron-Studio/commit/e18ea9dd1b965b6ffdd6cd269fd13c6536e4dbed))
* **devops:** use pull_request trigger to capture PR title in run-name ([#66](https://github.com/RisoTron/RisoTron-Studio/issues/66)) ([4dc3f03](https://github.com/RisoTron/RisoTron-Studio/commit/4dc3f03e8078c6ff4d3b14b28d14e73815ba952e))
* **electron:** address critic feedback on ESM preload, sandbox, and file conflicts ([8492643](https://github.com/RisoTron/RisoTron-Studio/commit/84926436da6b943f70f3a9e582fa5c9e21d16061))
* resolve ESM require error by configuring Vite to output ES modules for main and preload ([d24f5ea](https://github.com/RisoTron/RisoTron-Studio/commit/d24f5ea552c94888d7bba6a7525917fb573c19c5))
