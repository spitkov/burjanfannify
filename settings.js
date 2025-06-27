let extensionIsDisabled
let appearChance
let flipChance


function loadSettings() {
    browser.storage.local.get({
        extensionIsDisabled: false,
        appearChance: 1.00,
        flipChance: 0.25
    }, function (data) {
        document.getElementById('disableExtension').checked = !data.extensionIsDisabled;
        document.getElementById('appearChance').value = data.appearChance * 100;
        document.getElementById('flipChance').value = data.flipChance * 100;
    });
}


function saveSettings() {
    const data = {
        extensionIsDisabled: !document.getElementById('disableExtension').checked,
        appearChance: parseInt(document.getElementById('appearChance').value) / 100,
        flipChance: parseInt(document.getElementById('flipChance').value) / 100
    };

    browser.storage.local.set(data, () => {
        if (browser.runtime.lastError) {
            console.error("Error saving settings:", browser.runtime.lastError);
        } else {
            console.log("Settings saved successfully.");
        }
    });
}

function ChangeNameInHeading() {
    
    let extensionName = browser.runtime.getManifest().name;

    
    extensionName = extensionName.replace(/youtube/i, '').trim();

    const titleElement = document.getElementById('extension-title');
    titleElement.textContent = titleElement.textContent.replace('TITLE', extensionName);
}


document.addEventListener('DOMContentLoaded', loadSettings);


document.getElementById('disableExtension').addEventListener('input', saveSettings);
document.getElementById('appearChance').addEventListener('input', saveSettings);
document.getElementById('flipChance').addEventListener('input', saveSettings);

document.addEventListener('DOMContentLoaded', ChangeNameInHeading);
