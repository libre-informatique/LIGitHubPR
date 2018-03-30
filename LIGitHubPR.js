// ==UserScript==
// @name     GitHub PR
// @version  1
// @grant    none
// @match https://github.com/*
// ==/UserScript==

// icons.tabIcon : Icon made from <a href="http://www.onlinewebfonts.com/icon">Icon Fonts</a> is licensed by CC BY 3.0

var itemCount = 0;
var totalFilesCountReached = false;
var checkFileTotalInterval = null;
var isRunning = false;

var icons = {
    folder: '&#128447;',
    file: '&#128459;',
    tabIcon: '<svg height="16" version="1.1" width="14" class="octicon octicon-tree-file" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"><metadata> Svg Vector Icons : http://www.onlinewebfonts.com/icon </metadata><g><g transform="translate(0.000000,511.000000) scale(0.100000,-0.100000)"><path d="M905.9,4987.4c-42.6-15.5-96.9-48.4-124-73.6c-106.6-98.8-102.7-44.6-102.7-1459c0-1482.3-7.7-1402.8,153.1-1503.6l87.2-56.2h1149h1149V-672.4c0-2735.9-1.9-2656.4,87.2-2691.3c17.4-5.8,441.8-11.6,941.7-11.6H5155v-546.4c0-302.3,9.7-579.3,19.4-616.2c23.3-87.2,145.3-207.3,234.5-232.5c93-27.1,3567.1-25.2,3664,0c40.7,11.6,98.8,42.6,131.7,71.7c120.1,100.8,116.3,52.3,116.3,1271v1112.2l-44.6,65.9c-23.3,34.9-73.6,85.3-108.5,108.5l-65.9,44.6h-829.3h-827.4l-430.1,213.1L6585-1668.3l-604.5-5.8l-606.5-5.8l-69.7-54.2c-137.6-104.6-139.5-110.4-145.3-755.7l-5.8-575.5h-813.8h-811.9v1567.5V69.7l63.9,9.7c79.5,15.5,1461,15.5,1519.1,0c42.6-9.7,42.6-11.6,48.4-585.2l5.8-577.4l52.3-77.5c31-46.5,85.3-95,135.6-120.1c85.3-40.7,91.1-40.7,1891.1-40.7c1226.5,0,1821.3,5.8,1858.2,21.3c65.9,25.2,155,106.6,191.8,176.3c23.3,42.6,27.1,242.2,27.1,1149c0,1222.6,3.9,1180-131.7,1284.6l-67.8,52.3l-854.5,9.7l-854.5,9.7l-416.6,207.3l-416.6,209.3h-569.7c-542.5,0-575.4-1.9-656.8-40.7c-50.4-25.2-104.6-73.6-135.6-120.1l-52.3-77.5l-5.8-579.4l-5.8-577.4h-813.8h-811.9v746v744l548.3,5.8l550.3,5.8l69.7,54.3c147.3,110.4,139.5,48.4,139.5,1284.6V4348l-54.3,81.4c-29.1,44.6-87.2,98.8-129.8,120.1c-71.7,36.8-112.4,38.8-901,38.8h-825.4l-410.8,209.3l-410.8,207.3l-561.9,3.9C1101.6,5012.5,964,5008.7,905.9,4987.4z M2442.4,4491.3l397.2-203.5l842.9-9.7l842.9-9.7V3241.6V2214.7l-1767.1-5.8l-1769-3.9v1251.7v1249.8l529-5.8l527-5.8L2442.4,4491.3z M6937.6,1274.9l428.2-213.1h821.5h823.5V25.2v-1036.6l-1767.1,3.9l-1769,5.8l-3.9,1220.7c-1.9,672.3,0,1232.3,3.9,1245.9c5.8,17.4,127.9,23.2,521.2,23.2h511.5L6937.6,1274.9z M6937.6-2193.4l430.1-213.1h821.5h821.5v-1036.6v-1036.6l-1767.1,3.9l-1769,5.8l-3.9,1245.9l-3.9,1243.9h521.2h521.2L6937.6-2193.4z"/></g></g></svg>'
}

