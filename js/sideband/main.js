//
//
//

var Sideband_main = {

    init: function () {
        var $this = this;
        this.prefs = new Sideband_Prefs();
        $(document).ready(function () {
            $this.renderMarkdown();
            $this.setupModels();
            $this.setupViews();
            $this.setupFeeds();
            $this.setupEvents();

            console.log("HI");
            console.log(navigator.mozActivities);
            console.log("BYE");

            if ('mozApps' in navigator) {
                $this.setupApp();
            }
        });

        return this;
    },

    setupApp: function () {
        var $this = this;
        return;
        navigator.mozApps.amInstalled(function (data) {
            $this.app_data = data;
            console.log("APP IS INSTALLED");
        });
    },

    renderMarkdown: function () {
        var md = new Showdown.converter();
        $('script[type=markdown]').each(function (i, node) {
            var el = $(node),
                src_url = el.attr('src');
            $.get(src_url, function (md_src) {
                var html_out = md.makeHtml(md_src);
                var new_el = $('<div/>').html(html_out);
                el.before(new_el).remove();
            });
        });
    },

    // Set up data models.
    setupModels: function () {
        var $this = this;

        this.sync = new S3Sync({
            prefix: 'activities/'
        });

        var sync_fn = this.sync.bind();
        Activity.prototype.sync = sync_fn;
        ActivityCollection.prototype.sync = sync_fn;

        this.activities = new ActivityCollection();
    },

    // Set up application views.
    setupViews: function () {
        this.app_view = new Sideband_Views_App({
            el: $('#post-app'),
            prefs: this.prefs,
            activities: this.activities
        });
        window.app_view = this.app_view;
    },

    // Set up feeds for static publishing.
    setupFeeds: function () {
        var $this = this;

        // Build a convenience mapping to feed generator classes.
        var cls = {
            json: Sideband_Feeds_JSON,
            tmpl: Sideband_Feeds_Templated
        };

        // Defaults for each feed generator.
        var def_opts = {
            activities: this.activities,
            defeat_cache: false,
            prefix: ''
        };

        // Feed generator options
        var feed_opts = [
            { type: 'json',
                name: 'feeds/activities.json',
                content_type: 'application/json; charset=UTF-8' },
            { type: 'tmpl',
                name: 'feeds/activities.rss',
                content_type: 'application/rss+xml; charset=UTF-8',
                template: 'templates/activities.rss.tmpl' },
            { type: 'tmpl',
                name: 'feeds/activities.atom',
                content_type: 'application/atom+xml; charset=UTF-8',
                template: 'templates/activities.atom.tmpl' },
            { type: 'tmpl',
                name: 'index.html',
                content_type: 'text/html; charset=UTF-8',
                template: 'templates/index.html.tmpl' }
        ];

        // Build all the static feed generators.
        this.feeds = _.map(feed_opts, function (o) {
            var feed = new cls[o.type](_.defaults(o, def_opts, $this.config));
            return feed;
        });
    },

    // Set up events in reaction to prefs and model changes.
    setupEvents: function () {
        var $this = this;

        // Update options whenever prefs are set or fetched
        var uo = _.bind(this.updateOptions, this);
        _.each(['set', 'store', 'fetch'], function (n) {
            $this.prefs.bind(n, uo);
        });

        // Publish feeds whenever activities are added, changed, or destroyed
        var pf = _.bind(this.publishFeeds, this);
        _.each(['add', 'change', 'destroy'], function (n) {
            $this.activities.bind(n, pf);
        });
    },
    
    // Update options for model sync and feeds.
    updateOptions: function () {
        var $this = this;
        var opts = {
            bucket: $this.prefs.bucket,
            key_id: $this.prefs.get('key_id'),
            secret_key: $this.prefs.get('secret_key'),
            prefix: 'activities/'
        };
        this.sync.setOptions(_.defaults({
            prefix: 'activities/'
        }, opts));
        _.each(this.feeds, function (feed) {
            feed.setOptions(_.defaults({
                prefix: ''
            },opts));
        });
        this.app_view.activities_section.refresh();
    },

    // Publish static feeds.
    publishFeeds: function () {
        _.each(this.feeds, function (f) {
            f.publish();
        });
    },

    EOF:null

}.init();
