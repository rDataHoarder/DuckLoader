/**
* Improved script for downloading comics with state tracking, directory checking,
* progress printing, and ETA calculation.
* Stops the program if GET response is something else than 200.
* Works in 2024
* Add custom User-Agent and your subscriber smf cookie before use.
*/
require('colors');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const minimist = require('minimist');
const { exec } = require('child_process');

const baseURL = 'https://www.akuankka.fi';
const directory = path.join(__dirname, 'comics');
const argv = minimist(process.argv.slice(2));

const start = parseInt(argv.start) || 1;
const end = parseInt(argv.end) || 5554;

const headers = {
    'User-Agent': '',
    'Host': 'api.akuankka.fi',
    'Connection': 'Keep-Alive',
    'Accept-Encoding': 'gzip',
    'Cookie': 'YOUR_SMF_TOKEN; logged_in=1'
};

// ASCII Art at startup
const asciiArt = (`
                                                 ^>^                                 
                                        ^*++^****<)](**                              
                                      ^=(>~=(=::~)*+:<>                              
                                    ^+(~::<(#}>*+^*<^]^                              
                                   +^^:=<[####{+**=>^)*                              
                            :     *(<(](]#{####<+  **     -                          
                             -  ^=>]][#%%%%%%##<=  ~  :  :-                          
                       ::    *+({{{{{#%%#%%%%{#** ~~    ~      ::                    
                        -- **{%#%%#{}}{%#%%#*}>-=*+*+** -- ~~                      
                          =]>{{###{##{{{}#>={<^^>%<*(%%%>*  ~                        
                   --: :*~^-]###{##{###[+=^[~[^}{(##(]>[{~+~  --  --                 
                      ~~+-<::<##{}]++^~=>]++>()#%#((-::(#~* =~  ~~                   
              ::-   -   *:]*~-:::-~++^][->%#}%%%[]=::::-}~+=  =-  -                  
                 -~~  -~~*=^{[((]}#(+-:))][##[))^:::::::)^+~=  =~   ~-               
                    ~~=  ==^*:-:::::::=)]{%{%%}]^:::::::([= === ===                  
                  --~~  =+= *^]~::::::-}%%%%%%%#):::::::^{+* ==   ~--                
               :~~~    ==  ^~]~::::::::{(({@%]}}^-:::::::^^=^ ==     ~~~             
                     ====  *([{~-:::::-~*>*)>^*+-~::::-:<}}=^ =====                  
                   ~~====+ ^<>[=:=-~~~-:){%%@#}+:~=~=+=:<](+* +==~  -                
              :~~~~=====++~=+()}~:-~-:-]#<#@@]({*::~-:-)}>>* ====~~==~~~~-           
                            ^=]]##{])<)}{#%###<#{<<)}#%#[++                          
                        =+===+*>)[#[[}}{}{}{{{[##{}}##<(**===                        
            ---~~~      +==++=+*^+}{[}}]]()<><([}}{(}(^^+=====     ==~~~~-:          
                -~~~      === +][]}}})*~:-===~::=>]}(])#> ===    ~=~~-               
                   ~===   =+= +**+~*~::::::+-:::::*:^+**+ ===  +===                  
             ----    ~=== ===++=+^+-^::::::::::-~==-**==+ =+=  ==~   ~~--            
                  -    ==  =+ +=+=*-^~:::::=+++++)*^^+=++ +=  =~    -                
                   ~=   ==  + ++ ++>(>::-+++++++^]()++ += +  ==  ~=                  
                --   -~  ==  = ++++<%(>-~+++++++])%>*+=+ ==~== ~~    --              
                       ~= *=(***+ ++%[)>~++++++><#{++ =**=<)= ==                     
                     ~  *^=)]})[=* ^*#<<{)*+*<}<%[^*=++>(]{]=** ~~                   
                  :-  *++{]{{###{}****^}#####%}(**=*=)}%##%{({<~^  -                 
                      ^=)#%%]<]><][[<^+*^**+**^*+*^(]()>((<#%{[~^                    
                       ^=<)*+^^^^^~<]##](^^+*^<]}#[]+*^^*^*=>)**                     
                             ~~    +*=*))%%%}>])<=**    ~-                           
                            -      *^+>[[<+)[{%}(++^      -                          
                        *+++++*+++<{%#{(>*+^*+><[{#{<*++*+==+++                      
                       *>})))<(<]#{])=^^        ^+*][%}<>]))<)[=^                    
                       +)}%%%%[]>+**               ^*+*](#[]%#[~^                    
                       +(#%%#}*+>                      ^=[}%%%{=>                    
                       ^^))<)+^                         +*)[(><*                     
                         *+^=*                            +=**                       
`).green;

console.log(asciiArt);

