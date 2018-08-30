

var HtmlMinifier = require('html-minifier');




define('Packer', function (require, module, exports) {
    var $ = require('$');
    var File = require('File');
    var Emitter = $.require('Emitter');
    
    var Defaults = require('Defaults');
    var Tasks = require('Tasks');
    var Less = require('Less');

    var Directory = require('Directory');
    var Files = module.require('Files');
    var Modules = module.require('Modules');
    var Options = module.require('Options');
    var Refers = module.require('Refers');


    var map = new Map();

   

    /**
    * 构造器。
    */
    function Packer(config) {
        config = Defaults.clone(module.id, config);

        var options = Options.format(config);

        var meta = {
            'emitter': new Emitter(this),
            'options': JSON.parse(options),
            'id$file': [],
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
        * 复制源目录到目标目录。
        * 会触发 ('copy') 事件，可以利用该事件对文件内容进行转换处理。 
        */
        copy: function () {
            var meta = map.get(this);
            var options = meta.options;
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
        * 把 html 文件转成 js 模块。
        */
        html2js: function () {
            var meta = map.get(this);
            var options = meta.options;

            var dir = options.copy.dest;
            var patterns = options.html2js;


            Files.transform(dir, patterns, function (file, content, info) {
                var args = [...arguments];
                var values = meta.emitter.fire('html2js', args);

                return values.slice(-1)[0]; //以最后一个值为准。
            });


        },




        define: function () {
            var meta = map.get(this);
            var emitter = meta.emitter;
            var options = meta.options.define;

            var files = Files.get(options.dir, options.files);
            //File.writeJSON('files.json', files);

            var id$mod = Modules.get(files);
            //File.writeJSON('id$mod.json', id$mod);

            var refers = Refers.get(options.modules, id$mod);
            meta.id$file = refers.id$file;
            meta.dep$ids = refers.dep$ids;


            //File.writeJSON('id$file.json', id$file);

            emitter.fire('define', [{
                'files': files,
                'id$mod': id$mod,
                'id$file': refers.id$file,
                'dep$ids': refers.dep$ids,
            }]);
            
        },

        concat: function () {
            var meta = map.get(this);
            var emitter = meta.emitter;
            var options = meta.options.concat;
            var dir = options.dir;
            var src = options.src;

            var files = Object.values(meta.id$file);

            var index = src.findIndex(function (item) {
                return typeof item != 'string';
            });

            if (index < 0) {
                index = src.length;
                files = [];
            }

            var begins = src.slice(0, index);
            var ends = src.slice(index + 1);

            begins = Files.get(dir, begins);
            ends = Files.get(dir, ends);
            files = begins.concat(files, ends);


            var content = files.map(function (file) {
                return File.read(file);
            }).join('');

            //触发事件并尝试用事件的有效返回值作为新的内容。
            var values = emitter.fire('concat', [files, content]);

            // 非 null 或 undefined，即只要事件中不返回 null 或 undefined 都是合法的值。
            var item = values.reverse().find(function (item) {
                return item != null; 
            });

            if (item != null) {
                content = item;
            }

            File.write(options.dest, content);

        },

        uglify: function () {
            var meta = map.get(this);
            var emitter = meta.emitter;
            var options = meta.options.uglify;
            var src = options.src;
            var dest = options.dest;

            var content = File.read(src);

            //触发事件并尝试用事件的有效返回值作为新的内容。
            var values = emitter.fire('uglify', [src, content]);

            // 非 null 或 undefined，即只要事件中不返回 null 或 undefined 都是合法的值。
            var item = values.reverse().find(function (item) {
                return item != null; 
                });

            if (item != null) {
                content = item;
            }


            var UglifyJS = require('UglifyJS');
            var code = '';


            try{
                //var result = UglifyJS.minify(content, { fromString: true });
                var result = UglifyJS.minify(content);  //针对 es6。
                code = result.code;

                if (!code) {
                    console.log('JS 压缩错误，压缩后的内容为空'.red);
                    console.log(result);
                    File.write('all.error.debug.js', content);
                    throw new Error('JS 压缩错误，压缩后的内容为空');
                }

            }
            catch (ex) {
                console.log('JS 压缩错误'.red);
                console.log(result);
                File.write('all.error.debug.js', content);
                throw ex;
            }


            File.write(dest, code);
        },

        html: function () {
            var meta = map.get(this);
            var options = meta.options.html;
            var minify = options.minify;
            var src = options.src;
            var dest = options.dest;

            var files = Files.get(options.src, options.files);

            files.forEach(function (file) {
                var content = File.read(file);
                content = HtmlMinifier.minify(content, minify);

                file = path.relative(src, file);
                file = path.join(dest, file);
                file = file.replace(/\\/g, '/');

                File.write(file, content);
            });

        },

        /**
        * 编译 less 并对 css 内容进行合并。
        */
        less: function () {

            var meta = map.get(this);
            var options = meta.options.less;

            var modules = Object.keys(meta.id$file).map(function (id) {
                id = id.split('/').join('-');
                return '**/' + id + '.less';
            });

            //var files = Files.get(options.dir, modules);
            var files = Files.get(options.dir, ['**/*.less']);


            function compile(compress, dest) {
                Tasks.serial({
                    'data': files,
                    'each': function (file, index, done) {
                        Less.compile(file, compress, done);
                    },
                    'all': function (values) {
                        var css = values.join('\r\n');
                        var file = options[compress ? 'min' : 'debug'];
                        File.write(dest, css);
                    },
                });
            }

            var debug = options.debug;
            var min = options.min;
            if (debug) {
                console.log('编译 less debug 版');
                compile(false, debug);     //debug 版。
            }
           
            if (min) {
                console.log('编译 less min 版');
                compile(true, min);      //min 版本。
            }

        },

        build: function () {
            var meta = map.get(this);
            var options = meta.options;

            if (options.copy) {
                this.copy();
            }

            //if (options.html2js) {
            //    this.html2js();
            //}

            //if (options.html) {
            //    this.html();
            //}

            //if (options.define) {
            //    this.define();
            //}

            //if (options.concat) {
            //    this.concat();
            //}

            //if (options.uglify) {
            //    this.uglify();
            //}

            //if (options.less) {
            //    this.less();
            //}
           
        },

    };


    return Packer;


   
});
