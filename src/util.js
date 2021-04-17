"use strict";

exports.initOption = function (context = {}, templateStruct = {}, option = {}) {
    Object.keys(templateStruct).forEach(k => context[k] = option[k] !== undefined ? option[k] : templateStruct[k]);
}