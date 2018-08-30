

define('Packer/Files', function (require, module, exports) {

    var $ = require('$');
    var $String = $.require('String');
    var $Object = $.require('Object');

    var Patterns = require('Patterns');
    var Directory = require('Directory');
    var File = require('File');
    var Path = require('Path');
    var MD5 = require('MD5');


    return {

        get: function (dir, list) {

            var files = [];
            var extras = [];

            list.forEach(function (item) {
                if (item.startsWith('&')) {
                    extras.push(item.slice(1));
                }
                else {
                    files.push(item);
                }
            });

            files = Patterns.getFiles(dir, files);
            extras = Patterns.getFiles(dir, extras);
            files = files.concat(extras);

            return files;
        },


        /**
        * 对指定目录内的特定模式下的文件进行内容转换。
        * 已重载 transform(dir, process);
        * 参数：
        *   dir: '',        //要搜索的目标目录。
        *   patterns: [],   //要搜索的模式列表。
        *   process: fn,    //转换处理函数。
        *
        * 转换处理函数 process 的返回结果：
        *   如果返回 null，则删除该文件。
        *   如果返回 undefined 或者不返回，则不进行转换，即以原内容作为结果。
        *   如果返回字符串（包括空串），则以该值作为结果写入该文件中。
        *   如果返回一个对象，则以它为数据、原内容作为模板进行模板填充。
        */
        transform: function (dir, patterns, process) {

            //重载 transform(dir, process);
            if (typeof patterns == 'function') {
                process = patterns;
                patterns = ['**/*'];
            }

            var files = Patterns.getFiles(dest, patterns);

            files.forEach(function (file) {
                var content = File.read(file);
                var ext = Path.ext(file);
                var md5 = MD5.get(content);

                var content2 = process(file, content, {
                    'ext': ext,     //后缀名，包括 `.`， 如 `.js`。
                    'md5': md5,     //内容的 md5 值。
                });

                if (content2 === null) {
                    File.delete(file);
                    return;
                }

                if (typeof content2 == 'object') {
                    content2 = $String.format(content, content2);
                }

                if (typeof content2 == 'string') {
                    File.write(file, content2);
                }


            });
        },


    };
   
});
