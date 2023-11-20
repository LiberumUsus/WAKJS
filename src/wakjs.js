String.prototype.wakwrap = function wrapin(start, end){
    if (!start) return this;
    if (!end) {
        let parts = start.split(" ");
        start = parts[0];
        end   = parts[1];
        if (!end) end = "";
    }
    return start + this + end;
}



String.prototype.wakfirst = function firstOf(chars, offset) {
    if (!chars || !chars.length) return -1;
    if (!offset || typeof offset !== "number") offset = 0;
    for(let j = offset; j < this.length; j++) {
        if (chars.includes(this[j])) return j;
    }
}



// WAKJS UTILITIES
class $WUtils {
    static WAK_APREF   = "wak_";
    static WAK_TYPES   = $WUtils.WAK_APREF + "types";
    static WAK_FUNC    = $WUtils.WAK_APREF + "action";
    static WAK_ARGS    = $WUtils.WAK_APREF + "args"
    static WAK_REFS    = $WUtils.WAK_APREF + "refs"
    static WAK_EVENT   = $WUtils.WAK_APREF + "event"
    static WAK_EVENTID = $WUtils.WAK_APREF + "eventid"

    static isDefined(input)       {return (input !== undefined && input !== null);}
    static isType(input, strType) {return (input !== undefined && typeof input === strType);}
    static isString(input)        {return $WUtils.isType(input, "string")}
    static isBoolean(input)       {return $WUtils.isType(input, "boolean")}
    static isNumber(input)        {return $WUtils.isType(input, "number")}
    static isFunc(input)          {return $WUtils.isType(input, "function")}
    static isObject(input)        {return $WUtils.isType(input, "object")}
    static isArrayEmpty(input)    {return (!$WUtils.isArray(input) || input.length <= 0);}



    static isArray(input, atype) {
        if (!input || !(input instanceof Array)) return false;
        if (!$WUtils.isDefined(atype)) return true;
        if (input.length <= 0) return false;
        if (typeof atype === "object" || typeof atype === "function") {
            return input[0] instanceof atype;
        } else {
            return (typeof input[0] === typeof atype);
        }
    }



    static isElement(input) {
        return (input && (input instanceof Element || input instanceof HTMLDocument || input instanceof Node));
    }



    static isEvent(input) {
        return (input && (input instanceof Event));
    }



    static cloneToArray(inItem) {
        let outArray = [];
        if ($WUtils.isArray(inItem)) {
            inItem.forEach((item) => {
                if (typeof item === "object") {
                    let tmp = {};
                    Object.assign(tmp, item);
                    outArray.push(tmp);
                } else {
                    outArray.push(item);
                }
            });
        } else {
            let tmp = {};
            Object.assign(tmp, inItem);
            outArray.push(tmp);
        }
        return outArray;
    }



    static processElemForWAK(elem) {
        if (!$WUtils.isElement(elem)) return {types:[], funcArgs:[]};
        let pobj = {};
        let typeList = elem.getAttribute($WUtils.WAK_TYPES);
        pobj.types =  typeList ? typeList.split(" ") : [];
        let funcCall = elem.getAttribute($WUtils.WAK_FUNC);
        if (funcCall) {
            let ftmp = $WUtils.strFuncToNameAndParams(funcCall);
            pobj.func = ftmp.refFunc;
            pobj.funcArgs = ftmp.params;
        }
        let funcArgs = elem.getAttribute($WUtils.WAK_ARGS);
        pobj.funcArgs =  funcArgs ? funcArgs.split(",") : (!pobj.funcArgs) ? [] : pobj.funcArgs;

        let funcRefs = elem.getAttribute($WUtils.WAK_REFS);
        if (funcRefs && funcRefs.startsWith("{")) {
            try {
                funcRefs = JSON.parse(funcRefs.replace("'","\""));
            } catch {
                funcRefs = undefined;
            }
        }
        if (funcRefs) pobj.refs = funcRefs;
        let eventType = elem.getAttribute($WUtils.WAK_EVENT);
        if (eventType) pobj.eventType = eventType;
        let eventID = elem.getAttribute($WUtils.WAK_EVENTID);
        if (eventID) pobj.eventID = eventID;

        let tmpjsn = JSON.stringify(pobj);
        pobj.baseid = btoa(JSON.stringify(tmpjsn));

        return pobj;
    }



    static splitWithBoundings(str, splitBy, startBounds, endBounds, anyMatch = 1) {
        if (!startBounds) startBounds = "'\"";
        if (!endBounds)   endBounds   = startBounds;
        if (!$WUtils.isString(splitBy) || !$WUtils.isString(startBounds) || !$WUtils.isString(endBounds)) return splitBy;
        let mindex = 0;
        if (!anyMatch) mindex = -1;
        let inbounds = false;
        let sindex = 0;
        let slen   = splitBy.length;
        let parts = [];
        let j = 0;
        let k = 0;
        for(let i = 0; i < str.length; i++) {
            let chr = str[i];

            if (sindex == slen) {
                let piece = str.substring(j,i-slen);
                if (piece) parts.push(piece);
                j = i;
            }
            if (!inbounds) {
                k = startBounds.indexOf(chr);
                if ( k > -1) inbounds = true;
            } else {
                if ((!anyMatch && endBounds.indexOf(chr) == k) || (anyMatch && endBounds.indexOf(chr) > -1)) {
                    inbounds = (endBounds.indexOf(chr) < 0);
                    continue;
                }
            }

            if (inbounds) {
                sindex = 0;
                continue;
            }
            sindex = (chr == splitBy[sindex]) ? sindex + 1 : 0;
        };
        if (j < str.length) parts.push(str.substring(j));
        return parts;
    }



    static strFuncToNameAndParams(funcDef) {
        if (!$WUtils.isString(funcDef)) return;
        let matches = funcDef.match(/([a-zA-Z]+)([(](.*)[)])?/);
        if (!matches || matches.length <= 1) return {};
        let fparms = {refFunc: undefined, params: []};
        if (matches[1]) fparms.refFunc = matches[1];
        if (matches[3]) fparms.params  = $WUtils.splitWithBoundings(matches[3],",");
        return fparms;
    }



