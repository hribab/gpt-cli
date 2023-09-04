const puppeteer = require("puppeteer-core");
const os = require("os");
const fs = require('fs');
const { tweet, tweetWithImage, reply, replyWithImage } = require("./twitterActions.js");

function isValidURL(str) {
    const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name and extension
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }

const launchBrowser = async (browserInstances) => {
    //TODO: Browser error when already launched.
    const username = os.userInfo().username;
    // console.log("it's launching");
    let userDataDir, executablePath, profileName;
    if (os.platform() === "darwin") {
        userDataDir = `/Users/${username}/Library/Application Support/Google/Chrome/`;
        executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    } else if (os.platform() === "win32") {
        userDataDir = `C:\\Users\\${username}\\AppData\\Local\\Google\\Chrome\\User Data\\`;
        executablePath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
    } else if (os.platform() === "linux") {
        userDataDir = `/home/${username}/.config/google-chrome/`;
        executablePath = "/usr/bin/google-chrome"
    } else {
        // handle failure
    }
    const files = fs.readdirSync(userDataDir);

    const profileFile = files.find(file => file.startsWith('Profile'));
          
    if (profileFile) {
        profileName = profileFile
    } else {
        profileName = "Default"
    }
    // console.log("profileName", profileName)

    const browser = await puppeteer.launch({
        executablePath: executablePath,
        userDataDir: `${userDataDir}${profileName}`,
        slowMo: 1000,
        headless: false,
        defaultViewport: null,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-restore-session-state", "--disable-session-crashed-bubble"],
        permissions: ["clipboard-read", "clipboard-write"],
        ignoreDefaultArgs: ["--enable-automation"],
    });

    browserInstances.push(browser);

    try{
        // console.log("opening the page");
        let page = await browser.newPage();
        const pages = await browser.pages();
        // console.log("pages:",pages);
        // If there are open pages, close the first one
        if (pages.length > 0) {
            await pages[0].close();
        }
        await page.goto("https://twitter.com/home");
        await page.waitForTimeout(1000);
        await page.waitForSelector("div.public-DraftStyleDefault-block span", {
            timeout: 180000,
        });
        // console.log("twitter logged");
        return page;
    }
    catch(err){
        // // console.log("error-------", err);
        return
    }
}

const performAction = async (page, action, userRequirement, contentFromURLIfAny, allTweets) => {
    switch (action) {
        case "tweet":
            await tweet(page, userRequirement, contentFromURLIfAny, allTweets);
            break;
        case "tweetWithImage":
            await tweetWithImage(page, userRequirement,contentFromURLIfAny, allTweets);
            break
        case "reply":
            await reply(page, userRequirement, contentFromURLIfAny);
            break
        case "replyWithImage":
            await replyWithImage(page, userRequirement, contentFromURLIfAny);
            break;   
    }
}

module.exports = {
    launchBrowser, 
    performAction,
    isValidURL
}