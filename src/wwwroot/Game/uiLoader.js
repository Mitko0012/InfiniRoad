const uiContainer = document.getElementById("ui-container");
const pages = [
    {name: "startPage", htmlSrc: "Game/Pages/startPage.html"},
    {name: "roadDecisionPage", htmlSrc: "Game/Pages/roadDecision.html"}
]

function setUiResources() {
    for(let page of pages)
        resourcesToLoad[page.name] = {type: "text", source: page.htmlSrc};
}

function setFullPageUI(html) {
    let encapsuledHtml = `<div class="background-div"> ${html} </div>`
    uiContainer.innerHTML = encapsuledHtml;
}

function clearUI() {
    uiContainer.innerHTML = "";
}