    static cssQueryMatch(strIn, cssQuery, matchStr) {
        switch(cssQuery) {
        case "^":
            return (strIn.startsWith(matchStr));
        case "$":
            return (strIn.endsWith(matchStr));
        case "|":
            return (strIn === matchStr || strIn === matchStr+"-")
        case "*":
            return (strIn.includes(matchStr));
        case "~":
            let words = strIn.split(" ");
            return (words.includes(matchStr))
        default:
            break;
        }
        return false;
    }



    static queryAttribs(elem, query) {
        if (!$WUtils.isElement(elem)) return;
        if (query.startsWith("[")) query = query.substring(1);
        if (query.endsWith("]"))   query = query.substring(0,query.length-1);
        let parts = query.split("=");
        let aando = parts[0].match(/^(.*)([|*~^])$/);
        aando = (!aando) ? [].concat(parts[0]) : [].concat(aando.splice(1));
        if (parts.length == 1) {
            if (aando.length > 1) {
                let atts = [];
                for(let i = 0; i<elem.attributes.length; i++) {
                    let attrib = elem.attributes[i];
                    if ($WUtils.cssQueryMatch(attrib.name,aando[1],aando[0])) atts.push(attrib);
                }
                return atts;
            } else {
                return elem.getAttribute(parts[0]);
            }
        } else {
            let optype = "="
            if (aando.length == 2) optype = aando[1];
            let atts = [];
            for(let i = 0; i<elem.attributes.length; i++) {
                let attrib = elem.attributes[i];
                if (attrib.name !== aando[0]) continue;
                if ($WUtils.cssQueryMatch(attrib.value,aando[1],parts[1])) atts.push(attrib);
            }
            return atts;
        }

    }



    static verifyElemMatchesQuery(elem, query, options) {
        let matches = false;
        if (!$WUtils.isElement(elem) || !elem.tagName) return false;
        if (!$WUtils.isString(query)) return false;
        query = query.trim();
        let tagname = elem.tagName.toLowerCase().trim();
        let i       = -2;
        let iter    = 0;
        while (i && iter < 999999) {
            i = query.wakfirst(".[", i);
            let first = query.substring(0,i);
            let tail  = query.substring(i);
            if (iter == 0 && tagname == first.toLowerCase()) {
                matches = true;
                query = tail;
                i = query.wakfirst(".[", i);
                first = query.substring(0,i);
                tail  = query.substring(i);
            }
            if (!first) first = tail;

            if (first.startsWith(".")) {
                matches = elem.classList.contains(first.substring(1));
            } else if (first.startsWith("[")) {
                matches = false;
                let j = query.wakfirst("]",i);
                if (!j) break;
                let attbparts = query.substring(1,j).split("=");
                if (attbparts.length == 1 && elem.hasAttribute(attbparts[0])) {
                    matches = true;
                    continue;
                }
                let attrib = elem.getAttribute(attbparts[0]);
                if (!attrib) break;
                matches = attrib == attbparts[1].replaceAll("'","");
            }
            if (!matches) break;
            query = tail;
            iter++;
        }
        if (iter == 0 && tagname == query) return true;
        return matches;
    }



    // GET ANCESTORS OF ELEMENT
    // ul.list[name='1']
    static ancestors(elem, match, options) {
        if (!$WUtils.isElement(elem)) return;
        let acount    = Number.MAX_VALUE;
        let ancestors = [];
        let i         = 0;
        if ($WUtils.isNumber(match)) {
            acount = match;
            match = undefined;
        }
        if (!$WUtils.isObject(options)) options = {};
        if (options && $WUtils.isNumber(options.limit)) acount = options.limit;

        if (!$WUtils.isString(match)) return ancestors;

        do {
            if (elem.parentNode) ancestors.push(elem.parentNode);
            if (elem.parentNode && match && $WUtils.verifyElemMatchesQuery(elem.parentNode,match,options)) {
                break;
            }
            i++;
        } while ((elem = elem.parentNode) && i < acount);
        return options.single ? ancestors[ancestors.length-1] : ancestors;
    }



    static commonAncestor(item1, item2) {
        if ($WUtils.isElement(item1)) item1 = $WUtils.ancestors(item1, "html");
        if ($WUtils.isElement(item2)) item2 = $WUtils.ancestors(item2, "html");
        if (!$WUtils.isArray(item1, HTMLElement)) return undefined;
        if (!$WUtils.isArray(item2, HTMLElement)) return undefined;
        let index = 0;
        let common = undefined;
        let item2Length = item2.length;
        if (item1.includes(item2[index])) return {"common":item2[index], "index":index};
        while(!item1.includes(item2[index++])){
            if (index >= item2Length) break;
        }
        common = (item1.includes(item2[index-1])) ? item2[index-1] : undefined;
        return {"common":common, "index":index};
    }



    static nearestRelative(elem, query) {
        if (!$WUtils.isElement(elem) || !$WUtils.isString(query)) return undefined;
        let relative  = undefined;
        let a1s       = $WUtils.ancestors(elem, "body");
        let possibles = document.querySelectorAll(query);
        let compares  = [];
        let nearest   = a1s.length + 1;
        let nearestIndex = -1;
        possibles.forEach((item) => {
            let commons = $WUtils.commonAncestor(a1s, item);
            compares.push(item);
            if (nearest > commons.index) {
                nearest = commons.index;
                nearestIndex = compares.length-1;
            }
        });

        if (nearestIndex > -1) relative = compares[nearestIndex];
        return relative;
    }



    static randomString(length, charSets, baseSet) {
        if(!$W.isNumber(length)) return undefined;
        let alpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let nums  = "012345679";
        let syms  = "!@#$%^&*(){}+?/=[]_`~";
        let chars = "";
        let counter = 0;
        if (!charSets) chars = alpha + nums;
        if ($W.isArray(charSets,"")) chars += charSets.flat().join('');
        if ($W.isString(charSets))   chars += charSets;
        let charsLength = chars.length;
        let randomStr   = "";
        while (counter++ < length) {
            randomStr += chars.charAt(Math.floor(Math.random() * charsLength));
        }
        return randomStr;
    }



