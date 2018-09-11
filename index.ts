import {PrerenderCrawler} from "./lib/PrerenderCrawler";
import {PrerenderCachedServer} from "./lib/PrerenderCachedServer";
import {PrerenderLiveServer} from "./lib/PrerenderLiveServer";

const args = process.argv.slice(2);

const port = 3000;
const prerenderRegex = new RegExp('.*exlskills\\.com\\/learn.*');
const indexURL = 'https://exlskills.com/learn-en/dashboard';
const outputDirectory = "./demo-output";
const workerCount = 3;

console.log("Prerender starting with args: ", args);

if (!args || args.length < 1) {
    console.error("Missing/invalid args");
}

switch (args[0]) {
    case 'serve-live':
        const lServer = new PrerenderLiveServer();
        console.info("Starting live server (expect longer request wait times since pages are rendered on-demand)");
        lServer.serve();
        break;
    case 'serve-cached':
        if (args.length != 2) {
            console.error("Invalid command args count");
            break
        }
        const pServer = new PrerenderCachedServer(args[1]);
        console.info("Starting cached server");
        pServer.serve();
        break;
    case 'prerender':
        console.info("Starting prerender command")
        const prerenderer = new PrerenderCrawler(indexURL, prerenderRegex, outputDirectory, workerCount);
        console.debug("Instantiated crawler")
        prerenderer.setup().then(() => {
            console.info("Crawler setup complete. Starting prerendering")
            prerenderer.prerender((completedPages, failedPages) => {
                console.log("Completed pages count: ", completedPages.length);
                console.log("Failed pages (url: error):\n\n", failedPages);
            }).then(() => {
                console.log("Successfully started crawling ...");
            }).catch(err => {
                console.error("Error crawling: ", err);
            });
        }).catch(err => {
            console.error("Error setting up prerenderer: ", err)
        })
        break;
    default:
        console.error("Unknown/invalid command: ", args[0])
}
