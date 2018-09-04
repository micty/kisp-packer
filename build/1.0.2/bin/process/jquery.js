




/**
* 构建完成后，把 jquery 目录复制出来。
*/
module.exports = function (require, packer) {
    var Directory = require('Directory');

    var options = packer.options;



    //构建完成后触发。
    packer.on('build', function () {

        var opt = options.jquery;
        var src = opt.src;
        var dest = opt.dest;

        console.log('复制目录:', src.yellow, '→', dest.yellow);

        Directory.copy(src, dest);

    });
};

