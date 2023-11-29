<h1 align="center">Welcome to moleculer-connect 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.2.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/jellydn/moleculer-connect#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/jellydn/moleculer-connect/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/jellydn/moleculer-connect/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/jellydn/moleculer-connect" />
  </a>
</p>

> A command-line interface for connecting to Moleculer microservices

### 🏠 [Homepage](https://github.com/jellydn/moleculer-connect#readme)

## Usage

```sh
npm install moleculer-connect
```

For example, run below command to connect to a Moleculer TypeScript project:

```sh
NODE_OPTIONS='--import tsx' moleculer-connect --env --config moleculer.config.ts
```

## Options

The CLI supports several options to customize the connection:

```sh
Options:
      --version     Show version number                                [boolean]
      --help        Show help                                          [boolean]
  -c, --config      Load configuration from a file        [string] [default: ""]
      --ns          Namespace                             [string] [default: ""]
      --level       Logging level                     [string] [default: "info"]
      --id          NodeID                              [string] [default: null]
  -h, --hot         Enable hot-reload                 [boolean] [default: false]
      --serializer  Serializer                          [string] [default: null]
      --commands    Custom REPL command file mask (e.g.: ./commands/*.js)
                                                        [string] [default: null]
```

## Author

👤 **Dung Huynh Duc <dung@productsway.com>**

-   Github: [@jelydn](https://github.com/jelydn)

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2023 [Dung Huynh Duc <dung@productsway.com>](https://github.com/jelydn).<br />
This project is [MIT](https://github.com/jelydn/moleculer-connect/blob/master/LICENSE) licensed.
