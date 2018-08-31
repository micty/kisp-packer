
/**
* 处理合并后的文件。
* 主要完成：
*   加上注释头。
*/
module.exports = function (require, packer) {
    var $ = require('$');
    var $String = $.require('String');
    var $Date = $.require('Date');
    var File = require('File');
    var Path = require('Path');
    var Lines = require('Lines');
    var MD5 = require('MD5');

    var options = packer.options;
    var sample = File.read('./sample/concat.js');


    /**
    * 添加注释头。
    */
    function addHeader(files, content) {
        var total = files.length;
        var dir = options.concat.dir;

        var list = files.map(function (item, index) {
            item = Path.relative(dir, item);

            return '*    ' + item;
        });

        var md5 = MD5.get(content);
        var datetime = $Date.format(new Date(), 'yyyy-MM-dd HH:mm:ss');

        //为避免误填充到 content 中的以下字段，这里先填充模板头部。
        var sample2 = $String.format(sample, {
            'name': options.name,
            'description': options.description,
            'type': options.name,
            'version': options.version,
            'datetime': datetime,
            'md5': md5,
            'count': total - 2,
            'total': total,
            'list': list.join('\n'),
        });


        //再填充内容区。
        content = $String.format(sample2, {
            'content': content,
        });

        return content;
    }


    packer.on('concat', function (files, content) {
        content = addHeader(files, content);


        return content;
    });

};
