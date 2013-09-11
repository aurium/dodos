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

var dodos = [],
    totDodos = 30,
    selectedDodo = null,
    things = [],
    rand = Math.random,
    abs = Math.abs,
    sqrt = Math.sqrt,
    pow = function(n,p){ return Math.pow(n,p||2) },
    getEl = function(id){ return document.getElementById(id) };

var area = getEl('area');
area.w = 800;
area.h = 500;
area.onclick = function(ev) {
    if (selectedDodo) {
        selectedDodo.target = { x:ev.pageX-area.offsetLeft, y:ev.pageY-area.offsetTop };
        dodoTarget.style.left = selectedDodo.target.x +'px';
        dodoTarget.style.top = selectedDodo.target.y +'px';
    }
};
var dodoTarget = makeEl('m', { parent:area, html:'<x></x><x></x>' });

function createThing(type, x, y, w, h) {
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

// Add water:
//makeEl('w', { style:'left:200px; top:-13px; width:300px; height:200px', parent:area });
createThing('water', 200, 0, 300, 160);

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
//makeEl('h', { style:'left:300px; top:300px; width:300px; height:213px', parent:area });
createThing('hole', 300, 340, 300, 200);

// Add exit:
//makeEl('exit', { style:'left:750px; top:120px', html:'<e></e><e></e>', parent:area });
createThing('exit', 700, 150, 120, 120);

function removeDodoSelection() {
    if ( selectedDodo ) {
        selectedDodo.className = '';
        selectedDodo = null;
        dodoTarget.style.left = '-99px';
    }
}

function dodoClicked(ev) {
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

/*function distToNearestDodoFor(dodo) {
    var minD=Infinity, n=0, nearest=null;
    for (var d,i=0; d=dodos[i]; i++) {
        if ( d!=dodo && (n=sqrt(pow(dodo.x-d.x) + pow(dodo.y-d.y))) < minD ) {
            minD = n;
            //nearest = d;
        }
    }
    return minD;
}*/

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

function killDodo(dodo) {
    if ( dodo == selectedDodo ) removeDodoSelection();
    var newList = [];
    for (var d,i=0; d=dodos[i]; i++) {
        if ( d != dodo ) newList.push(d);
    }
    dodos = newList;
    setTimeout(function(){ dodo.parentNode.removeChild(dodo) }, 3000);
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
        dodo.target = { x:thing.x+thing.w/2, y:thing.y+thing.h/2 };
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
    h = sqrt( pow(v.x) + pow(v.y) );
    return { x:v.x*inc/h, y:v.y*inc/h };
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
    s.transform = s.MozTransform = s.WebkitTransform = 'rotate('+dodo.angle+'deg)';
}

for ( var i=0; i<totDodos; i++ ) {
    setTimeout(function(){
        var d;
        dodos.push(
            d = makeEl('p', {
                html: '<b><u></u><i></i><i></i></b>',
                style: 'left:-99px',
                parent: area
            })
        );
        d.onclick = dodoClicked;
        d.x = -50;
        d.y = 250;
        d.inertia = { x:2, y:rand()-0.5 }
        d.angle = 0;
    }, i*(900));
}

setInterval(function(){ for (var dodo,i=0; dodo=dodos[i]; i++) act(dodo) }, 50);
