'use strict';

var url = require('url');

function profile(tags){
    return function(key, includeCommon){
        var profile = key || 'all',
            results = [];

        tags.forEach(function(tag){
            if((tag.profile === undefined && includeCommon !== false) ||
                (tag.profile !== undefined && tag.profile.indexOf(profile) !== -1)){
                results.push(tag.html);
            }
        });
        return results.join('');
    };
}

function renderTags(items, opts){
    var tags = [];
    items.forEach(function(item){
        var external = item.ext !== undefined,
            href = external ? item.ext : item.out;

        if(item.inline === true){
            href = undefined;
        }

        if (href !== undefined){
            if(!/^https?:\/\//.test(href) && href.indexOf('/') !== 0){
                href = '/' + href;
            }
            if(!external){
                href = url.resolve(opts.config.host, href);
            }
        }

        var tag = opts.render(href, item.src);
        tags.push({ html: tag, profile: item.profile });

        (opts.then || function(){})(item, tags);
    });

    return profile(tags);
}

function scriptTags(items, config){
    function then(item, tags){
        if(item.ext !== undefined && item.out !== undefined){
            if(item.test === undefined){
                throw new Error('fallback test is missing');
            }
            var open = ' || document.write(unescape("%3Cscript src=\'',
                close = '\'%3E%3C/script%3E"))',
                it = url.resolve(config.host, item.out),
                code = item.test + open + it + close,
                fallback = '<script>' + code +  '</script>';

            tags.push({ html: fallback, profile: item.profile });
        }
    }

    return renderTags(items, {
        config: config,
        render: function(href, src){
            if(href !== undefined){
                return '<script src="' + href + '"></script>';
            }else if(src !== undefined){
                return '<script>' + src + '</script>';
            }else{
                console.log('WARN: inline script with undefined source omitted.');
                return '';
            }
        },
        then: then
    });
}

function styleTags(items, config){
    return renderTags(items, {
        config: config,
        render: function(href, src){
            if(href !== undefined){
                return '<link rel="stylesheet" href="' + href + '"/>';
            }else if(src !== undefined){
                return '<style>' + src + '</style>';
            }else{
                console.log('WARN: inline style with undefined source omitted.');
                return '';
            }
        }
    });
}

module.exports = {
    styleTags: styleTags,
    scriptTags: scriptTags
};