    static transMog = {
        strArray: (input) => {
            if ($WUtils.isString(input)) {
                return input.split(" ");
            } else if ($WUtils.isArray(input, "")) {
                return input;
            } else {
                return undefined;
            }
        }
    }



    static replaceChildrenByTemplate(parent, template, data) {
        parent.replaceChildren();
        $WUtils.createElementWithData(template, data, parent, 0);
    }



    static appendChildrenByTemplate(parent, template, data) {
        $WUtils.createElementWithData(template, data, parent, 0);
    }



    static createElementWithData(template, data, inElement, dataIndex) {
        if (typeof template  !== "object") return undefined;
        if (typeof data      !== "object") return undefined;
        if (typeof dataIndex !== "number") return undefined;

        let outElement      = inElement;
        let lastCreated     = outElement;
        let templateIsArray = template instanceof Array;
        let dataIsArray     = data instanceof Array;

        if (!dataIsArray) data = [data];
        if (dataIndex < 0 || dataIndex > data.length) {
            data = [{}];
            dataIndex = 0;
        }

        if (templateIsArray) {
            template.forEach((item) => {
                $WUtils.createElementWithData(item, data, inElement, dataIndex);
            });
            return outElement;
        }

        // ITERATE OVER TEMPLATE
        Object.keys(template).forEach((key) => {
            let tempValue  = template[key];
            let isCmd = key.match(/^(_.)|(._)/);
            if (isCmd) {
                if (key === "_loop") {
                    let templatePart = tempValue;
                    if (tempValue._source && tempValue._template) {
                        templatePart = tempValue._template;
                        data = getVariableValue(tempValue._source,data[dataIndex]);
                    }
                    for(var i = dataIndex; i < data.length; i++) {
                        $WUtils.createElementWithData(templatePart, data, outElement, i);
                    }
                } else if (key === "_ref") {
                    let templateName  = $WUtils.getVariableValue(tempValue,data[dataIndex]);
                    if (!templateName) return;
                    let templateBlock = window[templateName];
                    if (!templateBlock) {
                        let v = templateName.match(/^[a-zA-Z]+$/)[0];
                        if (v) templateBlock = eval(v);
                    }
                    if (templateBlock) {
                        $WUtils.createElementWithData(templateBlock, data, outElement, dataIndex);
                    }
                } else {
                    if (!lastCreated) return undefined;
                    $WUtils.modElement(lastCreated, template, data[dataIndex], dataIndex);
                }
            } else {
                let enumed = key.match(/([a-zA-Z]+)[0-9]+/);
                if (enumed !== null) key = enumed[1];
                let curCreated = $WUtils.createElements(key, true);
                let child      = undefined;
                if (curCreated) {
                    if(!outElement) {
                        outElement = $WUtils.getOldest(curCreated);
                    } else {
                        outElement.appendChild($WUtils.getOldest(curCreated));
                    }
                    lastCreated = curCreated;
                    child       = curCreated;
                    if (typeof tempValue === "object") {
                        child = $WUtils.createElementWithData(tempValue, data, child, dataIndex);
                    }
                }
            }
        });
        return outElement;
    }



    static getVariableValue(variableName, dataObj) {
        let vars = variableName.match(/([$][^$, ]*)/g);
        let value = variableName;
        vars.forEach((v) => {
            let retrievedValue = undefined;
            if (typeof dataObj === "object") {
                retrievedValue = $WUtils.extractFromObj(dataObj, v.substring(1));
            } else if (typeof dataObj === "string") {
                retrievedValue = dataObj;
            }
            if (retrievedValue instanceof Array && vars.length == 1)  {
                value = retrievedValue;
                return;
            }
            // Don't create ridiculous [object Object] text entries
            if (typeof retrievedValue === "object") retrievedValue = undefined;
            value = value.replace(v, (retrievedValue ? retrievedValue : ""));
        });
        return value;
    }



    static getOldest(child) {
        if (child instanceof HTMLElement) {
            let parent = $WUtils.getOldest(child.parentElement);
            return (parent) ? parent : child;
        } else {
            return undefined;
        }
    }


    static modElements(elements, template, data, entryIndex) {
        if(elements instanceof NodeList) elements = Array.from(elements);
        if(!$WUtils.isArray(elements)) return;
        elements.forEach((elem) => {
            $WUtils.modElement(elem, template, data, entryIndex);
        });
    }

