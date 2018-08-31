
/**
* 
*/
define('Packer', function (require, module, exports) {
    var $ = require('$');
    var File = require('File');
    var Emitter = $.require('Emitter');
    var Tasks = $.require('Tasks');

    var Less = require('Less');
    var Path = require('Path');
    var Html = require('Html');
    var Js = require('Js');
    var Lines = require('Lines');

    var Directory = require('Directory');
    var Files = module.require('Files');
    var Modules = module.require('Modules');
    var Refers = module.require('Refers');


    var map = new Map();



    /**
    * 构造器。
    */
    function Packer(options) {

        var meta = {
            'emitter': new Emitter(this),
            'options': options,
            'id$file': {},
        };

        map.set(this, meta);

        this.options = meta.options;  //方便外界可以动态修改。

    }




    //实例方法。
    Packer.prototype = {
        constructor: Packer,
        options: {},

        /**
        * 绑定事件。
        */
        on: function () {
            var meta = map.get(this);
            meta.emitter.on(...arguments);
        },

        /**
        * 复制目录。
        * 会触发 ('copy') 事件，可以利用该事件对文件内容进行转换处理。 
        *   options = {
        *       src: '',    //源目录。
        *       dest: '',   //目标目录。
        *   };
        */
        copy: function (options) {
            var meta = map.get(this);
            var src = options.src;
            var dest = options.dest;

            Directory.delete(dest);
            Directory.copy(src, dest);

            Files.transform(dest, ['**/*'], function (file, content, info) {
                var args = [...arguments];
                var values = meta.emitter.fire('copy', args);

                return values.slice(-1)[0]; //以最后一个值为准。
            });
        },

        /**
        * 处理 js 文件。
        * 会触发 ('js') 事件，可以利用该事件对 js 内容进行转换处理。 
        *   options = {
        *       dir: '',        //所在的目录。
        *       files: [],      //文件模式列表。      
        *   };
        */
        js: function (options) {
            var meta = map.get(this);
            var dir = options.dir;
            var files = options.files;

            Files.transform(dir, files, function (file, content, info) {
                var args = [...arguments];
                var values = meta.emitter.fire('process', 'js', args);

                return values.slice(-1)[0]; //以最后一个值为准。
            });
        },



        /**
        * 把 html 文件转成 js 模块。
        *   options = {
        *       dir: '',        //所在的目录。
        *       files: [],      //文件模式列表。
        *   };
        */
        html2js: function (options) {
            var meta = map.get(this);
            var dir = options.dir;
            var files = options.files;

            Files.transform(dir, files, function (file, content, info) {
                var args = [...arguments];
                var values = meta.emitter.fire('process', 'html2js', args);

                return values.slice(-1)[0]; //以最后一个值为准。
            });

        },

        /**
        * 处理 html 文件。
        *   options = {
        *       dir: '',        //所在的目录。
        *       files: [],      //文件模式列表。
        *   };
        */
        html: function (options) {
            var meta = map.get(this);
            var dir = options.dir;
            var files = options.files;

            Files.transform(dir, files, function (file, content, info) {
                var args = [...arguments];
                var values = meta.emitter.fire('process', 'html', args);

                return values.slice(-1)[0]; //以最后一个值为准。
            });

        },

        /**
        * 自动分析模板的依赖关系，根据种子模块找出所有相关的模块。
        *   options = {
        *       dir: '',        //目录。
        *       files: [],      //文件模式列表。
        *       modules: [],    //要引用的模块的 id 列表。
        *   };
        */
        define: function (options) {
            var meta = map.get(this);

            var files = Files.get(options.dir, options.files);
            var id$mod = Modules.get(files);
            var refers = Refers.get(options.modules, id$mod);

            //在 concat() 里用到。
            meta.id$file = refers.id$file;


            meta.emitter.fire('define', [{
                'files': files,
                'id$mod': id$mod,
                'id$file': refers.id$file,
                'dep$ids': refers.dep$ids,
            }]);

        },

        /**
        * 合并 js 文件。
        * 把固定的文件和分析到的依赖文进行件合并。
        * 合并完成后，触发事件 ('concat')，可以利用此事件对合并后的内容进行转换处理。
        *   options = {
        *       dir: '',        //所在的目录，针对 begins 和 ends 的。
        *       begins: [],     //头部文件列表。
        *       ends: [],       //尾部文件列表。
        *       dest: '',       //输出的目标文件路径。
        *   };
        */
        concat: function (options) {
            var meta = map.get(this);
            var dir = options.dir;
            var dest = options.dest;

            var begins = Files.get(dir, options.begins);
            var ends = Files.get(dir, options.ends);
            var files = Object.values(meta.id$file); //分析依赖关系得到的文件列表。


            var concat = Js.concat(files, {
                'begin': begins,
                'end': ends,
            });

            var content = concat.content;


            //触发事件并尝试用事件的有效返回值作为新的内容。
            var content2 = meta.emitter.fire('concat', [concat.files, content]).slice(-1)[0];

            if (typeof content2 == 'string') {
                content = content2;
            }

            File.write(dest, content);

        },

        /**
        * 压缩 js 文件。
        * 压缩前会触发事件 ('before-minify') 事件，可以利用此事件对 js 内空进行处理。
        *   options = {
        *       src: '',    //源文件。
        *       dest: '',   //目标文件。
        *   };
        */
        minify: function (options) {
            var meta = map.get(this);
            var src = options.src;
            var content = File.read(src);
            var content2 = meta.emitter.fire('before-minify', [src, content]).slice(-1)[0];

            if (typeof content2 == 'string') {
                content = content2;
            }

            Js.minify({
                'content': content,
                'dest': options.dest,
            });

        },


        /**
        * 编译 less 并对 css 内容进行合并。
        */
        less: function (options) {
            var meta = map.get(this);

            var files = Files.get(options.dir, options.files);
            var debug = options.debug;
            var min = options.min;

            if (debug) {
                console.log('编译 less debug 版');
                compile(debug, false);     //debug 版。
            }

            if (min) {
                console.log('编译 less min 版');
                compile(min, true);      //min 版本。
            }


            function compile(dest, minify) {
                Tasks.serial({
                    'list': files,
                    'each': function (file, index, done) {
                        Less.compile({
                            'src': file,
                            'minify': minify,
                            'done': done,
                        });
                    },
                    'all': function (contents) {
                        var content = Lines.join(contents);

                        File.write(dest, content);
                    },
                });
            }

        },
        

        /**
        * 
        */
        build: function () {
            var meta = map.get(this);
            var options = meta.options;

            this.copy(options.copy);
            this.js(options.process.js);
            this.html2js(options.process.html2js);
            this.html(options.process.html);
            this.define(options.define);
            this.concat(options.concat);
            this.minify(options.minify);
            this.less(options.less);

            meta.emitter.fire('build');

        },

    };


    return Packer;



});