(async function f() {
    await fs.ensureDir(directory);

    const getLastExistingComicNumber = async () => {
        const files = await fs.readdir(directory);
        const directories = files.filter(file => fs.statSync(path.join(directory, file)).isDirectory());
        if (directories.length === 0) return start;
        const numbers = directories.map(dir => parseInt(dir)).filter(num => !isNaN(num));
        return Math.max(...numbers, start);
    };

    const downloadComic = async (issueNum) => {
        const comicDir = path.join(directory, issueNum.toString());
        if (fs.existsSync(path.join(comicDir, 'issue.json'))) {
            console.log('Reading from cache'.magenta);
            return require(path.join(comicDir, 'issue.json'));
        } else {
            try {
                const response = await axios.get(`${baseURL}/api/v2/issues/${issueNum}?stories-full=1`, { headers });
                if (response.status !== 200) {
                    console.log(`Failed to fetch comic ${issueNum}: HTTP ${response.status}`.red);
                    fs.appendFileSync('errors.txt', `${baseURL}/api/v2/issues/${issueNum}?stories-full=1 - HTTP ${response.status}\r\n`);
                    process.exit(1); // Stop the script if response is not 200
                }
                return response.data;
            } catch (e) {
                console.log(e.message.toString().red);
                fs.appendFileSync('errors.txt', `${baseURL}/api/v2/issues/${issueNum}?stories-full=1\r\n`);
                process.exit(1); // Stop the script if there is an error
            }
        }
    };

    const processComic = async (issueNum, startTime, totalIssues, processedIssues) => {
        console.log(`[${issueNum}/${end}] Starting download...`.green);
        console.log(`Processing Comic #${issueNum.toString().blue}`);
        await fs.ensureDir(path.join(directory, issueNum.toString()));
        const comic = await downloadComic(issueNum);
        if (!comic) return;

        await fs.writeFile(path.join(directory, issueNum.toString(), 'issue.json'), JSON.stringify(comic, null, 2));
        console.log(`Downloading ${comic.story_count.toString().blue} Stories...`.green);

        for (let storyIndex in comic.stories) {
            const story = comic.stories[storyIndex];
            const storyPrefix = `${issueNum}-${parseInt(storyIndex) + 1}`;
            console.log(`Downloading Story #${storyIndex.toString().blue} "${story.title.yellow}" ${'with'.green} ${story.pages.length.toString().blue} ${'pages'.blue}`);

            for (let pageIndex in story.pages) {
                const page = story.pages[pageIndex];
                const pagePrefix = `${storyPrefix}-Page_${parseInt(pageIndex) + 1}`;
                const imageVersionKeys = Object.keys(page.images);
                console.log(`Found ${imageVersionKeys.length.toString().blue} different Images for page ${parseInt(pageIndex) + 1}`);

                for (let imageIndex in imageVersionKeys) {
                    const imageKey = imageVersionKeys[imageIndex];
                    console.log(`Attempting Image Version ${imageKey.yellow}`);
                    const url = baseURL + page.images[imageKey].url;
                    let imageData;
                    try {
                        imageData = await axios.get(url, { responseType: 'arraybuffer', headers });
                    } catch (e) {
                        console.log(e.message.toString().red);
                        fs.appendFileSync('errors.txt', url + '\r\n');
                        continue;
                    }

                    const storyNum = parseInt(storyIndex) + 1;
                    const pageNum = parseInt(pageIndex) + 1;
                    const savepath = path.join(directory, issueNum.toString(), `Story_${storyNum}`, `Page_${pageNum}`);
                    await fs.ensureDir(savepath);
                    await fs.writeFile(path.join(savepath, `${issueNum}_${storyNum}_${pageNum}_${imageKey}${path.extname(url)}`), imageData.data);
                }
            }
        }

        // Calculate ETA
        const currentTime = new Date();
        const elapsedTime = (currentTime - startTime) / 1000; // seconds
        const averageTimePerComic = elapsedTime / processedIssues;
        const remainingIssues = totalIssues - processedIssues;
        const etaSeconds = remainingIssues * averageTimePerComic;

        const etaHours = Math.floor(etaSeconds / 3600);
        const etaMinutes = Math.floor((etaSeconds % 3600) / 60);
        const etaSecondsRemaining = Math.floor(etaSeconds % 60);

        console.log(`ETA for remaining comics: ${etaHours}h ${etaMinutes}m ${etaSecondsRemaining}s`.cyan);
    };

    const lastExistingComic = await getLastExistingComicNumber();
    const startIssueNum = lastExistingComic + 1;

    if (startIssueNum > end) {
        console.log('All issues are already downloaded.'.green);
        return;
    }

    console.log('Starting download from Comic #'.green + startIssueNum.toString().blue + ' to '.green + end.toString().blue);

    const startTime = new Date();
    const totalIssues = end - startIssueNum + 1;
    let processedIssues = 0;

    for (let issueNum = startIssueNum; issueNum <= end; issueNum++) {
        await processComic(issueNum, startTime, totalIssues, ++processedIssues);

        try {
            fs.writeJsonSync(path.join(__dirname, 'progress.json'), { lastIssue: issueNum });
        } catch (err) {
            console.log('Error writing progress file:', err.message.red);
        }
    }
})();
