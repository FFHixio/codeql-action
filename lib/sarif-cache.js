"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cache = __importStar(require("@actions/cache"));
function serializeKey(key) {
    return Buffer.from(key).toString("base64");
}
async function getSARIFCachePath() {
    const runnerTemp = process.env.RUNNER_TEMP;
    if (runnerTemp === undefined) {
        return undefined;
    }
    return path.join(runnerTemp, "codeql-results-cache");
}
async function saveSARIFResults(outputPath, key, logger) {
    const sarifCachePath = await getSARIFCachePath();
    if (sarifCachePath === undefined) {
        return;
    }
    if (!fs.existsSync(sarifCachePath)) {
        await fs.promises.mkdir(sarifCachePath);
    }
    let outputSARIFNames = await fs.promises.readdir(outputPath);
    for (let outputSARIFName of outputSARIFNames) {
        let outputSARIFPath = path.join(outputPath, outputSARIFName);
        let cachedSARIFPath = path.join(sarifCachePath, path.relative(outputPath, outputSARIFPath));
        logger.info(`Copying file ${outputSARIFPath} to cached ${cachedSARIFPath}`);
        await fs.promises.copyFile(outputSARIFPath, cachedSARIFPath);
    }
    logger.info(`Performing saveCache(${sarifCachePath}, ${key})`);
    await cache.saveCache([sarifCachePath], serializeKey(key));
}
exports.saveSARIFResults = saveSARIFResults;
async function skipAnalysis() {
    const sarifCachePath = await getSARIFCachePath();
    if (sarifCachePath === undefined) {
        return false;
    }
    let cachedSARIFPaths = await fs.promises.readdir(sarifCachePath);
    return cachedSARIFPaths.length > 0; // TODO
}
exports.skipAnalysis = skipAnalysis;
async function restoreSARIFResults(key, logger) {
    if (!key) {
        throw new Error(`Got invalid cache key: ${key}`);
    }
    const sarifCachePath = await getSARIFCachePath();
    if (sarifCachePath === undefined) {
        return;
    }
    await fs.promises.mkdir(sarifCachePath);
    logger.info(`Performing restoreCache(${sarifCachePath}, ${key})`);
    await cache.restoreCache([sarifCachePath], serializeKey(key));
}
exports.restoreSARIFResults = restoreSARIFResults;
async function copySARIFResults(outputPath, logger) {
    const sarifCachePath = await getSARIFCachePath();
    if (sarifCachePath === undefined) {
        return;
    }
    let cachedSARIFNames = await fs.promises.readdir(sarifCachePath);
    for (let cachedSARIFName of cachedSARIFNames) {
        let cachedSARIFPath = path.join(sarifCachePath, cachedSARIFName);
        let outputSARIFPath = path.join(outputPath, path.relative(sarifCachePath, cachedSARIFPath));
        logger.info(`Copying cached ${cachedSARIFPath} to ${outputPath}`);
        await fs.promises.copyFile(cachedSARIFPath, outputSARIFPath);
    }
}
exports.copySARIFResults = copySARIFResults;
function readKeyFromEnv() {
    return process.env["SARIF_CACHE_KEY"] || "";
}
exports.readKeyFromEnv = readKeyFromEnv;
//# sourceMappingURL=sarif-cache.js.map