# WAKjs

A different kind of Javascript library... maybe... sort of.

## What is it?

WAKjs is a very small library (wakjs.js) and framework (wak_precooked.js) to
help with writing common javascript code. Think of it as a templating system
for Javascript.

## What is it for?

There are many actions one might want to perform using javascript that essentially
do the same thing. For instance:

- Click on a tab and show the content while hiding other content
- Click on a menu and show its submenu while hiding other submenus
- Click on a section and expand/show its section while hiding others
- Perform an action for any element matching a selector

The purpose of WAKjs is to turn these actions into modular pieces that can
be automatically applied to appropriate elements.

## How does it work?

Essentially you would setup the following:

- &#127939; Register an action (function that does something) via __registerAction__
- &#128269; Register a reference selector (function that gets HTML elements) via __registerRefSelector__
- &#10004; Apply the action and reference selector to an element and event (click) via __registerEventListener__

You can also register a "wire" function which is used to "autowire" matching elements
via a custom function to an action with appropriate reference selction.

There are a few examples below, but for now to really understand how it operates you should check out the demo code.
Eventually there might be some documentation.

## What state is it in?

>"It's beta" man. - Dude from the 80's

Its sooo <span style="color:blue">&#120631;</span>eta that:

- It might be beta for years
- If you put it in your production environment, well... your an adult (maybe?) take some responsibility for your actions.
- If we say it's in beta version we can ignore all of the complaints with a clean conscious.
- Its a cop-out way of saying it might not ever be improved.

## Simple examples

### Trivial Example *

*you know the kind that is usually useless when you are trying to learn something

Register a function to decorate text of an element. The function is defined inline, but could be a function reference
to existing code.

    WAKjs.registerFunction("textdecor", (elem, type) => {
        if (!elem) return;
        elem.style.textDecoration = type
    });

Define an autowire wire that will add eventListeners to any element with the class textDecoration. The function
to be executed is defined above `textdecor` and the "instruction tape" object (3rd arg in `registerEventListener`)
indicates that the clicked element should be passed as an argument as well as the elements attribute `wak_args` value.

    WAKjs.registerWire("!.textDecoration", (elem, wireID) => {
        if (!$W.isElement(elem)) return;
        elem.wak_id = wireID;
        let textDec = elem.getAttribute("wak_args") ?? "";
        WAKjs.registerEventListener(elem, "click", {paramRefs:[["elem",0],["value",textDec]]}, "textdecor");
    });

A second autowire wire registered to randomly change the color of the text decoration if the element is double clicked.

    WAKjs.registerWire("randomDecColor", (elem, wireID) => {
        if (!$W.isElement(elem)) return;
        elem.wak_id = wireID;
        WAKjs.registerEventListener(elem, "dblclick", {action:() => {
        let textColor = "#" + $W.randomString(6,"0123456789ABCDEF");
            elem.style.textDecorationColor = textColor;
        }});
    });

Note that the `wireID` in the `registerWire` function is not required, but it does ensure that the same function
will be used for all of the wired elements. Otherwise each element will be registered to a unique function.


### wak_precooked "framework"

Using the library (wakjs.js) and the "framework" (wak_precooked.js) you can setup tabbed pages.
The "framework" comes with a generic functionality called an `ABGroup`. Using the `wak_types`
attribute elements are set as _grpA_ or _grpB_. _grpA_ elements are selecting elements, i.e. the tabs,
_grpB_ elements are the pages or content. The *wak_precooked* framework "autowires" the _grpA_ elements
to the `ABGroup` functionality.

    <html>...
        <div wak_type='ABGroup'>
            <div wak_types='grpA' name='t1' class='active'>Tab1</div>
            <div wak_types='grpA' name='t2'>Tab2</div>
            <div wak_types='grpB' name='t1' class='active'>Content for tab 1</div>
            <div wak_types='grpB' name='t2'>Content for tab 2</div>
    ...

When the user clickes on a _grpA_ element it will have the "active" class added to it and all of it's "sibling"
_grpA_ elements will have the "active" class removed. The same thing will then happen for the corresponding
_grpB_ elements.

Currently there are also _BCGroups_ which allow other class names and _XYGroups_ which toggle visiblity.
