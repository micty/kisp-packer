





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
        load('./process/babel.js');

    });




    packer.build({
        'defaults': defaults,
    });


})();


