package com.tamina.cow4.model;
@:enum abstract Action(String) from String to String {
    var MOVE="move";
    var FAIL="fail";
    var SUCCESS="success";
}
