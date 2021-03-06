import {PrerenderCrawler} from "./lib/PrerenderCrawler";
import {PrerenderCachedServer} from "./lib/PrerenderCachedServer";
import {PrerenderLiveServer} from "./lib/PrerenderLiveServer";
import {PrerenderMetaServer} from "./lib/PrerenderMetaServer"

const args = process.argv.slice(2);
const prerenderRegex = new RegExp(process.env.PR_WHITELIST_REGEX || '.*');
const indexURL = process.env.PR_INDEX_URL;
const outputDirectory = process.env.PR_CACHE_DIR || "./cached-output";
const metaOutDirectory = process.env.PR_META_DIR || './meta-output';
const workerCount = parseInt(process.env.PR_WORKERS) || 2;
const livePort = parseInt(process.env.PR_LIVE_PORT) || 3000;
const cachedPort = parseInt(process.env.PR_CACHED_PORT) || 4000;
const metaPort = parseInt(process.env.PR_META_PORT) || 5000;

console.log("Prerender starting with args: ", args);

if (!args || args.length < 1) {
    console.error("Missing/invalid args");
}

let lServer, pServer, metaServer;

switch (args[0]) {
    case 'serve-live':
        lServer = new PrerenderLiveServer(livePort);
        console.info("Starting live server (expect longer request wait times since pages are rendered on-demand)");
        lServer.serve();
        break;
    case 'serve-cached':
        pServer = new PrerenderCachedServer(outputDirectory, cachedPort);
        console.info("Starting cached server");
        pServer.serve();
        break;
    case 'serve-meta':
        metaServer = new PrerenderMetaServer(metaOutDirectory, metaPort);
        console.info("Starting meta server");
        metaServer.serve();
        break;
    case 'serve-all-saved':
        pServer = new PrerenderCachedServer(outputDirectory, cachedPort);
        console.info("Starting cached server");
        pServer.serve();
        metaServer = new PrerenderMetaServer(metaOutDirectory, metaPort);
        console.info("Starting meta server");
        metaServer.serve();
        break;
    case 'prerender':
        console.info("Starting prerender command");
        const prerenderer = new PrerenderCrawler(indexURL, prerenderRegex, outputDirectory, metaOutDirectory, workerCount);
        console.debug("Instantiated crawler");
        prerenderer.setup().then(() => {
            console.info("Crawler setup complete. Starting prerendering");
            prerenderer.prerender((completedPages, failedPages) => {
                console.log("Completed pages count: ", Object.keys(completedPages).length);
                console.log("Failed pages (url: error):\n\n", failedPages);
                process.exit(Object.keys(failedPages).length == 0 ? 0 : 1);
            }).then(() => {
                console.log("Successfully started crawling ...");
            }).catch(err => {
                console.error("Error crawling: ", err);
            });
        }).catch(err => {
            console.error("Error setting up prerenderer: ", err);
        });
        break;
    default:
        console.error("Unknown/invalid command: ", args[0])
}