    static #replaceStringWithDataVars(strValue, data) {
        let vars = strValue.match(/([$][^$, ]*)/g);
        vars.forEach((v) => {
            let retrievedValue = undefined;
            if (typeof data === "object") {
                retrievedValue = $WUtils.extractFromObj(data, v.substring(1));
            } else if (typeof data === "string") {
                retrievedValue = data;
            }
            // Don't create ridiculous [object Object] text entries
            if (typeof retrievedValue === "object") retrievedValue = undefined;
            strValue = strValue.replace(v, (retrievedValue ? retrievedValue : ""));
        });
        return strValue;
    }

    static #modByObject(elem, attr, value) {
        let current = elem.getAttribute(attr);
        if (attr == "_style") {
            let style  = value.style;
            if (!style) return;
            let off    = value.off;
            let cstyle = elem.style[style];
            if (cstyle === undefined) return;
            if (value.toggle) {
                elem.style[style] = (cstyle == value.on || cstyle == value.default) ? (off ?? "") : value.on;
            } else {
                elem.style[style] = value.on ?? off ?? "";
            }
        } else if (attr == "a_class") {
            if (value.toggle) {
                if (value.off && elem.classList.contains(value.on)) {
                    elem.classList.removeClass(value.on);
                    elem.classList.addClass(value.off);
                } else if (value.off) {
                    elem.classList.addClass(value.on);
                    elem.classList.removeClass(value.off);
                }else {
                    elem.classList.toggle(value.on);
                }
            } else {
                if(value.on)  elem.classList.addClass(value.on);
                if(value.off) elem.classList.removeClass(value.off);
            }
        }
    }


    static modElement(element, template, data, entryIndex) {
        if (typeof template !== "object") return undefined;

        let validSets = ["_text",
                         "_index",
                         "_event",
                         "a_value",
                         "a_type",
                         "a_style",
                         "a_placeholder",
                         "a_class",
                         "a_name",
                         "a_href",
                         "a_id",
                         "_style"];

        if (element instanceof HTMLElement || element instanceof Node) {
            Object.keys(template).forEach((key) => {
                if (validSets.includes(key) || key.startsWith("a_wak_")) {
                    let value = template[key];
                    if ($WUtils.isString(value)) {
                        if (value.includes('$')) {
                            value = $WUtils.#replaceStringWithDataVars(value, data);
                        } else if (value == "_index") {
                            value = entryIndex;
                        } else if (key == "_event") {
                            let matchParts = value.match(/([a-zA-Z]+([:]))?([a-zA-Z]*)/);
                            if (!matchParts) return;
                            let etype = matchParts[1];
                            if (!etype) etype = "click";
                            if (etype) etype = etype.replaceAll(":","");
                            let funcName = matchParts[3];
                            if (!funcName || !window[funcName]) return;
                            if (typeof window[funcName] != "function") return;
                            element.addEventListener(etype, window[funcName]);
                        }
                    }
                    let altKey  = undefined;
                    let origKey = key;
                    if (key.startsWith("a_")) {
                        altKey = key.substring(2);
                        key    = "attr";
                    }
                    value = ("_value" == value) ? data : value;
                    switch(key) {
                    case "_text":
                        // DO NOT CHANGE THIS TO "innerText"
                        element.textContent = value;
                        break;
                    case "_style":
                    case "attr":
                        if (altKey || key == "_style") {
                            if (value !== undefined) {
                                if ($WUtils.isObject(value)) {
                                    $WUtils.#modByObject(element, origKey, value);
                                } else {
                                    element.setAttribute(altKey, value);
                                }
                            } else {
                                element.removeAttribute(altKey);
                            }
                        }
                        break;
                    }
                }
            });
        }
    }



    static createElements(elementChain, returnLastCreated = false) {
        if (typeof elementChain != "string") return undefined;
        let chain       = elementChain.split('.');
        let parent      = undefined;
        let lastCreated = undefined;
        chain.forEach((item) => {
            let curElement = $WUtils.createElement(item);
            if (curElement) {
                if (!parent) {
                    parent = curElement;
                } else {
                    lastCreated.appendChild(curElement);
                }
            } else {
                // ALL OR NOTHING
                return undefined;
            }
            lastCreated = curElement;
        });
        return (returnLastCreated) ? lastCreated : parent;
    }



    static createElement(elementName) {
        let validTags = ["address","article","aside","footer","header","h1","h2","h3","h4","h5","h6","main","nav",
                         "section","blockquote","dd","div","dl","dt","figcaption","figure","hr","li","menu","ol",
                         "p","pre","ul","a","abbr","b","bdi","bdo","br","cite","code","data","dfn","em","i","kbd",
                         "mark","q","rp","rt","ruby","s","samp","small","span","strong","sub","sup","time","u",
                         "var","wbr","caption","col","colgroup","table","tbody","td","tfoot","th","thead","tr"];

        let validControlTags = ["button","datalist","fieldset","form","input","label","legend","meter","optgroup",
                                "option","output","progress","select","textarea"];

        if(validTags.includes(elementName.toLowerCase())) {
            return document.createElement(elementName.toLowerCase());
        }
        if(validControlTags.includes(elementName.toLowerCase())) {
            return document.createElement(elementName.toLowerCase());
        }
        return undefined;
    }



    static extractFromObj(object, nodes) {
        if (typeof nodes === "string") {
            if (nodes.startsWith(".")) nodes = nodes.substring(1);
            nodes = nodes.split(".");
        }
        var key       = nodes[0];
        let bindex    = key.indexOf('[');
        let remaining = (nodes.length > 1) ? nodes.splice(1) : [];
        if (bindex > -1) {
            let newKey = key.replaceAll('[','.').replaceAll(']','');
            newKey     = (newKey.startsWith('.')) ? newKey.substring(1) : newKey;
            let parts  = newKey.split('.');
            key        = parts[0];
            remaining  = parts.splice(1).concat(remaining);
        }

        var value = object[key];
        if (key.startsWith("{")) {
            let keyNum = key.match(/{(\d+)}/)[1];
            if (keyNum) {
                value = object[Object.keys(object)[keyNum]];
            }
        }
        if (value === undefined) return undefined;
        if (remaining.length > 0) {
            return $WUtils.extractFromObj(object[key], remaining);
        }
        return value;
    }

} // END WAKJS UTILITIES






class WAKjs {
    static #_autoWires    = new Map();
    static #_actions      = new Map();
    static #_kFunctions   = new Map();
    static #_actionGroups = new Map();
    static #_refSearchs   = new Map();
    static #_eventFuncMap = new Map();
    static #_eventFuncs   = [];



