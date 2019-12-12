
var $ = require('defineJS');

var _require = require;     //node.js 原生的 require，备份一下。
var emitter = null;         //全局的事件管理器。
var events = [];            //待绑定的事件和回调。
var launchArgs = null;      //记录 launch() 执行回调的参数。 如果非空，说明之前已经启动过了。 


module.exports = {

    /**
    * 绑定事件。
    */
    on: function () {
        if (emitter) {
            emitter.on(...arguments);
        }
        else {
            events.push(arguments);
        }
    },



    /**
    * 启动程序。
    * 参数：
    *   factory: fn,    //工厂函数。
    */
    launch: function (factory) {

        //之前已启动过了，直接执行回调。
        if (launchArgs) {
            factory && factory(...launchArgs);
            return;
        }

        //首次启动。
        $.config({
            'base': __dirname,
            'modules': [
                'lib/',
                'modules/',
                'defaults/',
            ],
        });

        $.launch(function (require, module, exports) {
            var Console = require('Console');

            //重写原生的，以让它同时具有输出到文件的功能。
            console.log = Console.log;
            console.error = Console.error;

            Console.config({
                file: 'console.log',
                timestamp: true,
            });


            launchArgs = [...arguments];
            factory && factory(...launchArgs);

        });
    },


    /**
    * 启动和初始化程序，创建一个网站实例。
    * 就绪后会触发 `init` 事件。
    * 参数：
    *   defaults: {},
    *   done: fn,
    */
    create: function (defaults, done) {
        var begin = new Date();

        module.exports.launch(function (require, module, exports) {
            var $ = require('$');
            var Emitter = $.require('Emitter');
            var Packer = require('Packer');
            var Console = require('Console');
            var Options = require('Options');

            defaults = Options.format(defaults);

            var packer = new Packer(defaults);

            //首次创建。
            emitter = new Emitter();

            //把之前积累的事件绑定一下。
            events.forEach(function (args) {
                emitter.on(...args);
            });

            events = [];


            //设置相应模块的默认配置。
            Console.config(defaults.console);


            exports = {
                'packer': packer,
                'begin': begin,
                'emitter': emitter,
            };

            //先让外界有机会提前绑定事件。
            emitter.fire('init', [require, module, exports]);
            done && done(require, module, exports);

        });
    },


    /**
    * 使用常规方式进行构建。
    * 构建完成后，会触发 `done` 事件。
    * 参数：
    *   config = {
    *       defaults: {},
    *   };
    */
    build: function (config) {
        var defaults = config.defaults;


        module.exports.create(defaults, function (require, module, exports) {
            var emitter = exports.emitter;
            var packer = exports.packer;
            var begin = exports.begin;



            //开始构建。
            packer.build();

        });
    },




};



