// SHOW A MENU
// TABs
// SCROLL SLIDE SHOW
// SCROLL WINDOW TO
// EXPAND DIV

// WINDOW TO TOP/BOTTOM
function wak_actScrollTopOrBottom(height, width) {
    if (!$W.isNumber(height) || !$W.isNumber(width)) return;
    window.scrollby({
        top: height,
        left: width,
        behavior: "smooth"
    });
}


// TOGGLE VISIBLE
function wak_actToggleVisible(elem, displayType) {
    if (!elem) return;
    let displayed = displayType ?? "block";
    if (elem.forEach) {
        elem.forEach((item) => {
            item.style.display = (item.style.display && item.style.display !== "none") ? "none" : displayed;
        });
    } else {
        elem.style.display = (elem.style.display && elem.style.display !== "none") ? "none" : displayed;
    }
}



// TOGGLE CLASS
function wak_actToggleClass(elem, className) {
    if (className  && !$W.isString(className)) return;
    if (elem && elem.classList) {
        elem.classList.toggle(className);
    }
    event.stopPropagation();
}



// ACTIVATE CLASS
function wak_actClassActivate(elem, elems, classOn, classOff) {
    if (classOn  && !$W.isString(classOn)) return;
    if (classOff && !$W.isString(classOff)) return;

    if (elems && elems.forEach) {
        elems.forEach((elemt) => {
            if (!elemt.classList) return;
            elemt.classList.remove(classOn);
            if (classOff) elemt.classList.add(classOff);
        });
    }
    if (elem && elem.classList) {
        if (classOff) elem.classList.remove(classOff)
        elem.classList.add(classOn);
    }
}



//--------------------------------------------------------------------------------
// SELECTORS/REF GETS
//--------------------------------------------------------------------------------


function wak_refGroupMatch(elem, group) {
    if (!$W.isElement(elem)) return;
    let name = elem.getAttribute("name");

    let strQuery = "[wak_types='"+group+"'][name='"  + name + "']";
    let tabContent = $W.nearestRelative(elem, strQuery);
    if (!tabContent) tabContent = elem;
    return [tabContent];
}

function wak_refGroupSiblings(elem, searchType, parentType) {
    if (!$W.isElement(elem)) return [];
    let parent = elem.parentElement;
    let tabSibs = parent.querySelectorAll(":scope > [wak_types='"+searchType+"']");

    if (tabSibs && tabSibs.length > 1) return tabSibs;

    let tabsContainer = parent.closest("[wak_types='"+parentType+"']");
    if (!tabsContainer) return [];
    tabSibs = tabsContainer.querySelectorAll("[wak_types='"+searchType+"']");
    if (tabSibs && tabSibs.length > 0) return tabSibs;
    return [];
}


function wak_refFindBySelector(elem, actionState) {
    if (!$W.isElement(elem) || !$W.isString(selector) || !$W.isBool(all)) return;
    let items = [];
    if (all) {
        items = elem.querySelectorAll(selector);
    } else {
        items = elem.querySelector(selector);
        items = [items];
    }
    return items;
}

WAKjs.registerAction("actToggleVisible", {action:wak_actToggleVisible});
WAKjs.registerAction("actToggleClass",   {action:wak_actToggleClass});
WAKjs.registerAction("actClassActivate", {action:wak_actClassActivate});

WAKjs.registerSelector("findBySelect",     {action:wak_refFindBySelector});
WAKjs.registerSelector("refGroupMatch",    {action:wak_refGroupMatch});
WAKjs.registerSelector("refGroupSiblings", {action:wak_refGroupSiblings, expand:false});

// AUTO WIRES
WAKjs.registerWire("toggleRef", (elem) => {
    if (!$W.isElement(elem)) return;

    WAKjs.registerEventListener(elem,
                                "click",
                                {autoRefTape:"target attrib wak_ref to ref"},
                                "showHideRef",
                                "findBySelect");
});

