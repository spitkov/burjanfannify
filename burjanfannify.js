const IMAGES_PATH = "images/";
let useAlternativeImages;
let flipBlacklist;
let blacklistStatus;
let EXTENSION_NAME;

let extensionIsDisabled = false;
let appearChance = 1.00; 
let flipChance = 0.25; 

function applyOverlay(thumbnailElement, overlayImageURL, flip = false) {
    try {
        if (!thumbnailElement || !thumbnailElement.parentElement) {
            return;
        }
        
        if (!overlayImageURL) {
            return;
        }
        
        const overlayImage = document.createElement("img");
        overlayImage.id = EXTENSION_NAME;
        overlayImage.src = overlayImageURL;
        overlayImage.style.position = "absolute";
        overlayImage.style.top = overlayImage.style.left = "50%";
        overlayImage.style.width = "100%";
        overlayImage.style.transform = `translate(-50%, -50%) ${flip ? 'scaleX(-1)' : ''}`;
        overlayImage.style.zIndex = "0";
        
        overlayImage.onerror = () => {
            overlayImage.remove();
        };
        
        thumbnailElement.parentElement.insertBefore(overlayImage, thumbnailElement.nextSibling);
    } catch (error) {
    }
};

function FindThumbnails() {
    const thumbnailSelectors = [
        "ytd-thumbnail a > yt-image > img.yt-core-image",
        'img.style-scope.yt-img-shadow[width="86"]',
        'img.style-scope.yt-img-shadow',
        'ytd-thumbnail img',
        'a[href^="/watch"] img',
    ];
    
    const regularThumbnails = document.querySelectorAll(thumbnailSelectors.join(", "));
    const videowallImages = document.querySelectorAll(".ytp-videowall-still-image");

    const targetAspectRatios = [16 / 9, 4 / 3];
    const errorMargin = 0.05;

    const aspectRatioFiltered = [...regularThumbnails].filter((image) => {
        if (image.height === 0) {
            return false;
        }
        
        const aspectRatio = image.width / image.height;
        const isCorrectRatio = targetAspectRatios.some(
            (ratio) => Math.abs(aspectRatio - ratio) < errorMargin
        );
        
        return isCorrectRatio;
    });
    
    const allThumbnails = [...aspectRatioFiltered, ...videowallImages];

    const filteredThumbnails = allThumbnails.filter((image) => {
        const parent = image.parentElement;
        if (!parent) {
            return false;
        }

        const isVideoPreview =
            parent.closest("#video-preview") !== null ||
            parent.tagName === "YTD-MOVING-THUMBNAIL-RENDERER";
            
        if (isVideoPreview) {
            return false;
        }
        
        const isChapter = parent.closest("#endpoint") !== null;
        if (isChapter) {
            return false;
        }
        
        const alreadyProcessed = [...parent.children].some(
            (child) => child.id && child.id.includes(EXTENSION_NAME)
        );
        
        if (alreadyProcessed) {
            return false;
        }

        return true;
    });
    
    return filteredThumbnails;
}

function applyOverlayToThumbnails() {
    const thumbnailElements = FindThumbnails();

    if (thumbnailElements.length === 0) {
        return;
    }
    
    let successCount = 0;
    
    thumbnailElements.forEach((thumbnailElement) => {
        try {
            const loops = Math.random() > 0.001 ? 1 : 20;
            
            for (let i = 0; i < loops; i++) {
                let flip = Math.random() < flipChance;
                let baseImagePath = getRandomImageFromDirectory();
                if (flip && flipBlacklist && flipBlacklist.includes(baseImagePath)) {
                    if (useAlternativeImages) {
                        baseImagePath = `textFlipped/${baseImagePath}`;
                    }
                    flip = false;
                }

                const overlayImageURL = Math.random() < appearChance ?
                    getImageURL(baseImagePath) :
                    "";
                
                applyOverlay(thumbnailElement, overlayImageURL, flip);
                successCount++;
            }
        } catch (error) {
        }
    });
}

