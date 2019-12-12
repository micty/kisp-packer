


define('Options', function (require, module, exports) {
   
    var $ = require('$');
    var $Object = $.require('Object');
    var $String = $.require('String');


    function format(sample, data) {

        var max = 100;

        for (var i = 0; i < max; i++) {
            sample = $String.format(sample, data);

            if (!sample.match(/\{.+\}/g)) { //匹配 {key} 这样的字段。
                break;
            }
        }



        return sample;
    }



    return {

        /**
        * 实现填充。
        */
        format: function (config) {
            // item = { keys: ['a', 'b', 'c', ], value: 100, };
            var list = $Object.flat(config);
            var data = {};

            //data = { 'a.b.c': 100, };
            list.forEach(function (item) {
                var key = item.keys.join('.');
                var value = item.value;

                data[key] = value;
            });


            var sample = JSON.stringify(config, null, 4);
            var options = format(sample, data);

            options = JSON.parse(options);

            return options;
        },

    };
   
});
