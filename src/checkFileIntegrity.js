/**
 *
 * Same as download Comics but does duplicate checking and logs failed requests to file
 * Poorly written. But it works.
 *
 */

// story url = api/v2/issues/4794?stories-full=1

require('colors');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const baseURL = 'https://www.akuankka.fi';
const directory = path.join(__dirname + '/comics');
const argv = require('minimist')(process.argv.slice(2));

let start = parseInt(argv.start) || 1;
const end = parseInt(argv.end) || 4794;

console.log('Downloading '.green + start.toString().blue + ' to '.green + end.toString().blue);

(async function f() {
    await fs.ensureDir(directory);
    for (start; start <= end; start++) {
        const prefix = `${'['.black}${start.toString().yellow}${'/'.black}${end.toString().yellow}${']'.black} `;
        console.log(`${prefix}${'Downloading Comic'.green} ${'#'.blue}${start.toString().blue}`);
        console.log(prefix + 'Requesting '.green + (baseURL + '/api/v2/issues/' + start + '?stories-full=1').blue);
        let comic;
        if(fs.existsSync(directory + '/' + start.toString() + '/issue.json')){
            console.log(`${prefix}${'Reading from cache'.magenta}`);
            comic = require(directory + '/' + start.toString() + '/issue.json');
        }else {
            try {
                comic = await axios(baseURL + '/api/v2/issues/' + start + '?stories-full=1');
                comic = comic.data
            } catch (e) {
                console.log(prefix + e.message.toString().red);
                continue;
            }
        }
        await fs.ensureDir(directory + '/' + start.toString());
        const currentComicDirectory = directory + '/' + start.toString();
        await fs.writeFile(currentComicDirectory + '/issue.json', JSON.stringify(comic, null, 2));
        console.log(prefix + 'Downloading '.green + comic.story_count.toString().blue + ' Stories...'.green);
        for(let story in comic.stories){
            const storyPrefix = `${prefix}${'['.black}${story.toString().yellow}${'/'.black}${comic.stories.length.toString().yellow}${']'.black} `;
            console.log(`${storyPrefix}${'Downloading Story'.green} ${'#'.blue}${story.toString().blue} "${comic.stories[story].title.yellow}" ${'with'.green} ${comic.stories[story].pages.length.toString().blue} ${'pages'.blue}`);

            for(let page in comic.stories[story].pages){
                const pagePrefix = `${storyPrefix}${'['.black}${(parseInt(page)+1).toString().yellow}${'/'.black}${comic.stories[story].pages.length.toString().yellow}${']'.black} `
                const pg = comic.stories[story].pages[page];
                const imageVersionKeys = Object.keys(pg.images);
                console.log(`${pagePrefix}${'Found'.green} ${imageVersionKeys.length.toString().blue} ${'different Images for page'.green} ${(parseInt(page)+1).toString().blue}`)
                for(let image in imageVersionKeys){
                    console.log(`${pagePrefix}${'Attempting Image Version'.green} ${imageVersionKeys[image].yellow}`);
                    const url = baseURL + pg.images[imageVersionKeys[image]].url;
                    let imageData;
                    const storyNum = parseInt(story)+1;
                    const pageNum = parseInt(page)+1;
                    let savepath = currentComicDirectory + '/Story_' + storyNum + '/Page_' + pageNum + '/' + + start + '_' + storyNum + '_' + pageNum + '_' + imageVersionKeys[image] + path.extname(url);
                    if(fs.existsSync(savepath)) {
                        console.log(`${pagePrefix}${'File already there!'.magenta}`);
                        continue;
                    }

                    try {
                        imageData = await axios({
                            responseType: 'arraybuffer',
                            method: 'GET',
                            url: url
                        });
                    }catch (e) {
                        console.log(pagePrefix + e.message.toString().red);
                        fs.appendFileSync('errors.txt', url + '\r\n');
                        continue;
                    }

                    savepath = currentComicDirectory + '/Story_' + storyNum + '/Page_' + pageNum + '/'
                    await fs.ensureDir(savepath);
                    await fs.writeFile(savepath + start + '_' + storyNum + '_' + pageNum + '_' + imageVersionKeys[image] + path.extname(url), imageData.data);
                }
            }
        }
    }
})();