function getImageURL(index) {
    const url = chrome.runtime.getURL(`${IMAGES_PATH}${index}.png`);
    return url;
}

async function checkImageExistence(index) {
    const testedURL = getImageURL(index);
    try {
        const response = await fetch(testedURL, { 
            method: 'HEAD',
            cache: 'no-cache'
        });
        return response.ok;
    } catch (error) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve(true);
            };
            img.onerror = () => {
                resolve(false);
            };
            img.src = testedURL;
        });
    }
}

const size_of_non_repeat = 8
const last_indexes = Array(size_of_non_repeat)

function getRandomImageFromDirectory() {
    let randomIndex = -1
    
    if (highestImageIndex <= size_of_non_repeat) {
        last_indexes.fill(-1);
    }
    
    while (last_indexes.includes(randomIndex) || randomIndex < 0) {
        randomIndex = Math.floor(Math.random() * highestImageIndex) + 1;
    }
    
    last_indexes.shift()
    last_indexes.push(randomIndex)

    return randomIndex
}

let highestImageIndex;

async function getHighestImageIndex() {
    const INITIAL_INDEX = 4;
    let i = INITIAL_INDEX;
    
    while (await checkImageExistence(i)) {
        i *= 2;
    }
    
    let min = i <= INITIAL_INDEX ? 1 : i / 2;
    let max = i;
    
    while (min <= max) {
        let mid = Math.floor((min + max) / 2);
        
        if (await checkImageExistence(mid)) {
            min = mid + 1;
        } else {
            max = mid - 1;
        }
    }
    
    highestImageIndex = max;
}

async function GetFlipBlocklist() {
    try {
        const response = await fetch(chrome.runtime.getURL(`${IMAGES_PATH}flip_blacklist.json`));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        useAlternativeImages = data.useAlternativeImages;
        flipBlacklist = data.blacklistedImages;
        blacklistStatus = `Flip blacklist found. ${useAlternativeImages ? "Images will be substituted." : "Images won't be flipped."}`;
    } catch (error) {
        blacklistStatus = "No flip blacklist found. Proceeding without it";
    }
}

async function LoadConfig() {
    const defaults = {
        extensionIsDisabled: false,
        appearChance: 1.0,
        flipChance: 0.25
    };

    try {
        const config = await new Promise((resolve, reject) => {
            chrome.storage.local.get(defaults, (result) => {
                chrome.runtime.lastError ?
                    reject(chrome.runtime.lastError) :
                    resolve(result);
            });
        });

        extensionIsDisabled = config.extensionIsDisabled;
        appearChance = config.appearChance;
        flipChance = config.flipChance;

    } catch (error) {
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "settingsUpdated") {
        extensionIsDisabled = message.settings.extensionIsDisabled;
        appearChance = message.settings.appearChance;
        flipChance = message.settings.flipChance;
        
        if (extensionIsDisabled) {
            removeAllOverlays();
        } else {
            applyOverlayToThumbnails();
        }
    }
    
    return true;
});

function removeAllOverlays() {
    try {
        const overlays = document.querySelectorAll(`img[id="${EXTENSION_NAME}"]`);
        
        overlays.forEach(overlay => {
            overlay.remove();
        });
    } catch (error) {
    }
}

async function Main() {
    try {
        EXTENSION_NAME = chrome.runtime.getManifest().name;
        await LoadConfig();

        if (extensionIsDisabled) {
            return;
        }

        await GetFlipBlocklist();
        await getHighestImageIndex();
        
        applyOverlayToThumbnails();
        
        const intervalId = setInterval(() => {
            if (!extensionIsDisabled) {
                applyOverlayToThumbnails();
            }
        }, 100);
        
        const observer = new MutationObserver((mutations) => {
            if (!extensionIsDisabled) {
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length > 0) {
                        applyOverlayToThumbnails();
                        break;
                    }
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    } catch (error) {
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        Main().catch(e => {});
    });
} else {
    Main().catch(e => {});
}
