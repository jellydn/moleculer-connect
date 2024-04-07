import type { Argv } from "yargs";

import connectHandler from "../connect-handler";
import { logger } from "../logger";

/**
 * Yargs command
 */
const connectCommand = {
    command: "connect [connectionString]",
    describe: "Connect to a remote Moleculer broker",
    builder(yargs: Argv) {
        yargs.options({
            config: {
                alias: "c",
                default: "",
                describe: "Load configuration from a file",
                type: "string",
            },
            ns: {
                default: "",
                describe: "Namespace",
                type: "string",
            },
            level: {
                default: "info",
                describe: "Logging level",
                type: "string",
            },
            id: {
                default: null,
                describe: "NodeID",
                type: "string",
            },
            hot: {
                alias: "h",
                default: false,
                describe: "Enable hot-reload",
                type: "boolean",
            },
            serializer: {
                default: null,
                describe: "Serializer",
                type: "string",
            },
            commands: {
                default: null,
                describe: "Custom REPL command file mask (e.g.: ./commands/*.js)",
                type: "string",
            },
        });
    },

    async handler(opts) {
        logger.info("Connecting to remote broker...");
        logger.info(opts);
        const broker = await connectHandler(opts);
        broker.repl();
    },
};

export default connectCommand;
