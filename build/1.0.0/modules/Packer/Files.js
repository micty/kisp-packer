

define('Packer/Files', function (require, module, exports) {

    var $ = require('$');
    var $String = $.require('String');
    var $Object = $.require('Object');

    var Patterns = require('Patterns');
    var Directory = require('Directory');
    var File = require('File');
    var Path = require('Path');
    var MD5 = require('MD5');


    return exports = {

        /**
        * ��ȡָ��Ŀ¼��ģʽ���ļ��б�
        * ֧���� `&` ��ͷ���Զ���ģʽ����ʾǿ�Ƽ��ϸ��ļ���
        */
        get: function (dir, list) {

            var files = [];     //��ͨģʽ����ģʽ��ͨ�õġ�
            var extras = [];    //�ռ��� `&` ��ͷ��ģʽ����ģʽ���Զ���ġ�

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

            files = [...files, ...extras];

            return files;
        },


        /**
        * ��ָ��Ŀ¼�ڵ��ض�ģʽ�µ��ļ���������ת����
        * ������ transform(dir, process);
        * ������
        *   dir: '',        //Ҫ������Ŀ��Ŀ¼��
        *   patterns: [],   //Ҫ������ģʽ�б�
        *   process: fn,    //ת����������
        *
        * ת�������� process �ķ��ؽ����
        *   ������� null����ɾ�����ļ���
        *   ������� undefined ���߲����أ��򲻽���ת��������ԭ������Ϊ�����
        *   ��������ַ����������մ��������Ը�ֵ��Ϊ���д����ļ��С�
        *   �������һ������������Ϊ���ݡ�ԭ������Ϊģ�����ģ����䡣
        */
        transform: function (dir, patterns, process) {

            //���� transform(dir, process);
            if (typeof patterns == 'function') {
                process = patterns;
                patterns = ['**/*'];
            }

            var files = Patterns.getFiles(dir, patterns);

            files.forEach(function (file) {
                var content = File.read(file);
                var ext = Path.ext(file);
                var md5 = MD5.get(content);

                var content2 = process(file, content, {
                    'ext': ext,     //��׺�������� `.`�� �� `.js`��
                    'md5': md5,     //���ݵ� md5 ֵ��
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
