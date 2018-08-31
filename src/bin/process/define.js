
/**
* 处理合并后的文件。
* 主要完成：
*   替换
*   加上注释头。
*/
module.exports = function (require, packer) {
    var $ = require('$');
    var $String = $.require('String');
    var File = require('File');
    var Path = require('Path');
    var Lines = require('Lines');

    var options = packer.options;


    packer.on('define', function (data) {
        //克隆一下，避免影响原业务。
        data = JSON.stringify(data);
        data = JSON.parse(data);

        //修剪掉主路径，保留相对路径。
        var home = options.home;

        var files = data.files.map(function (file) {
            return Path.relative(home, file);
        });

        var id$mod = data.id$mod;

        Object.keys(id$mod).forEach(function (id) {
            var mod = id$mod[id];
            mod.file = Path.relative(home, mod.file);
        });


        var id$file = data.id$file;

        Object.keys(id$file).forEach(function (id) {
            var file = id$file[id];
            id$file[id] = Path.relative(home, file);
        });



        File.writeJSON(`${home}files.json`, files);
        File.writeJSON(`${home}id$mod.json`, id$mod);
        File.writeJSON(`${home}id$file.json`, id$file);
        File.writeJSON(`${home}dep$ids.json`, data.dep$ids);
    });
};