function collectFiles() {
    var tabCounter = document.getElementById('files_tab_counter');

    if (tabCounter.length == 0) {
        return;
    }

    var expectedFilesCount = document.getElementById('files_tab_counter').textContent.trim();
    var files = document.querySelectorAll('.js-diff-progressive-container .link-gray-dark[title]');
    var input = [];

    if (parseInt(expectedFilesCount, 10) == parseInt(files.length, 10)) {
        totalFilesCountReached = true;
    }

    for (file of files) {
        input.push({ path: '/' + file.getAttribute('title'), link: file.getAttribute('href') });
    }

    // See https://stackoverflow.com/a/6232943
    var output = [];
    for (var i = 0; i < input.length; i++) {
        var chain = input[i].path.split("/");
        var currentNode = output;
        for (var j = 0; j < chain.length; j++) {
            var wantedNode = chain[j];
            var lastNode = currentNode;
            for (var k = 0; k < currentNode.length; k++) {
                if (currentNode[k].name == wantedNode) {
                    currentNode = currentNode[k].children;
                    break;
                }
            }
            if (lastNode == currentNode) {
                let isFile = wantedNode == chain[chain.length - 1];
                var newNode = currentNode[k] = { name: wantedNode, children: [], path: input[i].path, link: input[i].link, isFile: isFile };
                currentNode = newNode.children;
            }
        }
    }

    return output;
}

function addToggler() {
    if (document.querySelectorAll('.file-tree-toggler').length > 0) {
        return;
    }

    var html = '<a href="#" class="file-tree-toggler">' +
        icons.tabIcon +
        ' File tree' +
        '<div class="signal-loader">&#10003;</div></a>';
    var togglerElement = createElementFromHTML(html);

    togglerElement.addEventListener('click', function(e) {
        e.preventDefault();

        let treeMain = document.querySelectorAll('.pr-file-tree');
        treeMain = treeMain.length > 0 ? treeMain[0] : null;

        if (document.querySelectorAll('.pr-file-tree').length == 0) {
            buildUI();
        }

        if (treeMain !== null) {
            if (window.getComputedStyle(treeMain).display === 'none') {
                treeMain.style.display = 'block';
            } else {
                treeMain.style.display = 'none';
            }
        }
    });

    document.getElementsByTagName('body')[0].appendChild(togglerElement);
}

function removeToggler() {
    let toggler = document.querySelectorAll('.file-tree-toggler');
    if (toggler.length == 0) {
        return;
    }

    toggler[0].parentNode.removeChild(toggler[0]);
}

function buildUI() {
    var mainPanel = '<div class="pr-file-tree"></div>';
    var mainPanelElement = createElementFromHTML(mainPanel);

    document.getElementsByTagName('body')[0].appendChild(mainPanelElement);

    var fileList = document.getElementsByClassName('pr-file-tree')[0];

    var files = collectFiles();

    for (var i = 0; i < files.length; i++) {
        displayItem(fileList, files[i], 0);
    }

    var fileLinks = document.querySelectorAll('.pr-file-tree a');

    for (fileLink of fileLinks) {
        fileLink.addEventListener('click', function() {
            this.style.opacity = 0.5;
        });
    }

    var refreshHtml = '<a href="#" class="file-tree-refresh">' +
        '&#128472; Refresh' +
        '</a>';
    var refreshElement = createElementFromHTML(refreshHtml);

    mainPanelElement.insertBefore(refreshElement, mainPanelElement.firstChild);

    refreshElement.addEventListener('click', function(e) {
        e.preventDefault();

        document.querySelectorAll('body')[0].removeChild(document.querySelectorAll('.pr-file-tree')[0]);

        buildUI();
    });
}

