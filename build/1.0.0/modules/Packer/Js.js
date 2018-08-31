


define('Packer/Js', function (require, module, exports) {
   
    var $ = require('$');
    var $Object = $.require('Object');
    var $String = $.require('String');
    var File = require('File');




    return {

        /**
        * 动态替换掉由特殊标记对包裹起来的内容。
        */
        replaceFields: function (content, data) {

            Object.keys(data).forEach(function (key) {
                var value = data[key];
                var begin = `/**{${key}*/`;
                var end = `/**${key}}*/`;

                if (typeof value == 'string') {
                    value = `'${value}'`;
                }

                //这里保留 KISP.edition 的值带有特殊标记，以便在 uglify 阶段进一步处理。
                if (key == 'edition') {
                    value = begin + value + end;
                }

                content = $String.replaceBetween(content, {
                    'begin': begin,     //如 `/**{edition*/`。
                    'end': end,         //如 `/**edition}*/`。
                    'value': value,     //
                });
            });

            return content;

        },

        /**
        * 删除由特殊标记包裹着的代码区域，只保留特定标记内的代码。
        * 只保留 `//<for:sname>...//</for:sname>` 内的代码，其它的全删除。
        */
        removeCodes: function (content, sname) {
            var regexp = /\/\/<for:[\s\S]*?>/g;
            var tags = content.match(regexp);

            if (!tags) {
                return content;
            }


            //去重。
            //如 [ '//<for:mobile>', '//<for:pc>' ];
            tags = [...new Set(tags)]; 
            console.log(tags);


            tags.forEach(function (tag) {
                //如从 `//<for:mobile>` 提取出 `mobile`。
                var name = tag.replace('//<for:', '').replace('>', '');

                if (name == sname) {
                    return;
                }


                var begin = '//<for:' + name + '>'; //如  `//<for:mobile>`
                var end = '//</for:' + name + '>';  //如  `//</for:mobile>`


                while (
                    content.includes(begin) &&
                    content.includes(end)) {

                    content = $String.replaceBetween(content, {
                        'begin': begin,
                        'end': end,
                        'value': '',
                    });
                }
            });


            return content;
        },
        
    };
   
});
