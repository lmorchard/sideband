//
//
//
var Sideband_Feeds_Base = function () {
    return this.init.apply(this, arguments);
};
_.extend(Sideband_Feeds_Base.prototype, {
    defaults: {
        key_id: '',
        secret_key: '',
        bucket: 'sideband',
        prefix: '',
        debug: true,
        force_fetch: false
    },
    name: 'feed.txt',
    content_type: 'text/plain; charset=UTF-8',
    init: function (options) {
        this.setOptions(options);
    },
    setOptions: function (options) {
        this.options = options;
        this.s3 = new S3Ajax(options);
        _.extend(this, this.defaults, options);
    },
    publish: function (success, error) {
        var $this = this;
        $this.fetch(function (coll, data) {
            var items = coll.chain().last(15).value();
            items.sort(function (a, b) {
                return b.get('published').localeCompare(a.get('published'));
            });
            $this.render(coll, items, function (content) {
                $this.s3.put(
                    $this.bucket, $this.prefix + $this.name, content,
                    { content_type: $this.content_type },
                    success, error
                );
            }, error);
        }, error);
    },
    fetch: function (success, error) {
        if (!this.force_fetch) {
            success(this.activities);
        } else {
            var activities = new ActivityCollection();
            activities.sync = this.activities.sync;
            activities.fetch({limit: 15, success: success, error: error});
        }
    },
    render: function (coll, items, success, error) {
        success('');
    }
});

var Sideband_Feeds_JSON = function () {
    return this.init.apply(this, arguments);
};
_.extend(Sideband_Feeds_JSON.prototype, Sideband_Feeds_Base.prototype, {
    name: 'feeds/activities.json',
    content_type: 'application/json; charset=UTF-8',
    render: function (coll, items, success, error) {
        success(JSON.stringify({ 
            items: items.map(function (item) {
                return item.toJSON();
            }) 
        }));
    }
});

var Sideband_Feeds_Templated = function () {
    return this.init.apply(this, arguments);
};
_.extend(Sideband_Feeds_Templated.prototype, Sideband_Feeds_Base.prototype, {
    template: 'templates/activities.rss.tmpl',
    init: function (options) {
        Sideband_Feeds_Base.prototype.init.call(this, options);
        var $this = this;
        this.s3.get(
            this.bucket, this.template,
            function (resp, obj) {
                $this.template_compiled = _.template(resp.responseText);
            }
        );
    },
    render: function (coll, items, success, error) {
        success(this.template_compiled({ items: items }));
    }
});