function displayItem(container, item, level) {

    var fileName = item.path.substring(item.path.length - (item.name.length + 1), item.path.length);
    var itemHtml = '<div class="item item-' + level + '">';

    if (item.isFile == true) {
        itemHtml += '<a href="' + item.link + '" title="' + item.path + '">' + '&nbsp;'.repeat(level * 3) + '&nbsp;' + icons.file + '&nbsp;' + item.name + '</a>';
    } else {
        itemHtml += '<span style="font-weight:bold;">' + '&nbsp;'.repeat(level * 3) + icons.folder + '&nbsp;' + item.name + '</span>';
    }

    itemHtml += '</div>';
    itemCount++;

    var itemElement = createElementFromHTML(itemHtml);
    if (item.isFile == false && level > 0) {
        itemElement.classList.add('collapsed');
        itemElement.classList.add('item-dir');
        itemElement.querySelectorAll('span')[0].addEventListener('click', function(e) {
            var elem = e.currentTarget.parentNode;
            if (hasClass(elem, 'collapsed')) {
                elem.classList.add('expanded');
                elem.classList.remove('collapsed');
            } else {
                elem.classList.add('collapsed');
                elem.classList.remove('expanded');
            }
        });
    } else if (item.isFile == false && level == 0) {
        itemElement.querySelectorAll('span')[0].innerHTML = '';
    }

    container.appendChild(itemElement);

    sortTreeItems(item.children);

    if (item.children.length > 0) {
        for (var i = 0; i < item.children.length; i++) {
            displayItem(itemElement, item.children[i], level + 1);
        }
    }
}


function sortTreeItems(items) {
    items.sort(function(a, b) {
        let isFileA = a.isFile;
        let isFileB = b.isFile;

        let nameA = a.name;
        let nameB = b.name;

        if (isFileA == isFileB) {
            if (nameA > nameB) return 1;
            if (nameA < nameB) return -1;
        } else {
            if (isFileA == false) return -1;
            if (isFileB == false) return 1;
        }
    });
}

function runApplication() {

    // @TODO: Make a polling loop to check current url and check if it matches with pull requests url pattern

    isRunning = true;

    checkFileTotalInterval = setInterval(function() {
        console.info('interval run');
        if (totalFilesCountReached === false) {
            collectFiles();
        } else {
            document.getElementsByClassName('signal-loader')[0].classList.add('ok');
            clearInterval(checkFileTotalInterval);
        }
    }, 1000);
}

function stopApplication() {
    isRunning = false;
    clearInterval(checkFileTotalInterval);
    itemCount = 0;
    totalFilesCountReached = false;
    checkFileTotalInterval = null;
    let treePanel = document.querySelectorAll('.pr-file-tree');
    if (treePanel.length > 0) {
        treePanel[0].parentNode.removeChild(treePanel[0]);
    }
}