WAKjs.registerWire("grpA", (elem) => {
    if (!$W.isElement(elem)) return;
    let activeClass = elem.getAttribute("wak_args");
    activeClass = activeClass ?? "active";
    let waktape = [{action: "actClassActivate",
                    paramRefs:[["elem",0],["ref",0],["value",activeClass]],
                    queries:{name:"refGroupSiblings",paramRefs:[["elem",0],["value","grpA"],["value","ABGroup"]]}},
                   {action: "actClassActivate",
                    paramRefs:[["ref",0],["ref",1],["value",activeClass]],
                    queries:[{name:"refGroupMatch", paramRefs:[["elem",0],["value","grpB"]]},
                             {name:"refGroupSiblings",paramRefs:[["ref",0],["value","grpB"],["value","ABGroup"]]},
                             ]},
                  ];
    WAKjs.registerEventListener(elem, "click", waktape);

});


WAKjs.registerWire("grpC", (elem) => {
    if (!$W.isElement(elem)) return;
    let activeClass = elem.getAttribute("wak_args");
    if (!activeClass) {
        let abg = $WUtils.ancestors(elem,"[wak_types='BCGroup']",{single:true});
        if (abg) activeClass = abg.getAttribute("wak_args");
    }
    activeClass = activeClass ?? "active";
    let waktape = [{action: "actClassActivate",
                    paramRefs:[["elem",0],["ref",0],["value",activeClass]],
                    queries:{name:"refGroupSiblings",paramRefs:[["elem",0],["value","grpC"],["value","BCGroup"]]}},
                   {action: "actClassActivate",
                    paramRefs:[["ref",0],["ref",1],["value",activeClass]],
                    queries:[{name:"refGroupMatch", paramRefs:[["elem",0],["value","grpB"]]},
                             {name:"refGroupSiblings",paramRefs:[["ref",0],["value","grpB"],["value","BCGroup"]]},
                             ]},
                  ];
    WAKjs.registerEventListener(elem, "click", waktape);

});


WAKjs.registerWire("grpX", (elem) => {
    if (!$W.isElement(elem)) return;
    let wireArgs = elem.getAttribute("wak_args");
    if (!wireArgs) {
        let abg = $WUtils.ancestors(elem,"[wak_types='XYGroup']",{single:true});
        if (abg) wireArgs = abg.getAttribute("wak_args");
    }
    if(wireArgs) wireArgs = wireArgs.split(",");
    let activeClass = (wireArgs && wireArgs[0]) ? wireArgs[0] : "active";
    let onDisplay   = (wireArgs && wireArgs[1]) ? wireArgs[1] : "block";

    let waktape = [{action: "actClassActivate",
                    paramRefs:[["elem",0],["ref",0],["value",activeClass]],
                    queries:{name:"refGroupSiblings",paramRefs:[["elem",0],["value","grpX"],["value","XYGroup"]]}},
                   {action: "!modElements",
                    paramRefs:[["ref",0],
                               ["value",[{"_style":{style:"display",off:"none",default:""}}]]
                              ],
                    queries:{name:"refGroupSiblings",paramRefs:[["elem",0],["value","grpY"],["value","XYGroup"]]}},
                   {action: "!modElement",
                    paramRefs:[["ref",0],
                               ["value",[{"_style":{style:"display",on:onDisplay,default:""}}]]
                              ],
                    queries:{name:"refGroupMatch", paramRefs:[["elem",0],["value","grpY"]]}},
                  ];
    WAKjs.registerEventListener(elem, "click", waktape);

});


WAKjs.registerWire("!.smenu", (elem) => {
    if (!$W.isElement(elem)) return;
    let waktape = [{action: "actClassActivate",
                    paramRefs:[["ref",0],["ref",1],["value","active"]],
                    autoRefTape:"t p to ref t p p q a li to ref"},
                   {action: "actClassActivate",
                    paramRefs:[["ref",0],["ref",1],["value","active"]],
                    autoRefTape:"t p q ul to ref t p p q a 'li ul' to ref"},
                  ];
    WAKjs.registerEventListener(elem, "click", waktape);

});
