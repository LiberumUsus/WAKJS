function toggleEvent(clickElem) {
    let elem = document.querySelector("[wak_action='createNewBox']");
    if (!elem) return;
    let enabled = !WAKjs.eventEnabled(elem, "click");
    WAKjs.eventEnable(elem,"click", enabled);
    clickElem.value = enabled ? "DisableEvent" : "EnableEvent";
}

function getBoxTemplate() {
    return {"div":[{"_text":"$title"},{"a_class":"border border-blue-500 my-2 px-2"},{"a_wak_action":"deleteMe(this)"}]};
}

function deleteMe(elem) {
    if (!elem) return;
    alert("Annoying messages!");
    let p = elem.parentElement;
    p.removeChild(elem);
}

function createNewBox() {
    let cp = document.getElementById("createSpace");
    $W.replaceChildrenByTemplate(cp,getBoxTemplate(),{
        title:"Generated element with autowire"
    });
    WAKjs.autoWire(cp);
}

function callDec(elem) {
    let textdef = elem.previousElementSibling;
    if (textdef.tagName == "INPUT") textdef = textdef.value;
    WAKjs.call("textdecor", elem, textdef);
}

WAKjs.registerFunction("textdecor", (elem, type) => {
    if (!elem) return;
    elem.style.textDecoration = type
});


function getHighlightRef(elem) {
    let name    = elem.getAttribute("name");
    let parent  = elem.closest("[id='highlights']");
    if (!parent) return [];
    let strQuery = "[wak_types='rHighlight'][name='"  + name + "']";
    let wakRefs = parent.querySelector(strQuery);
    return [wakRefs];
}


function dropDownGetRefs(elem) {
    if (!elem) return;
    let parent  = elem.parentElement;
    let submenu = parent.querySelector("[wak_types='dropdown']");
    return [submenu];
}


WAKjs.registerFunction("toggleEnabledFs", (elem) => {
    if (!elem) return;
    elem.value = (elem.value == "Disable") ? "Enable" : "Disable";
    WAKjs.functionEnable("refresh", !WAKjs.functionEnabled("refresh"));
    WAKjs.actionEnable("actToggleClass", !WAKjs.actionEnabled("actToggleClass"));
});


WAKjs.registerAction("hideOnOutside", { passEvent: true, refFunc:(evt) => {
    if (!evt) return;
    let elements = WAKjs.getActionGroup("hideOnOutside");
    let skips    = WAKjs.getActionGroup("skipOnTarget");
    if (!elements || !skips) return;
    let found = skips.every((item) => {
        if (item.contains(evt.target)) return false;
        return true;
    });
    if (!found) return;
    //let action = WAKjs._actions.get("actToggleVisible");
    //if (!action) return;
    //action.refFunc(elements);
    elements.forEach((elem) => {
        elem.style.display = "none";
    });
    WAKjs.unregisterEventAction(document,"click","hideOnOutside");
}});



// REGISTER REFS
WAKjs.registerSelector("highlight", {action:getHighlightRef});
WAKjs.registerSelector("dropdown",  {action:dropDownGetRefs});

WAKjs.registerWire("typeHighlight", (elem,wireID) => {
    if (!$W.isElement(elem)) return;
    let wtape = {paramRefs:[["ref",0],["value","active"]]};
    elem.wak_id = wireID;
    WAKjs.registerEventListener(elem, "click", wtape, "actToggleClass", "highlight");
});

WAKjs.registerWire("!.isection .list-check li", (elem, wireID) => {
    if (!$W.isElement(elem)) return;
    elem.wak_id = wireID;
    let wtape = {paramRefs:[["elem",0],["value","checked"]]};
    WAKjs.registerEventListener(elem, "click", wtape, "actToggleClass");
});


WAKjs.registerWire("!.textDecoration", (elem, wireID) => {
    if (!$W.isElement(elem)) return;
    elem.wak_id = wireID;
    let textDec = elem.getAttribute("wak_args") ?? "";
    WAKjs.registerEventListener(elem, "click", {paramRefs:[["elem",0],["value",textDec]]}, "textdecor");
});

WAKjs.registerWire("randomDecColor", (elem, wireID) => {
    if (!$W.isElement(elem)) return;
    elem.wak_id = wireID;
    WAKjs.registerEventListener(elem, "dblclick", {action:() => {
        let textColor = "#" + $W.randomString(6,"0123456789ABCDEF");
        elem.style.textDecorationColor = textColor;
    }});
});



WAKjs.registerWire("dropdownmenu", (elem, wireID) => {
    if (!$W.isElement(elem)) return;
    elem.wak_id = wireID;
    WAKjs.registerEventListener(elem, "click", [{
        action:"actToggleVisible",
        autoRefTape:"target parent query all [wak_types='dropdown'] to ref",
        paramRefs:[["ref",0],["value","none"]]
    },{
        action:"actToggleVisible",
        autoRefTape:"target child 0 to ref",
        paramRefs:[["ref",0]]
    },{
        action:"_actRegisterEventListener",
        autoRefTape:"document to ref",
        paramRefs:[["ref",0],["value","click"],["value","hideOnOutside"]]
    }]);
    WAKjs.registerWithGroup(elem, "hideOnOutside", {autoRefTape: "elem child 0 to ref", paramRefs:[["ref",0]]});
    WAKjs.registerWithGroup(elem, "skipOnTarget", {});
});