function initStyles() {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode("test"));
    document.head.appendChild(style);

    style.sheet.insertRule(
        ".pr-file-tree {" +
        "    left: 0;" +
        "    min-width: 300px;" +
        "    width: 350px;" +
        "    max-height: 500px;" +
        "    height: 500px;" +
        "    background: #FFF;" +
        "    color: #666;" +
        "    box-shadow: 0 2px 2px #222;" +
        "    z-index: 999;" +
        "    overflow: scroll;" +
        "    position: fixed;" +
        "    bottom: 5em;" +
        "}"
    );

    style.sheet.insertRule(
        ".pr-file-tree *.collapsed > .item {" +
        "    display: none;" +
        "}"
    );

    style.sheet.insertRule(
        ".pr-file-tree *.expanded > .item {" +
        "    display: block;" +
        "}"
    );

    style.sheet.insertRule(
        ".pr-file-tree .item {" +
        "    background: #FFF;" +
        "}"
    );

    style.sheet.insertRule(
        ".pr-file-tree .item a {" +
        "    width: 100%;" +
        "    display: inline-block;" +
        "    padding: 0.2em 0;" +
        "}"
    );

    style.sheet.insertRule(
        ".pr-file-tree .item a:hover {" +
        "    background: #EEE;" +
        "    text-decoration: none;" +
        "}"
    );

    style.sheet.insertRule(
        ".pr-file-tree .item.item-dir {" +
        "    cursor: pointer;" +
        "    border: none;" +
        "}"
    );


    style.sheet.insertRule(
        ".pr-file-tree .item.item-dir span {" +
        "    display: inline-block;" +
        "    width: 100%;" +
        "    padding: 0.2em 0;" +
        "}"
    );

    style.sheet.insertRule(
        ".pr-file-tree .item.item-dir span:hover {" +
        "    background-color: #EEE;" +
        "}"
    );

    style.sheet.insertRule(
        ".pr-file-tree .file-tree-refresh {" +
        "    background: #666;" +
        "    color: #FFF;" +
        "    padding: 0 0.5em;" +
        "    border-radius: 0 0 0.3em 0.3em;" +
        "    font-size: 0.8em;" +
        "    position: absolute;" +
        "    right: 0;" +
        "    top: 0;" +
        "    z-index:9999;" +
        "}"
    );

    style.sheet.insertRule(
        ".file-tree-toggler {" +
        "    display: inline;" +
        "    position: fixed;" +
        "    bottom: 2em;" +
        "    left: -5.4em;" +
        "    box-shadow: 0 2px 2px #222;" +
        "    padding: 0.5em 2.5em 0.5em 0.5em;" +
        "    background: #2CBE4E;" +
        "    color: #FFF;" +
        "    border-radius: 0px 1rem 1rem 0px;" +
        "    transition: 0.3s;" +
        "}"
    );

    style.sheet.insertRule(
        ".file-tree-toggler:hover {" +
        "    left: 0;" +
        "    text-decoration: none;" +
        "}"
    );

    style.sheet.insertRule(
        ".file-tree-toggler .signal-loader {" +
        "    left: 0.67em;" +
        "}"
    );

    style.sheet.insertRule(
        ".file-tree-toggler:hover .signal-loader {" +
        "    left: 3.4em;" +
        "}"
    );

    style.sheet.insertRule(
        ".signal-loader {" +
        "    border: 5px solid #FFF;" +
        "    border-radius: 30px;" +
        "    height: 30px;" +
        "    margin: -15px 0 0 -15px;" +
        "    position: fixed;" +
        "    bottom: 1.07em;" +
        "    width: 30px;" +
        "    text-align: center;" +
        "    font-size: 2em;" +
        "    line-height: 1em;" +
        "    transition: 0.3s;" +
        "}"
    );

    style.sheet.insertRule(
        ".signal-loader:not(.ok) {" +
        "    color: transparent;" +
        "    opacity: 0;" +
        "    animation: pulsate 1s ease-out;" +
        "    animation-iteration-count: infinite;" +
        "}"
    );

    style.sheet.insertRule(
        ".signal-loader.ok {" +
        "    border-width: 2px;" +
        "}"
    );

    style.sheet.insertRule(
        "@keyframes pulsate {" +
        "    0% {" +
        "        transform: scale(.1);" +
        "        opacity: 0.0;" +
        "    }" +
        "    50% {" +
        "        opacity: 1;" +
        "    }" +
        "    100% {" +
        "        transform: scale(1.2);" +
        "        opacity: 0;" +
        "    }" +
        "}"
    );
}

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    return div.firstChild;
}

function hasClass(target, className) {
    return new RegExp('(\\s|^)' + className + '(\\s|$)').test(target.className);
}

initStyles();

setInterval(function() {
    if (window.location.href.match(/https:\/\/github\.com\/.*\/pull\/.*/)) {
        addToggler();
        if (!isRunning) {
            runApplication();
        }
    } else {
        removeToggler();
        stopApplication();
    }
},2000);
