const uiContainer = document.getElementById("ui-container");
const pages = [
    {name: "startPage", htmlSrc: "Game/Pages/startPage.html"},
    {name: "settingsPage", htmlSrc: "Game/Pages/settings.html"},
    {name: "roadDecisionPage", htmlSrc: "Game/Pages/roadDecision.html"},
    {name: "overlay", htmlSrc: "Game/Pages/overlay.html"},
    {name: "examEnd", htmlSrc: "Game/Pages/examEnd.html"}
];

function setUiResources() {
    for(let page of pages)
        resourcesToLoad[page.name] = {type: "text", source: page.htmlSrc};
}

function setFullPageUI(html) {
    let encapsuledHtml = `<div class="background-div"> ${html} </div>`
    uiContainer.innerHTML = encapsuledHtml;
}

function clearUI() {
    uiContainer.innerHTML = resourcesToLoad["overlay"].value;
}