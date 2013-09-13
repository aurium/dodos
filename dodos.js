(function(exports){
/* * * Helpers * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function makeEl(tagName, conf) {
    var el = document.createElement(tagName);
    for ( att in conf ) {
        if ( att == 'parent' ) conf.parent.appendChild(el);
        else {
            if ( att == 'html' ) el.innerHTML = conf.html;
            else el.setAttribute(att, conf[att]);
        }
    }
    return el;
}

function setCookie(name, value, expireDays) {
    var expire = new Date();
    expire.setDate( expire.getDate() + (expireDays||365) );
    value = escape(value) + '; expires='+expire.toUTCString();
    document.cookie = name +'='+ value;
}

function getCookie(name) {
    var data = document.cookie.split(/;\s+/);
    for (var item,i=0; item=data[i]; i++) {
        item = item.split('=');
        if ( item[0] == name ) return unescape(item[1]);
    }
    return false;
}

/* * * Globals * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var dodos = [],
    totDodos,
    selectedDodo,
    things,
    gameInterval,
    dodoTarget,
    killedDodos,
    savedDodos,
    minimalDodosToSave,
    scoreboard,
    currentLevel,
    currentLevelNum,
    startTime,
    elapsedTime,
    rand = Math.random,
    abs = Math.abs,
    sqrt = Math.sqrt,
    pow = function(n,p){ return Math.pow(n,p||2) },
    dodoSound = new Audio('dodo.ogg'),
    coinSound = new Audio('coin.ogg'),
    getEl = function(id){ return document.getElementById(id) };

var area = getEl('area');
area.w = 800;
area.h = 500;
area.onclick = function(ev) {
    if (selectedDodo) {
        dodoSound.play();
        selectedDodo.target = { x:ev.pageX-area.offsetLeft, y:ev.pageY-area.offsetTop };
        dodoTarget.style.left = selectedDodo.target.x +'px';
        dodoTarget.style.top = selectedDodo.target.y +'px';
    }
};

/* * * Game * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

(window.onresize = function() {
    var areaTopMargin = ( window.innerHeight - area.h ) / 2;
    if ( areaTopMargin > 0 ) area.style.top = areaTopMargin+'px';
})();

function createThing(type, x, y, w, h) {
    console.log('createThing', type, x, y, w, h);
    var t;
    things.push(
        t = makeEl(type, {
            style: 'left:'+(x-10)+'px; top:'+(y-10)+'px;'+
                   'width:'+(w+20)+'px; height:'+(h+20)+'px',
            parent: area
        })
    );
    t.type = type; t.x = x; t.y = y; t.w = w; t.h = h;
    if (type=='exit') t.innerHTML = '<e></e><e></e>'
}

function removeDodoSelection() {
    if ( selectedDodo ) {
        selectedDodo.className = '';
        selectedDodo = null;
        dodoTarget.style.left = '-99px';
    }
}

function dodoClicked(ev) {
    dodoSound.play();
    removeDodoSelection();
    ev.stopPropagation();
    dodoTarget.style.left = '-99px';
    selectedDodo = this;
    for (var dodo,i=0; dodo=dodos[i]; i++) {
        dodo.className = '';
        dodo.target = null;
    }
    this.className = 'sel';
}

function nearCollectiveMiddleFor(dodo) {
    var tot=0, x=0, y=0;
    for (var d,i=0; d=dodos[i]; i++) {
        if ( d!=dodo && (pow(abs(dodo.x-d.x)) + pow(abs(dodo.y-d.y))) < pow(300) ) {
            tot++;
            x += d.x;
            y += d.y;
            if ( d == selectedDodo ) {
                tot += pow(totDodos,1.5);
                x += d.x*pow(totDodos,1.5);
                y += d.y*pow(totDodos,1.5);
            } 
        }
    }
    if (tot==0) return { x:area.w*rand(), y:area.h*rand() };
    else return { x:x/tot, y:y/tot };
}

function calcDist(p1, p2) {
    return sqrt( pow(p2.x-p1.x) + pow(p2.y-p1.y) );
}

function dodoColisionFor(dodo) {
    for (var d,i=0; d=dodos[i]; i++) {
        if ( d!=dodo && (pow(abs(dodo.x-d.x)) + pow(abs(dodo.y-d.y))) < pow(34) ) {
            return d;
        }
    }
}

function removeDodoFromCollective(dodo) {
    if ( dodo == selectedDodo ) removeDodoSelection();
    var newList = [];
    for (var d,i=0; d=dodos[i]; i++) {
        if ( d != dodo ) newList.push(d);
    }
    dodos = newList;
    dodo.onclick = function(){ };
    setTimeout(function(){ if(dodo.parentNode) dodo.parentNode.removeChild(dodo) }, 3000);
}

function updateScoreboard() {
    scoreboard.innerHTML =
        'Saved: '+savedDodos+' <small>('+minimalDodosToSave+'+)</small>'+
        ' &nbsp; Killed: '+killedDodos+' <small>(of '+totDodos+')</small>'+
        ' &nbsp; Time left: '+(currentLevel.time-elapsedTime)+'sec';
}

function killDodo(dodo) {
    killedDodos++;
    removeDodoFromCollective(dodo);
    if ( dodos.length == 0 ) {
        clearInterval(gameInterval);
        prompt(
            '<h1>This Dodos fail<br><big>☹</big></h1>'+
            '<p>You left all your dodos to the death without honor.</p>'+
            getRecords(),
            function(){ init(true) }
        )
    }
}

function saveDodo(dodo) {
    coinSound.play();
    savedDodos++;
    removeDodoFromCollective(dodo);
    dodo.className = 'saved';
    if ( dodos.length == 0 ) {
        clearInterval(gameInterval);
        if ( savedDodos >= minimalDodosToSave ) {
            finishLevel();
            prompt(
                '<h1>This Dodos was Saved!<br><big>😄</big></h1>'+
                '<p>They are happy now in Sto\'Vo\'Kor.</p>'+
                getRecords(),
                function(){ init(true) }
            )
        } else {
            prompt(
                '<h1>This Dodos fail<br><big>☹</big></h1>'+
                '<p>You left many of your dodos to the death without honor.</p>'+
                getRecords(),
                function(){ init(true) }
            )
        }
    }
}

function getRecords() {
    var lastLevel = getCookie('lastFinishedLevel');
    if (lastLevel) {
        var html = 'Best moments:';
        lastLevel = parseInt(lastLevel);
        for (var i=0; i<=lastLevel; i++) {
            var level = JSON.parse(getCookie('level'+i));
            html += '<li>Level '+(i+1)+': Saved:'+level.saved+
                    ' Killed:'+level.killed+' Time:'+level.time+'sec</li>'
        }
        return html;
    } else {
        return '';
    }
}

function finishLevel() {
    if ( currentLevelNum >= 0 ) {
        console.log('finish level',currentLevelNum);
        setCookie('lastFinishedLevel', currentLevelNum);
        lastRec = getCookie('level'+currentLevelNum);
        if (lastRec) lastRec = JSON.parse(lastRec);
        if ( !lastRec || lastRec.saved<savedDodos ||
             (lastRec.saved==savedDodos && lastRec.time>elapsedTime)
           ) {
            setCookie('level'+currentLevelNum,
                JSON.stringify({
                    saved: savedDodos,
                    killed: killedDodos,
                    time: elapsedTime
                })
            );
        }
    }
}

thingAct = {
    water: function(thing, dodo) {
        killDodo(dodo);
        dodo.className = 'drowned';
    },
    hole: function(thing, dodo) {
        killDodo(dodo);
        dodo.className = 'fallen';
    },
    exit: function(thing, dodo) {
        var exitMid = { x:thing.x+thing.w/2, y:thing.y+thing.h/2 };
        dodo.target = exitMid;
        if ( calcDist(dodo, exitMid) < 8 ) saveDodo(dodo);
    }
};

function detectSenaryThingsFor(dodo) {
    for ( var thing,i=0; thing=things[i]; i++ ) {
        if ( dodo.x > thing.x && dodo.x < (thing.x+thing.w) &&
             dodo.y > thing.y && dodo.y < (thing.y+thing.h) ){
            thingAct[thing.type](thing, dodo);
        }
    }
}

function vect1(v, inc) {
    if (!inc) inc = 1;
    var pSum = pow(v.x) + pow(v.y);
    if ( pSum == 0 ) {
        return { x:1, y:0 };
    } else {
        h = sqrt(pSum);
        return { x:v.x*inc/h, y:v.y*inc/h };
    }
}

function act(dodo) {
    var goTo, goTo2, d, s, colid, v1, newAngle;
    detectSenaryThingsFor(dodo);
    if ( colid = dodoColisionFor(dodo) ) {
        dodo.inertia = goTo = vect1({ x:dodo.x-colid.x, y:dodo.y-colid.y }, 2);
    } else {
        if ( dodo.target ) {
            goTo = vect1({ x:dodo.target.x-dodo.x, y:dodo.target.y-dodo.y }, 3);
        } else {
            goTo = nearCollectiveMiddleFor(dodo);
            if ( (d=calcDist(dodo, goTo)) < 150 ) {
                goTo2 = { x:area.w*rand(), y:area.h*rand() };
                d = d / 150;
                goTo = {
                    x: goTo.x*d + goTo2.x*(1-d),
                    y: goTo.y*d + goTo2.y*(1-d)
                };
            }
            var inc = 1;
            if ( selectedDodo && calcDist(dodo, selectedDodo) > 100 ) inc = 3;
            goTo = vect1({ x:goTo.x-dodo.x, y:goTo.y-dodo.y }, inc);
        }
    }
    if ( dodo.x < 20 )        goTo.x += 1;
    if ( dodo.x > area.w-20 ) goTo.x -= 1;
    if ( dodo.y < 20 )        goTo.y += 1;
    if ( dodo.y > area.h-20 ) goTo.y -= 1;
    dodo.inertia.x = goTo.x = ( dodo.inertia.x*14 + goTo.x ) / 15;
    dodo.inertia.y = goTo.y = ( dodo.inertia.y*14 + goTo.y ) / 15;
    dodo.x += goTo.x;
    dodo.y += goTo.y;
    v1 = vect1(goTo);
    newAngle = Math.asin(v1.y) * (180/Math.PI);
    if ( v1.x < 0 ) newAngle = 180 - newAngle;
    dodo.angle = ( dodo.angle*2 + newAngle ) / 3
    s = dodo.style;
    s.left = dodo.x+'px';
    s.top  = dodo.y+'px';
    s.transform = s.OTransform = s.MozTransform = s.WebkitTransform = 'rotate('+dodo.angle+'deg)';
}

exports.init = function init(skipIntro) {
    if ( gameInterval ) clearInterval(gameInterval);
    killedDodos = savedDodos = 0;
    while (area.firstChild) area.removeChild(area.firstChild);
    dodoTarget = makeEl('m', { parent:area, html:'<x></x><x></x>' });
    scoreboard = makeEl('div', { 'class':'scoreboard', html:'Starting...', parent:area });
    if (skipIntro) {
        introBtOk();
    } else {
        var intro = getEl('intro');
        area.appendChild(intro);
        intro.style.display = 'block';
        getEl('introBt').focus();
    }
}

exports.introBtOk = function introBtOk() {
    var intro = getEl('intro');
    intro.style.display = 'none';
    document.body.appendChild(intro);
    levelSelector();
}

var levels = [
    {
        name: 'Starting the journey',
        time: 120,
        desc: 'Oh! Will be so easy to come to Sto\'Vo\'Kor!',
        conf: '20,10,-50,300|water,200,-10,300,100|hole,600,350,90,90|exit,650,100,120'
    },
    {
        name: 'Holy F*** Water',
        time: 90,
        desc: 'I wish I could swim in my next life.',
        conf: '15,7,-50,450|water,-10,-10,330,330|water,230,450,150,200|water,450,300,400,250|water,420,-10,400,150|exit,680,170,100'
    },
    {
        name: 'Holes',
        desc: 'Watch your step...',
        time: 60,
        conf: '20,7,-50,250'+
            '|hole,60,30,60,60|hole,160,-100,250,300|hole,500,170,120,120|hole,650,15,40,40|hole,720,30,50,50'+
            '|hole,70,400,60,60|hole,180,350,100,300|hole,310,300,170,150|hole,350,480,200,60|hole,510,320,80,80|hole,630,370,60,60|hole,600,470,120,60|hole,750,400,150,150'+
            '|exit,660,250,100'
    }
];
function levelSelector() {
    if ( document.location.search ) {
        var data = document.location.search.substr(1).split('&');
        currentLevelNum = -1;
        currentLevel = { name:'Unnamed', desc:'', time: 60, conf:'' };
        for ( var item,i=0; item=data[i]; i++ ) {
            item = item.split('=');
            if(item[0]=='level') item[0] = 'conf';
            currentLevel[item[0]] = unescape(item[1]);
        }
        console.log('User def level:',currentLevel)
        initGame(0, currentLevel);
    } else {
        var lastLevel = getCookie('lastFinishedLevel');
        lastLevel = lastLevel? parseInt(lastLevel) : -1;
        currentLevelNum = lastLevel+1;
        currentLevel = levels[currentLevelNum];
        if ( currentLevel ) {
            initGame( currentLevelNum+1, currentLevel );
        } else {
            prompt(
                '<h1>Congratulations!<br>You finish the journey</h1>'+
                '<p>Now the dodos are free from earth\'s violence and they will live a peaceful existence in Sto\'Vo\'Kor. Your name will be remembered by this successes and some day <u>they will come back</u> to take you to their paradise.</p>',
                function() {
                    setCookie('lastFinishedLevel', -1);
                    init();
                },
                'Restart the Game'
            );
        }
    }
}

function prompt(html, callback, btLabel) {
    if (!btLabel) btLabel = 'Ok!'
    var promptWin = makeEl('div', { 'class':'info', html:html, parent:area });
    var btArea = makeEl('p', { 'class':'bts', parent:promptWin });
    var bt = makeEl('button', {html:btLabel, parent:btArea});
    bt.onclick = function() {
        promptWin.parentNode.removeChild(promptWin);
        callback();
    };
    bt.focus();
}

function initGame(levelNum, levelData) {
    var thing, i, j, conf = levelData.conf.split('|');
    selectedDodo = null;
    elapsedTime = 0;
    var start = conf.shift().split(',');
    totDodos = parseInt(start[0]);
    minimalDodosToSave = parseInt(start[1]);
    start = { x:parseInt(start[2]), y:parseInt(start[3]) };
    updateScoreboard();
    console.log('Start:', totDodos, start);
    things = [];
    for ( i=0; thing=conf[i]; i++ ) {
        thing = thing.split(',');
        for ( j=1; j<5; j++ ) thing[j] = parseInt(thing[j]);
        conf[i] = thing;
    }
    // Add water:
    for ( i=0; thing=conf[i]; i++ ) {
        if ( thing[0] == 'water' ) createThing.apply(this, thing);
    }
    // Add light:
    for ( var i=0; i<200; i++ ) {
        s = 10 + Math.random()*8;
        makeEl('l', {
            style: 'width:'+s+'px; height:'+s+'px; opacity:'+(0.1+rand()/5)+';'+
                   'left:'+Math.round(rand()*area.w)+'px; top:'+Math.round(rand()*area.h)+'px;',
            parent: area
        });
    }
    // Add hole:
    for ( i=0; thing=conf[i]; i++ ) {
        if ( thing[0] == 'hole' ) createThing.apply(this, thing);
    }
    // Add exit:
    for ( i=0; thing=conf[i]; i++ ) {
        if ( thing[0] == 'exit' ) {
            thing[4] = thing[3];
            createThing.apply(this, thing);
        }
    }
    // Create Dodos:
    for ( var i=0; i<totDodos; i++ ) {
        setTimeout(function(){
            var d;
            dodos.push(
                d = makeEl('d', {
                    html: '<h><v></v><i></i><i></i></h>',
                    style: 'left:-99px',
                    parent: area
                })
            );
            d.onclick = dodoClicked;
            d.x = start.x;
            d.y = start.y;
            d.inertia = { x:2, y:rand()-0.5 }
            d.angle = 0;
        }, i*(900));
    }
    var title = '';
    if ( !levelNum || levelNum<1 ) title = 'User Level';
    else title = 'Level '+levelNum;
    if ( levelData.name ) title += '<br>'+ levelData.name;
    prompt(
        '<h1>'+title+'</h1>'+
        '<p>'+levelData.desc+'</p>'+
        '<p>There are '+totDodos+' dodos and you must save at least '+
        minimalDodosToSave+' in '+levelData.time+' seconds.</p>',
        function() {
            startTime = new Date();
            gameInterval = setInterval(gameTic, 50);
        }
    );
}

var lastTic;
function gameTic() {
    var now = new Date();
    if ( (now-lastTic) > 100 ) {
        water = document.getElementsByTagName('water');
        for (var wEl,i=0; wEl=water[i]; i++) wEl.className = 'noAnim';
    }
    lastTic = now;
    elapsedTime = Math.round( (now - startTime) / 1000 );
    if ( (currentLevel.time-elapsedTime) == 0 ) {
        clearInterval(gameInterval);
        if ( savedDodos >= minimalDodosToSave ) {
            finishLevel();
            prompt(
                '<h1>This Dodos was Saved!<br><big>😄</big></h1>'+
                '<p>They are happy now in Sto\'Vo\'Kor.</p>'+
                getRecords(),
                function(){ init(true) }
            )
        } else {
            prompt(
                '<h1>Time over<br><big>☹</big></h1>'+
                '<p>You must be faster to save this dodos.</p>'+
                getRecords(),
                function(){ init(true) }
            )
        }
    }
    for (var dodo,i=0; dodo=dodos[i]; i++) act(dodo);
    updateScoreboard();
}
})(this);
