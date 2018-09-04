


define('Packer/Js', function (require, module, exports) {
   
    var $ = require('$');
    var $Object = $.require('Object');
    var $String = $.require('String');
    var File = require('File');




    return {

        /**
        * ��̬�滻���������Ƕ԰������������ݡ�
        */
        replaceFields: function (content, data) {

            Object.keys(data).forEach(function (key) {
                var value = data[key];
                var begin = `/**{${key}*/`;
                var end = `/**${key}}*/`;

                if (typeof value == 'string') {
                    value = `'${value}'`;
                }

                //���ﱣ�� KISP.edition ��ֵ���������ǣ��Ա��� uglify �׶ν�һ������
                if (key == 'edition') {
                    value = begin + value + end;
                }

                content = $String.replaceBetween(content, {
                    'begin': begin,     //�� `/**{edition*/`��
                    'end': end,         //�� `/**edition}*/`��
                    'value': value,     //
                });
            });

            return content;

        },

        /**
        * ɾ���������ǰ����ŵĴ�������ֻ�����ض�����ڵĴ��롣
        * ֻ���� `//<for:sname>...//</for:sname>` �ڵĴ��룬������ȫɾ����
        */
        removeCodes: function (content, sname) {
            var regexp = /\/\/<for:[\s\S]*?>/g;
            var tags = content.match(regexp);

            if (!tags) {
                return content;
            }


            //ȥ�ء�
            //�� [ '//<for:mobile>', '//<for:pc>' ];
            tags = [...new Set(tags)]; 
            console.log(tags);


            tags.forEach(function (tag) {
                //��� `//<for:mobile>` ��ȡ�� `mobile`��
                var name = tag.replace('//<for:', '').replace('>', '');

                if (name == sname) {
                    return;
                }


                var begin = '//<for:' + name + '>'; //��  `//<for:mobile>`
                var end = '//</for:' + name + '>';  //��  `//</for:mobile>`


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