    static getActionGroup(name) {
        if (!$W.isString(name)) return undefined;
        if (!WAKjs.#_actionGroups.has(name)) return undefined;
        return WAKjs.#_actionGroups.get(name);
    }



    static eventEnable(elem, eventType, enable) {
        if (!$WUtils.isElement(elem) || !$WUtils.isString(eventType)) return;
        let eventEntry = WAKjs.#_eventFuncMap.get(elem.wak_id);
        if (!eventEntry) return;
        if (enable) {
            elem.addEventListener(eventEntry.type, WAKjs.#_eventFuncs[eventEntry.index]);
        } else {
            elem.removeEventListener(eventEntry.type, WAKjs.#_eventFuncs[eventEntry.index]);
        }
        eventEntry.enabled = enable;
        WAKjs.#_eventFuncMap.set(elem.wak_id, eventEntry);
    }



    static eventEnabled(elem, eventType) {
        if (!$WUtils.isElement(elem) || !$WUtils.isString(eventType)) return;
        let eventEntry = WAKjs.#_eventFuncMap.get(elem.wak_id);
        if (!eventEntry) return false;
        return eventEntry.enabled;
    }



    static actionEnable(name, enable) {
        if (!$WUtils.isString(name)) return;
        let actionState = WAKjs.#_actions.get(name);
        if (!actionState) return;
        actionState.enabled = !(!enable);
    }



    static actionEnabled(name) {
        if (!$WUtils.isString(name)) return;
        let actionState = WAKjs.#_actions.get(name);
        if (!actionState) return;
        return !(!actionState.enabled);
    }



    static functionEnable(name, enable) {
        if (!$WUtils.isString(name)) return;
        let functionState = WAKjs.#_kFunctions.get(name);
        if (!functionState) return;
        functionState.enabled = !(!enable);
    }



    static functionEnabled(name) {
        if (!$WUtils.isString(name)) return;
        let functionState = WAKjs.#_kFunctions.get(name);
        if (!functionState) return;
        return !(!functionState.enabled);
    }



    static #processQueries(instruct) {
        if (!instruct.queries && $WUtils.isString(instruct.action)) instruct.queries = instruct.action;
        if (!instruct.queries) return;

        let queryArray = ($WUtils.isArray(instruct.queries)) ? instruct.queries : [instruct.queries];
        instruct.refs  = [];
        queryArray.forEach((query) => {
            let queryObj = $WUtils.isString(query) ? {name: query} : query;
            if (!$WUtils.isObject(queryObj)) return;
            if (!queryObj.name) return;

            let refState = WAKjs.#_refSearchs.get(queryObj.name);
            if (!refState) return;
            refState.refs = [];
            if (!refState.useParamCache) refState.params = undefined;

            refState.refs = instruct.refs;
            // OVERRULE LOCAL SETTINGS
            if (queryObj.paramRefs) refState.paramRefs = queryObj.paramRefs;
            if (queryObj.params)    refState.params    = queryObj.params;


            if (refState.paramRefs)      WAKjs.#collectParams(refState, instruct.elem, instruct.event);
            if (!refState.params)        refState.params = [instruct.event.currentTarget];
            if (!instruct.refs)          instruct.refs = [];
            try {
                let refResult = refState.action(...refState.params);
                if (refState.expand) {
                    instruct.refs = instruct.refs.concat(refResult);
                } else {
                    instruct.refs.push(refResult);
                }
            } catch(err) {
                console.log(err);
            }
        });
    }



    static #processActionState(instruct) {
        let atype = (instruct.actionType && $WUtils.isNumber(instruct.actionType)) ? instruct.actionType : 0;
        instruct.currentAction = {};

        // FUNCTION ALREADY SET
        if ($WUtils.isFunc(instruct.action)) return;

        if ($WUtils.isObject(instruct.action) && $WUtils.isFunc(instruct.action.refFunc)) {
            instruct.action = (instruct.action.enabled) ? instruct.action.refFunc : undefined;
        }

        // GET KEY BASED FUNCTION
        if (!$WUtils.isString(instruct.action)) return;

        // IS UTILS ACTION?
        if (instruct.action.startsWith("!")) {
            if ($WUtils.isFunc($WUtils[instruct.action.substring(1)])) {
                instruct.action = $WUtils[instruct.action.substring(1)];
            } else {
                instruct.action = undefined;
            }
        }

        if (WAKjs.#_kFunctions.has(instruct.action) && (!atype || atype == 1)) {
            let kfunc = WAKjs.#_kFunctions.get(instruct.action);
            instruct.action = (kfunc.enabled) ? kfunc.refFunc : undefined;
        }
        // GET ACTION
        let actionState = WAKjs.#_actions.get(instruct.action);
        if (actionState && (!atype || atype == 2)) {
            instruct.action = (actionState.enabled) ? actionState.action : undefined;
            instruct.currentAction = actionState;
        }
    }



    static #finalizeParams(instruct) {
        let finalParams = [];
        if (instruct.currentAction.passEvent)            finalParams = finalParams.concat(instruct.event);
        if (instruct.currentAction.passElem)             finalParams = finalParams.concat(instruct.elem);
        if (instruct.params)                             finalParams = finalParams.concat(instruct.params);
        if (!instruct.params && instruct.refs)           finalParams = finalParams.concat(instruct.refs);
        if (!instruct.params && finalParams.length == 0) finalParams = finalParams.concat(instruct.elem);
        return finalParams;
    }



    // SIMPLE EVENT FUNCTION
    static #simpleEventFunc = function (evt) {
        let instruct = {results:[]};
        let elem     = evt.currentTarget;
        Object.assign(instruct, this.canister);

        // SET THE EVENT AND ELEMENT
        instruct.event = evt;
        instruct.elem  = elem;

        // GET AND PROCESS THE ACTION
        WAKjs.#processActionState(instruct);
        // NO FUNCTION TO RUN, EXIT
        if (!$WUtils.isFunc(instruct.action)) return;
        // PROCESS REF STATE
        WAKjs.#processQueries(instruct);
        // PROCESS AUTO REFERENCES
        if (instruct.autoRefTape) WAKjs.#processRefTape(instruct, instruct.results);
        // COLLECT PARAMETERS
        if (instruct.paramRefs)WAKjs.#collectParams(instruct, instruct.elem, instruct.event);
        // CREATE FINAL PARAMETER ARRAY
        let finalParams = WAKjs.#finalizeParams(instruct);

