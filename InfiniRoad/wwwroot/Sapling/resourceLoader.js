let resourceLoader = (() => {
    async function loadImage(src) {
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.crossOrigin = "annonymous";
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
        });
    }

    async function loadTextFile(src) {
        return fetch(src).then(t => t.text());
    }

    async function awaitMultipleResources(resourcesToAwait) {
        let result = await Promise.allSettled(resourcesToAwait);
        return result;x
    }

    return {
        loadImage,
        loadTextFile,
        awaitMultipleResources
    };
})();