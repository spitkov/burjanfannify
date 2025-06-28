let extensionIsDisabled;
let appearChance;
let flipChance;

function loadSettings() {
    chrome.storage.local.get({
        extensionIsDisabled: false,
        appearChance: 1.00,
        flipChance: 0.25
    }, function (data) {
        
        document.getElementById('disableExtension').checked = !data.extensionIsDisabled;
        
        
        const appearSlider = document.getElementById('appearChance');
        const flipSlider = document.getElementById('flipChance');
        
        appearSlider.value = data.appearChance * 100;
        flipSlider.value = data.flipChance * 100;
        
        
        document.getElementById('appearChanceValue').textContent = Math.round(data.appearChance * 100);
        document.getElementById('flipChanceValue').textContent = Math.round(data.flipChance * 100);
        
        
        extensionIsDisabled = data.extensionIsDisabled;
        appearChance = data.appearChance;
        flipChance = data.flipChance;
    });
}

function saveSettings() {
    const isEnabled = document.getElementById('disableExtension').checked;
    const appearValue = parseInt(document.getElementById('appearChance').value) / 100;
    const flipValue = parseInt(document.getElementById('flipChance').value) / 100;
    
    const data = {
        extensionIsDisabled: !isEnabled,
        appearChance: appearValue,
        flipChance: flipValue
    };
    
    
    const statusElement = document.getElementById('status');
    statusElement.textContent = 'Saving...';
    statusElement.style.color = 'blue';

    chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
            statusElement.textContent = 'Error saving settings!';
            statusElement.style.color = 'red';
        } else {
            statusElement.textContent = 'Settings saved!';
            statusElement.style.color = 'green';
            
            
            extensionIsDisabled = !isEnabled;
            appearChance = appearValue;
            flipChance = flipValue;
            
            
            chrome.tabs.query({url: "*://*.youtube.com/*"}, function(tabs) {
                tabs.forEach(function(tab) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: "settingsUpdated",
                        settings: data
                    });
                });
            });
        }
        
        
        setTimeout(() => {
            statusElement.textContent = '';
        }, 2000);
    });
}

function updateSliderValue(slider, valueDisplay) {
    valueDisplay.textContent = slider.value;
}

function ChangeNameInHeading() {
    let extensionName = chrome.runtime.getManifest().name;
    extensionName = extensionName.replace(/youtube/i, '').trim();
    const titleElement = document.getElementById('extension-title');
    titleElement.textContent = titleElement.textContent.replace('TITLE', extensionName);
}


document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    ChangeNameInHeading();
    
    
    document.getElementById('disableExtension').addEventListener('change', saveSettings);
    
    
    const appearSlider = document.getElementById('appearChance');
    const flipSlider = document.getElementById('flipChance');
    const appearValueDisplay = document.getElementById('appearChanceValue');
    const flipValueDisplay = document.getElementById('flipChanceValue');
    
    
    appearSlider.addEventListener('input', () => {
        updateSliderValue(appearSlider, appearValueDisplay);
    });
    
    flipSlider.addEventListener('input', () => {
        updateSliderValue(flipSlider, flipValueDisplay);
    });
    
    
    appearSlider.addEventListener('change', saveSettings);
    flipSlider.addEventListener('change', saveSettings);
});