        try {
            let result = WAKjs.makeFuncCall(instruct.action, finalParams);
        } catch(err) {
            console.log(err);
        }
    };



    // STANDARD EVENT FUNCTION
    static #standardEventFunc = function (evt) {
        let oneFail = false;
        let wakCan  = this.canister;
        let elem    = evt.currentTarget;
        wakCan.results = [];
        wakCan.forEach((item) => {
            let instruct = {};
            Object.assign(instruct, item);
            // STOP EXECUTING NEXT REEL IF PREVIOUS FAILED
            if (wakCan.stopOnFail && oneFail) return;

            // SET THE EVENT AND ELEMENT
            instruct.event = evt;
            instruct.elem  = elem;

            // GET AND PROCESS THE ACTION
            WAKjs.#processActionState(instruct);
            // NO FUNCTION TO RUN, EXIT
            if (!$WUtils.isFunc(instruct.action)) return;
            // PROCESS REF STATE
            WAKjs.#processQueries(instruct);
            // PERFORM PRECALLS TO REF CALL
            if (instruct.preCalls) {if (!WAKjs.#makePreCalls(instruct)) return;}
            // PROCESS AUTO REFERENCES
            if (instruct.autoRefTape) WAKjs.#processRefTape(instruct, wakCan.results);
            // COLLECT PARAMETERS
            if (instruct.paramRefs)WAKjs.#collectParams(instruct, instruct.elem, instruct.event);
            // CREATE FINAL PARAMETER ARRAY
            let finalParams = WAKjs.#finalizeParams(instruct);

            try {
                let result = WAKjs.makeFuncCall(instruct.action, finalParams);
                wakCan.results.push(result);
            } catch(err) {
                console.log(err);
                oneFail = true;
            }
        });
    };



    // CALL REGISTERED FUNCTION
    static call(name) {
        if (!name) throw("No function");
        if (!WAKjs.#_kFunctions.has(name)) throw("No function");
        let args = Array.from(arguments);
        args  = args.splice(1);
        let cfunc = WAKjs.#_kFunctions.get(name);
        if (!cfunc) throw("Function undefined");
        if (!cfunc.enabled) return;
        return cfunc.refFunc(...args);
    }



    // REGISTER A FUNCTION
    static registerFunction(name, refFunc) {
        if (!$WUtils.isString(name) || !$WUtils.isFunc(refFunc)) return false;
        WAKjs.#_kFunctions.set(name, {"refFunc":refFunc, enabled:true});
        return true;
    }



    // REGISTER AN AUTOWIRE FUNCTION
    static registerWire(name, refFunc) {
        if (!$WUtils.isString(name) || !$WUtils.isFunc(refFunc)) return;
        let id = name + "_" + $WUtils.randomString(10);
        WAKjs.#_autoWires.set(name, {wireID:id, "refFunc":refFunc});
    }



    // REGISTER AN ACTION TEMPLATE FUNCTION
    static registerAction(name, waktion) {
        if (!$WUtils.isString(name) || !$WUtils.isObject(waktion)) return;
        if (waktion.enabled == undefined) waktion.enabled = true;
        WAKjs.#_actions.set(name, waktion);
    }



    // REGISTER A TEMPLATE REFERENCE GETTER
    static registerSelector(name, wakstate) {
        if (!$WUtils.isString(name) || !$WUtils.isObject(wakstate)) return;
        WAKjs.#_refSearchs.set(name, wakstate);
    }



    // CALL PREPROCSSING FUNCTIONS
    static #makePreCalls(waktape) {
        if (!$WUtils.isObject(waktape)) return;
        if ($WUtils.isArrayEmpty(waktape.preCalls)) return;
        let preSequence = waktape.preCallSeq ?? Array.from({length:waktape.preCalls.length}, (e, i) => i);
        if (!$WUtils.isArray(preSequence, 1)) return;
        let success = preSequence.every((index) => {
            let ccall = waktape.preCalls[index];
            let vcall = waktape.verifyCalls[index];
            if (!ccall || !$WUtils.isFunc(ccall)) return true;
            let result = ccall(waktape);
            if (!vcall || !$WUtils.isFunc(vcall)) return true;
            return vcall(result);
        });
        return success;
    }



    // COLLECT PARAMETERS FOR FUNCTION CALL
    static #collectParams(waktape, elem, evt) {
        if ($WUtils.isArrayEmpty(waktape.paramRefs)) return;
        waktape.params = [];
        waktape.paramRefs.forEach((entry) => {
            let values = undefined;
            if (!$WUtils.isArray(entry) || entry.length <= 1) return;
            let type      = entry[0];
            let paramItem = entry[1];
            switch(type) {
            case "f":
            case "function":
                if (!$WUtils.isFunc(paramItem)) return;
                values = paramItem();
                break;
            case "v":
            case "value":
                values = paramItem;
                break;
            case "attrib":
                if (!$WUtils.isElement(elem) || !$WUtils.isString(paramItem)) return;
                values = elem.getAttribute(paramItem);
                break;
            case "event":
                if (!evt || !$WUtils.isString(paramItem)) return;
                let value = $WUtils.extractFromObj(evt, paramItem);
                if (value !== undefined) values = value;
                break;
            case "elem":
                if (!elem) return;
                values = elem;
                break;
            case "ref":
                if (!$WUtils.isArray(waktape.refs) || !$WUtils.isNumber(paramItem)) return;
                if (paramItem < 0) {
                    values = waktape.refs;
                } else {
                    values = waktape.refs[paramItem];
                }

                break;
            case "group":
                if (!$WUtils.isString(paramItem)) return;
                values = $WAKjs.sourceGroups[paramItem];
                break;
            default:
                return;
                break;
            }
            if (values === undefined) return;
            if (!$WUtils.isArray(values)) values = [values];
            waktape.params = waktape.params.concat(values);
        });

    }



    // READ QUERY FOR GATHERING REFERENCES
    static #readQuery(currentSource, atape, i, waktape, tmp, vmap) {
        let querySources = {"elem":waktape.element,
                            "event":waktape.event,
                            "target":waktape.event.target,
                            "document": document,
                            "window":window,
                            "t":waktape.event.target,
                            "e":waktape.element,
                            "v":waktape.event,
                            "d":waktape.document,
                            "w":waktape.window
                           }

        let result = [];
        let selectAll = (atape[i+1] == "a" || atape[i+1] == "all")
        let query     = selectAll ? atape[i+2] : atape[i+1];
        let usedQuery = false;
        switch(atape[i]) {
        case "^":
        case "select":
        case "q":
        case "query":
            usedQuery = true;
            if (query.startsWith("$")) query = vmap[query];
            if (query.startsWith("'")) query = query.substring(1);
            if (query.endsWith("'")) query = query.substring(0,query.length -1);
            if (selectAll) {
                result = currentSource.querySelectorAll(query);
            } else {
                result = currentSource.querySelector(query);
            }
            break;
        case "closest":
            usedQuery = true;
            if (query.startsWith("$")) query = vmap[query];
            result = currentSource.closest(query);
            break;
        case "@":
        case "attrib":
            usedQuery = true;
            result = currentSource.getAttribute ? currentSource.getAttribute(query) : undefined;
            break;
        case "tag":
            usedQuery = true;
            result = currentSource.getElementsByTagName ? currentSource.getElementsByTagName(query) : undefined;
            break;
        case "classname":
            usedQuery = true;
            result = currentSource.getElementsByClassName ? currentSource.getElementsByClassName(query) : undefined;
            break;
        case "s":
        case "sibling":
            result = currentSource.nextElementSibling;
            break;
        case "p":
        case "parent":
            result = currentSource.parentElement;
            break;
        case "child":
            let index = parseInt(query);
            if (isNaN(index)) break;
            usedQuery = true;
            result = currentSource.children[index];
            break;
        default:
            if (atape[i]) currentSource = querySources[atape[i]];
            result = currentSource;
            break;
        }
        i += selectAll ? 1 : 0;
        i += usedQuery ? 1 : 0;
        return [result,i];
    }



    // READ SOURCE PORTION OF REFERENCE GATHERING
    static readSource(atape, i, waktape, tmp, queryResult, prevResults) {
        let source = atape[i++];
        switch(source) {
        case "~":
        case "tmp":
            source = tmp;
            break;
        case "r":
        case "ref":
            source = waktape.refs;
            break;
        case "R":
        case "result":
            source = prevResults;
            break;
        default:
            source = (queryResult && queryResult.length > 0) ? queryResult :undefined;
        }
        if (!source) return [undefined, i];
        let location = parseInt(atape[++i]);
        if (isNaN(location)) return [source, --i];
        return [[source[location]], i];

    }



    // PROCESS REFERENCE GATHERING TAPE
    static #processRefTape(waktape, prevResults) {
        if (!waktape) return;
        let atape = $WUtils.isString(waktape.autoRefTape) ? $WUtils.splitWithBoundings(waktape.autoRefTape, " ") : waktape.autoRefTape;
        if (!$WUtils.isArray(atape)) return;

        let tmp   = [];
        let vmap  = {};
        let queryResult = undefined;
        let source      = undefined;
        let haveSource  = undefined;
        let target      = undefined;
        if (!prevResults) prevResults = [];

        for (var i = 0; i < atape.length; i++) {
            let curOp = undefined;
            let word  = atape[i];
            switch(word) {
            case "2":
            case "to":
                let ttarget = atape[++i];
                switch(ttarget) {
                case "r":
                case "ref":
                    if (!waktape.refs) waktape.refs = [];
                    target = waktape.refs;
                    if (!source) {
                        source = tmp[tmp.length -1];
                        haveSource = true;
                    }
                    break;
                case "~":
                case "tmp":
                    target = tmp;
                    break;
                default:
                    if (ttarget.startsWith("$")) {
                        let tsource = (!source) ? tmp[tmp.length -1] : source;
                        vmap[ttarget] = tsource;
                        tmp.pop();
                        queryResult = tmp[tmp.length-1];
                        source = undefined;
                    } else {
                        target = undefined;
                    }
                    break;
                }
                break;
            case "source":
                [source, i] = WAKjs.readSource(atape, ++i, waktape, tmp, queryResult, prevResults);
                haveSource = true;
                break;
            default:
                haveSource = false;
                let lsource = tmp[tmp.length -1];
                [queryResult,i] = WAKjs.#readQuery(queryResult, atape, i, waktape, tmp, vmap);
                tmp.push(queryResult);
                break;
            }
            if (haveSource && target) {
                target.push(source);
                source = undefined;
            }
        }

    }



    // MAKE A FUNCTION CALL
    static makeFuncCall(func, params) {
        if (!$WUtils.isFunc(func) || !$WUtils.isArray(params)) return;
        return func(...params);
    }



    // VERIFY CALL, TODO: IMPLEMENT
    static #verifyCall(waktape) {
        return;
    }



    // PERFORM CONCLUSION ACTION, TODO: IMPLEMENT
    static #concludeAction(waktape) {
        return;
    }



    static selfRegistrations() {
        WAKjs.registerAction("_actRegisterEventListener", {action: (elem, type, action) => {
            if (!$WUtils.isString(type) || !$WUtils.isString(action)) return;
            let tape    = {};
            if ($WUtils.isString(elem)) tape.autoRefTape = elem;
            let element = $WUtils.isElement(elem) ? elem : WAKjs.#processRefTape(tape);
            if (!element || !element.addEventListener) return;
            let actionFunc = WAKjs.#_actions.get(action);
            if (!$WUtils.isFunc(actionFunc.refFunc)) return;
            element.addEventListener(type,actionFunc.refFunc);
        }});
    }



    // AUTOWIRE ELEMENTS IN DOCUMENT
    static autoWire(node) {
        let qnode    = (node instanceof HTMLElement || node == window || node == document) ? node : document;
        let wakWires = qnode.querySelectorAll("[wak_types]");
        wakWires.forEach((elem) => {
            let typeList = $WUtils.processElemForWAK(elem).types;
            typeList.forEach((wtype) => {
                if (WAKjs.#_autoWires.has(wtype)) {
                    let autoWire = WAKjs.#_autoWires.get(wtype);
                    try {
                        autoWire.refFunc(elem, autoWire.wireID);
                    } catch(err) {
                        console.log("Failed to auto wire:" + elem.tagName + " " + elem.id + " type:" + wtype);
                        console.log(err.message);
                    }
                }
            });
        });
        // ITERATE OVER AUTOWIRES WITH QUERY STRINGS
        let autoWireKeys = WAKjs.#_autoWires.keys();
        let currentKey   = autoWireKeys.next();
        let maxInt       = Number.MAX_VALUE;
        let safeCount    = 0;
        while(!currentKey.done && safeCount++ < maxInt) {
            let query = currentKey.value;
            if (query.startsWith("!")) {
                let items = document.querySelectorAll(query.substring(1));
                items.forEach((item) => {
                    let autoWire = WAKjs.#_autoWires.get(query);
                    try {
                        autoWire.refFunc(item, autoWire.wireID);
                    } catch(err) {
                        console.log("Failed to autowire: " + currentKey + " " +items);
                        console.log(err.message);
                    }
                });
            }
            currentKey = autoWireKeys.next();
        }
        // ALL WAK FUNCS
        let wakFuncRefs = qnode.querySelectorAll($WUtils.WAK_FUNC.wakwrap("[ ]"));
        wakFuncRefs.forEach((elem) => {
            let pobj = $WUtils.processElemForWAK(elem);
            if (!pobj.func) return
            let etype = pobj.eventType ?? "click";
            let waktape = {};
            waktape.action = pobj.func;

            if ($WUtils.isString(waktape.action)) {
                let setF = false;
                if (WAKjs.#_kFunctions.has(waktape.action)) {
                    waktape.action = WAKjs.#_kFunctions.get(waktape.action);
                    setF = true;
                }
                if (!setF && window[waktape.action]) {
                    waktape.action = window[waktape.action];
                }

            }
            if (pobj.refs) {
                waktape.autoRefTape = pobj.refs;
                waktape.paramRefs = [["ref",0]];
            }
            if (pobj.funcArgs) {
                if (!waktape.paramRefs) waktape.paramRefs = [];
                pobj.funcArgs.forEach((item) => {
                    if (item === "this") {
                        waktape.paramRefs.push(["elem",0]);
                    } else if (item.startsWith("@")) {
                        waktape.autoRefTape += " " + item;
                    }
                });
            }
            waktape.eventID = pobj.eventid ?? pobj.baseid;
            WAKjs.registerEventListener(elem, etype, waktape);
        });
    }



    // REGISTER ELEMENT WITH GROUP
    static registerWithGroup(elem, groupName, waktape) {
        if (!elem || !$WUtils.isString(groupName)) return
        if (!$WUtils.isObject(waktape)) return;

        if (waktape.autoRefTape) {
            waktape.element = elem;
            waktape.event = {};
            WAKjs.#processRefTape(waktape, undefined);
        }
        if (waktape.paramRefs) {
            WAKjs.#collectParams(waktape, elem, {});
        } else if (!waktape.params) {
            waktape.params = [].concat(elem);
        }

        if (WAKjs.#_actionGroups.has(groupName)) {
            let groupList = WAKjs.#_actionGroups.get(groupName);
            if (!$WUtils.isArray(groupList)) groupList = [].concat(groupList);
            WAKjs.#_actionGroups.set(groupName, groupList.concat(waktape.params));
        } else {
            WAKjs.#_actionGroups.set(groupName, waktape.params);
        }

    }



    static unregisterEventAction(elem, eventType, actionName) {
        if (!elem || !$WUtils.isString(eventType) || !$WUtils.isString(actionName)) return;
        let actionState = WAKjs.#_actions.get(actionName);
        if (!actionState) return;
        elem.removeEventListener(eventType, actionState.refFunc);
    }



    static #processTapeForEvent(waktape, callArgs) {
        if ($WUtils.isString(waktape)) {
            waktape = {};
            waktape.action   = callArgs[2];
            waktape.queries  = $WUtils.transMog.strArray(callArgs[3]);
        } else if (callArgs.length > 3) {
            waktape.action   = callArgs[3];
            waktape.queries  = $WUtils.transMog.strArray(callArgs[4]);
        }

        let localTape = $WUtils.cloneToArray(waktape);
        let tapeArray = [].concat(localTape);
        let hasAction = (tapeArray[0].action != undefined);
        if (!hasAction && $WUtils.isString(tapeArray[0].action)) hasAction = WAKjs.#_kFunctions.has(tapeArray[0].action);
        if (tapeArray.length <= 0 || !hasAction) return;
        return tapeArray;
    }



    // REGISTER EVENT LISTENER WITH DOCUMENT or ELEMENT
    static registerEventListener(elem, eventType, waktape) {
        if (!elem || !$WUtils.isString(eventType)) return
        if (!$WUtils.isString(waktape) && !($WUtils.isObject(waktape) || $WUtils.isArray(waktape))) return;

        let ufunc   = undefined;
        let findex  = -1;
        let eventID = elem.wak_id;
        if ($WUtils.isString(eventID) && WAKjs.#_eventFuncMap.has(eventID)) {
            let emap = WAKjs.#_eventFuncMap.get(eventID);
            if (emap && $WUtils.isNumber(emap.index)) {
                findex = $WUtils.isFunc(WAKjs.#_eventFuncs[emap.index]) ? emap.index : -1;
            }
        }

        if (findex < 0) {
            let tapeArray = WAKjs.#processTapeForEvent(waktape, arguments);
            if (!tapeArray) return;
            if (tapeArray.length == 1 && !tapeArray[0].preCalls) {
                ufunc = WAKjs.#simpleEventFunc.bind({canister:tapeArray[0]});
            } else {
                ufunc = WAKjs.#standardEventFunc.bind({canister:tapeArray});
            }

            WAKjs.#_eventFuncs.push(ufunc);
            findex = WAKjs.#_eventFuncs.length-1
            if (!eventID) eventID = "!E" + findex;
            WAKjs.#_eventFuncMap.set(eventID, {
                element: elem,
                type:    eventType,
                index:   findex,
                enabled: true
            });
        }

        if (findex >= 0) {
            elem.addEventListener(eventType, WAKjs.#_eventFuncs[findex]);
            elem.wak_id = eventID;
        }
    }

} // END WAKJS CLASS



const $W = $WUtils;


window.addEventListener("DOMContentLoaded", (event) => {
    WAKjs.selfRegistrations();
    WAKjs.autoWire();
});
