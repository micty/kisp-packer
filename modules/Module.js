


define('Module', function (require, module, exports) {
   
    var $ = require('$');
    var File = require('File');
    var Mapper = $.require('Mapper');
    var Emitter = $.require('Emitter');
    var Defaults = require('Defaults');
    var Deps = module.require('Deps');
    var ID = module.require('ID');

    var mapper = new Mapper();




    function Module(config) {

        //重载 Module(file)
        if (typeof config == 'string') {
            config = { 'file': config };
        }

        Mapper.setGuid(this);
        config = Defaults.clone(module.id, config);

        var meta = {
            'id': '',
            'dep$count': {},
            'file': config.file,
        };

        mapper.set(this, meta);
    }


    Module.prototype = {
        constructor: Module,

        parse: function () {
            var meta = mapper.get(this);
            var file = meta.file;

            var content = File.read(file);
            var id = meta.id = ID.get(content);

            if (!id) {
                return;
            }

            if (file.endsWith('KISP.js')) {
                console.log(file.red);
            }

            var dep$count = meta.dep$count;
            var news = Deps.news(content);          //搜索动态绑定的依赖。
            var binds = Deps.binds(content);        //搜索动态绑定的依赖。
            var publics = Deps.publics(content);    //搜索公共模块依赖。
            var privates = Deps.privates(content);  //搜索子模块依赖。

            news.forEach(function (dep) {
                dep$count[dep] = (dep$count[dep] || 0) + 1;
            });

            binds.forEach(function (dep) {
                dep$count[dep] = (dep$count[dep] || 0) + 1;
            });

            publics.forEach(function (dep) {
                dep$count[dep] = (dep$count[dep] || 0) + 1;
            });

            privates.forEach(function (dep) {
                dep = id + '/' + dep;
                dep$count[dep] = (dep$count[dep] || 0) + 1;
            });

            return meta;

        },


    };


    return Module;

});
