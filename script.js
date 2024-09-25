let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1.5,
    canvasLeft = document.getElementById('pdf-render-left'),
    ctxLeft = canvasLeft.getContext('2d'),
    canvasRight = document.getElementById('pdf-render-right'),
    ctxRight = canvasRight.getContext('2d'),
    isSinglePageView = true; // Variable pour gérer le mode de vue

const url = 'Notice.pdf';

// Fonction pour rendre une page (gauche) ou deux pages (gauche et droite)
const renderPage = (num) => {
    pageRendering = true;

    // Récupérer la première page (pour canvas gauche)
    pdfDoc.getPage(num).then((page) => {
        const viewport = page.getViewport({ scale });
        canvasLeft.height = viewport.height;
        canvasLeft.width = viewport.width;

        const renderContext = {
            canvasContext: ctxLeft,
            viewport: viewport,
        };

        const renderTask = page.render(renderContext);

        renderTask.promise.then(() => {
            pageRendering = false;

            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });

        document.getElementById('page-num').textContent = num;
    });

    if (!isSinglePageView && num < pdfDoc.numPages) {
        // Si en mode double page et qu'il y a une page suivante, on la rend dans canvasRight
        pdfDoc.getPage(num + 1).then((page) => {
            const viewport = page.getViewport({ scale });
            canvasRight.height = viewport.height;
            canvasRight.width = viewport.width;

            const renderContext = {
                canvasContext: ctxRight,
                viewport: viewport,
            };

            const renderTask = page.render(renderContext);

            renderTask.promise.then(() => {
                // Si la deuxième page a été rendue avec succès
                console.log('Page suivante rendue');
            });
        });

        canvasRight.style.display = 'block'; // Affiche le canvas de droite
    } else {
        canvasRight.style.display = 'none'; // Cache le canvas de droite si en vue simple ou dernière page
    }
};

// Charger le PDF
pdfjsLib.getDocument(url).promise.then((pdfDoc_) => {
    pdfDoc = pdfDoc_;
    document.getElementById('page-count').textContent = pdfDoc.numPages;

    // Charger la première page
    renderPage(pageNum);
});

// Vue page simple
document.getElementById('single-page-view').addEventListener('click', () => {
    isSinglePageView = true; // Active la vue 1 page
    scale = 1.5; // Rétablit l'échelle de vue unique
    canvasRight.style.display = 'none'; // Cache le deuxième canvas
    canvasLeft.style.margin = '0 auto'; // Centre le canvas gauche
    renderPage(pageNum); // Re-rendre la page actuelle en mode simple
});

// Vue double page
document.getElementById('double-page-view').addEventListener('click', () => {
    isSinglePageView = false; // Active la vue 2 pages
    scale = 1; // Ajuste l'échelle pour que 2 pages tiennent côte à côte
    canvasRight.style.display = 'block'; // Affiche le deuxième canvas
    canvasLeft.style.marginLeft = '-10px'; // Retire le centrage individuel
    canvasLeft.style.marginRight = '-10px'; // Retire le centrage individuel
    canvasRight.style.marginLeft = '-10px'; // Retire le centrage individuel
    canvasRight.style.marginRight = '-10px'; // Retire le centrage individuel
    renderPage(pageNum); // Re-rendre la page actuelle et la suivante si possible
});

// Navigation avec les boutons "Page précédente" et "Page suivante"
document.getElementById('prev-page').addEventListener('click', () => {
    if (pageNum <= 1) {
        return;
    }
    pageNum -= isSinglePageView ? 1 : 2; // Si double page, on saute de 2 pages
    renderPage(pageNum);
});

document.getElementById('next-page').addEventListener('click', () => {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum += isSinglePageView ? 1 : 2; // Si double page, on saute de 2 pages
    renderPage(pageNum);
});

// Navigation avec les touches du clavier
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        if (pageNum > 1) {
            pageNum -= isSinglePageView ? 1 : 2;
            renderPage(pageNum);
        }
    } else if (event.key === 'ArrowRight') {
        if (pageNum < pdfDoc.numPages) {
            pageNum += isSinglePageView ? 1 : 2;
            renderPage(pageNum);
        }
    }
});
