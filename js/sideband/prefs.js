var Sideband_Prefs = function () {
    return this.init.apply(this, arguments);
};
_.extend(Sideband_Prefs.prototype, Backbone.Events, {

    defaults: {
        prefix: 'prefs/'
    },

    init: function (options) {
        this.setOptions(options);
        this.reset();
    },

    setOptions: function (options) {
        _.extend(this, this.defaults, options);
        this.options = options;
        this.s3 = new S3Ajax(options);
        this.trigger('options', this, options);
        return this;
    },
    
    authenticate: function (username, password) {
        this.username = username;
        this.password = password;
        this.trigger('authenticate', username, password);
    },

    reset: function () {
        this.data = {};
    },
    
    set: function (o) {
        _.extend(this.data, o);
        this.trigger('set', this, o);
    },
    
    get: function (key, def) {
        var v = this.data[key];
        return _.isUndefined(v) ? def : v;
    },
    
    key: function () {
        return this.prefix + hex_sha1(this.username);
    },
    
    store: function (success, error) {
        var $this = this,
            key = this.key(),
            content = GibberishAES.enc(
                JSON.stringify(this.data),
                this.password
            );
        this.s3.put(
            this.bucket, key, content,
            { content_type: 'text/plain; charset=UTF-8' },
            function () {
                $this.trigger('store', $this);
                success()
            }, 
            function () {
                if (error) { error($this); }
                $this.trigger('error:store', $this);
            }
        );
    },
    
    fetch: function (success, error) {
        var $this = this,
            key = this.key();
        this.s3.get(
            this.bucket, key,
            function (resp, obj) {
                try {
                    var content = GibberishAES.dec(
                        resp.responseText,
                        $this.password
                    );
                    $this.data = JSON.parse(content);
                    $this.setOptions({
                        key_id: $this.get('key_id'),
                        secret_key: $this.get('secret_key')
                    });
                    $this.trigger('fetch', $this);
                    if (success) { success($this.data); }
                } catch (e) {
                    $this.data = {};
                    $this.trigger('error:fetch', $this);
                }
            },
            function () {
                if (error) { error($this); }
                $this.trigger('error:fetch', $this);
            }
        );
    },

    destroy: function (success, error) {
        var $this = this,
            key = this.key();
        this.s3.deleteKey(
            this.bucket, key,
            function () {
                $this.trigger('destroy', this);
                if (success) { success(); }
            }, 
            function () {
                if (error) { error($this); }
                $this.trigger('error:destroy', $this);
            }
        );
    }

});
