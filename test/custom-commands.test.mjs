import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

for (const format of ["js", "cjs"]) {
    test(`built ${format} CLI loads CommonJS and ESM commands`, async () => {
        // Spaces and # must be escaped when importing an absolute file URL.
        const directory = await mkdtemp(path.join(tmpdir(), "connect commands #"));
        try {
            const config = path.join(directory, "config.json");
            await writeFile(config, JSON.stringify({ logger: false, nodeID: "command-test" }));
            await writeFile(
                path.join(directory, "common.cjs"),
                'module.exports = { command: "common", action() { console.log("COMMON_OK"); } };',
            );
            await writeFile(
                path.join(directory, "module.mjs"),
                'export default [{ command: "module", action() { console.log("MODULE_OK"); } }];',
            );
            await writeFile(
                path.join(directory, "transpiled.cjs"),
                'exports.__esModule = true; exports.default = [{ command: "transpiled", action() { console.log("TRANSPILED_OK"); } }];',
            );
            const output = execFileSync(
                process.execPath,
                [
                    fileURLToPath(new URL(`../dist/cli.${format}`, import.meta.url)),
                    "connect",
                    "--config",
                    config,
                    "--commands",
                    `${directory}/`,
                    "--level",
                    "silent",
                ],
                { input: "common\nmodule\ntranspiled\nexit\n", encoding: "utf8", timeout: 10000 },
            );
            // The CLI exits zero even if it fails to register a command.
            for (const marker of ["COMMON_OK", "MODULE_OK", "TRANSPILED_OK"]) {
                assert.ok(output.includes(marker), `missing ${marker}: ${output}`);
            }
            assert.ok(!output.includes("Dynamic require"));
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });

    test(`built ${format} handler preserves configured commands and REPL options`, async () => {
        const directory = await mkdtemp(path.join(tmpdir(), "connect-options-"));
        try {
            const config = path.join(directory, "config.json");
            const commands = path.join(directory, "command.cjs");
            await writeFile(
                config,
                JSON.stringify({
                    logger: false,
                    replCommands: [{ command: "legacy" }],
                    replDelimiter: "legacy>",
                    replOptions: {
                        colors: false,
                        delimiter: "current>",
                        customCommands: [{ command: "current" }],
                    },
                    transit: { disableVersionCheck: false },
                }),
            );
            await writeFile(commands, 'module.exports = { command: "injected" };');
            const imported = await import(`../dist/connect-handler.${format}`);
            const handler = format === "cjs" ? imported.default.default : imported.default;
            const broker = await handler({ _: [], config, commands, level: "silent" });
            try {
                assert.deepEqual(
                    broker.options.replOptions.customCommands.map((command) => command.command),
                    ["current", "legacy", "injected"],
                );
                assert.equal(broker.options.replOptions.colors, false);
                assert.equal(broker.options.replOptions.delimiter, "current>");
                assert.equal(broker.options.transit.disableVersionCheck, false);
            } finally {
                await broker.stop();
            }
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
}
