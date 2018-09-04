

(function () {


    var packer = require('kisp-packer');
    var defaults = require('./config/defaults.js');     //加载用于 new Packer(defaults) 的配置参数。
    var _require = require;


    packer.on('init', function (require, module, exports) {
        var File = require('File');
        var packer = exports.packer;

        function load(file) {
            _require(file)(require, packer);
        }

        load('./process/js.js');
        load('./process/html2js.js');
        load('./process/html.js');
        load('./process/define.js');
        load('./process/concat.js');
        load('./process/minify.js');
        load('./process/jquery.js');
        load('./process/babel.js');

    });



    //拷到其它项目里。
    packer.on('init', function (require, module, exports) {
        var Directory = require('Directory');
        var packer = exports.packer;
        var options = packer.options;

        var dirs = [
            //{
            //    src: `${options.home}`,
            //    dest: `E:/Web/study/htdocs/f/kisp/`,
            //},
        ];


        packer.on('build', function () {

            dirs.forEach(function (item) {
                Directory.delete(item.dest);
                Directory.copy(item.src, item.dest);
            });

        });
    });



    packer.build({
        'defaults': defaults,
    });


})();


