//
//
//
var Sideband_Avatar = function () {
    return this.init.apply(this, arguments);
};
_.extend(Sideband_Avatar.prototype, {
    defaults: {
        email: '',
        size: 64,
        base: 'http://www.gravatar.com/avatar/'
    },
    init: function (options) {
        this.options = _.extend({}, this.defaults, options);
    },
    url: function (size) {
        return this.options.base +
            hex_md5(this.options.email) +
            '?s=' + (size || this.options.size);
    }
});

var Sideband_Views_App = Backbone.View.extend({

    events: {
        'click button.logout': 'logout',
        'click button.installApp': 'installApp',
        'click button.editPrefs': 'editPrefs',
        'click button.destroyPrefs': 'destroyPrefs'
    },
    
    initialize: function (options) {
        this.el = options.el;
        this.prefs = options.prefs;
        this.activities = options.activities;

        this.setupViews();
        this.setupEvents();

        var credentials = localStorage.getItem('credentials');
        if (credentials) {
            this.login_form.onValid({
                data: JSON.parse(credentials)
            });
        }
    },

    setupViews: function () {
        $(document.body).removeClass('logged-in');
        this.login_form = new Sideband_Views_LoginForm({
            parent: this, el: this.$('form.login'),
        });
        this.register_form = new Sideband_Views_RegisterForm({
            parent: this, el: this.$('form.register'),
        });
        this.prefs_form = new Sideband_Views_PrefsForm({
            parent: this, el: this.$('form.prefs'),
        });
        this.activity_form = new Sideband_Views_ActivityForm({
            parent: this, el: this.$('form.activity'),
        });
        this.activities_section = new Sideband_Views_ActivitiesSection({
            parent: this, el: this.$('section.activities'),
        });
    },

    setupEvents: function () {
        var $this = this,
            p = this.prefs,
            login = _.bind(this.login, this);
        _.each({
            'fetch': login,
            'store': login,
            'error:fetch': function () {
                $this.alert("Problem logging in!");
                localStorage.removeItem('credentials');
            },
            'error:store': function () {
                $this.alert("Problem storing prefs!");
            },
            'error:destroy': function () {
                $this.alert("Problem destroying account!");
            }
        }, function (cb, name) { 
            $this.prefs.bind(name, cb); 
        });
    },

    login: function () {
        var $this = this;

        var display_name = this.prefs.get('displayName');
        var avatar = new Sideband_Avatar({ 
            email: this.prefs.get('email')
        });

        $('.global-actions .avatar')
            .find('img')
                .attr('src', avatar.url(24))
                .attr('title', display_name)
            .end()
            .find('.displayName')
                .text(display_name)
            .end();

        this.login_form.reset();
        this.register_form.reset();

        $(document.body).addClass('logged-in');
    },

    logout: function () {
        $(document.body).removeClass('logged-in');
        localStorage.removeItem('credentials');
        this.prefs.reset();
        return false;
    },

    editPrefs: function () {
        this.$('form.prefs').toggleClass('hidden');
        return false;
    },

    destroyPrefs: function (ev) {
        var $this = this;
        if (!window.confirm("Destroy account? Are you sure?")) {
            return false;
        }
        console.dir(this.prefs.data);
        this.prefs.destroy(function () {
            $this.logout();
        });
        return false;
    },

    installApp: function (ev) {
        var $this = this;
        navigator.mozApps.install(
            "app.webapp",
            null,
            function (result) {
                window.alert("Thanks for installing Sideband. Check your App Dashboard!");
            },
            function (result) {
            }
        );
        return false;
    },
    
    alert: function(msg) {
        window.alert(msg);
        console.log("ALERT! " + msg);
    }
});

var Sideband_Views_Form = Backbone.View.extend({
    initialize: function (options) {
        this.parent = options.parent;
        this.prefs = options.parent.prefs;
    },
    reset: function () {
        this.el.find('*[name]').each(function (i, raw) {
            $(raw).val('');
        });
    },
    populate: function (data) {
        this.el.find('*[name]').each(function (i, raw) {
            var field = $(raw),
                name = field.attr('name'),
                type = field.attr('type');
            if (name in data) {
                field.val(data[name]);
            }
        });
    },
    validate: function () {
        var $this = this;
        var rv = {
            is_valid: true,
            errors: {},
            data: {}
        };
        this.el.find('*[name]').each(function (i, raw) {
            var field = $(raw),
                parent = field.parent(),
                name = field.attr('name'),
                type = field.attr('type'),
                value,
                is_valid = true;
            parent.removeClass('error');
            if ('checkbox' == type) {
                value = !!field.attr('checked');
            } else {
                value = field.val();
            }
            if (field.attr('required') && !value) {
                is_valid = false;
            }
            if (field.attr('data-confirm')) {
                var c_name = field.attr('data-confirm'),
                    c_field = $this.el.find('*[name='+c_name+']'),
                    c_value = c_field.val();
                if (c_value !== value) {
                    c_field.parent().addClass('error');
                    is_valid = false;
                }
            }
            if (!is_valid) {
                rv.is_valid = false;
                rv.errors[name] = true;
                parent.addClass('error');
            }
            rv.data[name] = value;
        });
        return rv;
    },
    submit: function (ev) {
        var rv = this.validate();
        if (!rv.is_valid) {
            return this.onError(rv);
        } else {
            return this.onValid(rv);
        }
    },
    onError: function (rv) {
        return false;
    },
    onValid: function (rv) {
        return false;
    }
});

var Sideband_Views_LoginForm = Sideband_Views_Form.extend({
    events: {
        'submit': 'submit',
        'click button.login': 'submit'
    },
    onValid: function (rv) {
        var data = rv.data;
        if (data.remember) {
            localStorage.setItem('credentials', JSON.stringify(data));
        }
        this.prefs.setOptions({
            bucket: data.bucket,
            username: data.username,
            password: data.password
        });
        this.prefs.fetch();
        return false;
    }
});

var Sideband_Views_RegisterForm = Sideband_Views_Form.extend({
    events: {
        'submit': 'submit',
        'click button.register': 'submit'
    },
    onValid: function (rv) {
        var data = rv.data;
        this.prefs.setOptions({
            bucket: data.bucket,
            username: data.username,
            password: data.password,
            key_id: data.key_id,
            secret_key: data.secret_key
        });
        this.prefs.set({
            key_id: data.key_id,
            secret_key: data.secret_key,
            displayName: data.displayName,
            email: data.email,
            url: data.url,
            summary: data.summary
        });
        this.prefs.store();
        return false;
    }
});

var Sideband_Views_PrefsForm = Sideband_Views_Form.extend({
    events: {
        'submit': 'submit',
        'click button.save': 'submit',
        'click button.cancel': 'cancel'
    },
    initialize: function (options) {
        Sideband_Views_Form.prototype.initialize.call(this, options);
        var $this = this;
        var update_self = function () {
            $this.populate($this.prefs.data);
        }
        _.each(['store', 'fetch', 'set'], function (name) {
            $this.prefs.bind(name, update_self);
        });
    },
    cancel: function () {
        this.el.addClass('hidden');
        return false;
    },
    onValid: function (rv) {
        var $this = this,
            data = rv.data;
        this.el.addClass('loading');
        this.prefs.set(data);
        this.prefs.store(function () {
            $this.el
                .removeClass('loading')
                .addClass('hidden');
        });
        return false;
    }
});

var Sideband_Views_ActivityForm = Backbone.View.extend({
    GRAVATAR_BASE: 'http://www.gravatar.com/avatar/',
    GRAVATAR_SIZE: 64,

    events: {
        'submit': 'commit',
        'click button.post': 'commit',
    },
    
    initialize: function (options) {
        this.el = options.el;
        this.parent = options.parent;
        this.activities = this.parent.activities;
    },

    editActivity: function (a) {
        this.activity = a;
        var object = a.get('object');
        this.$('*[name=content]').val(object.content);
    },

    commit: function () {
        var $this = this;
        var prefs = this.parent.prefs;
        var avatar = new Sideband_Avatar({ 
            email: prefs.get('email')
        });
        var data = {
            actor: {
                displayName: prefs.get('displayName'),
                url: prefs.get('url'),
                summary: prefs.get('summary'),
                image: {
                    url: avatar.url(),
                    width: avatar.size,
                    height: avatar.size
                }
            },
            verb: 'post',
            object: {
                type: 'note',
                content: this.$('*[name=content]').val()
            }
        };
        var options = {
            success: function (o, r) {
                $this.reset();
            },
            error: function (o, r) {
                $this.parent.alert("Error posting activity");
            }
        };
        if (!this.activity) {
            this.activities.create(data, options);
        } else {
            this.activity.save(data, options);
        }
        return false;
    },

    reset: function () {
        this.activity = null;
        this.$('*[name=content]').val('');
        return false;
    }

});

var Sideband_Views_ActivitiesSection = Backbone.View.extend({
    events: {
        'click button.refresh': 'refresh'
    },
    
    initialize: function (options) {
        var $this = this;

        this.el = options.el;
        this.parent = options.parent;
        this.activities = this.parent.activities;

        _.each(['all', 'reset', 'add'], function (name) {
            $this.activities.bind(name,
                _($this['activities_'+name]).bind($this));
        });
    },

    refresh: function () {
        this.activities.fetch({ limit: 15 });
    },

    clearActivities: function () {
        this.$('.stream').empty();
    },

    appendActivity: function (activity) {
        var view = new Sideband_Views_Activity({
            parent: this,
            activity: activity
        });
        this.$('.stream').prepend(view.make());
    },

    activities_all: function (ev_name) {
        console.log("LIST EVENT", arguments);
    },

    activities_add: function (activity) {
        this.appendActivity(activity);
    },

    activities_reset: function (collection) {
        var $this = this;
        this.clearActivities();
        collection.each(function (activity) {
            $this.appendActivity(activity);
        });
    }

});

var Sideband_Views_Activity = Backbone.View.extend({
    events: {
        'click .edit': 'edit',
        'click .delete': 'destroy'
    },

    initialize: function (options) {
        var $this = this;
        this.parent = options.parent;
        this.activity = options.activity;
        _(['all', 'change', 'remove']).each(function (name) {
            $this.activity.bind(name,
                _($this['activity_'+name]).bind($this));
        });
    },

    make: function () {
        this.el = $('#activity-template').clone();
        this.el.data('view', this);
        this.render();
        this.delegateEvents();
        return this.el;
    },

    render: function () {
        try {
            var a = this.activity;
            if (!a) { return; }

            this.el.attr('id', 'activity-' + a.get('id'));

            var published = a.get('published');

            this.$('.published')
                .attr('href', a.get('id'))
                .find('time')
                    .attr('datetime', published)
                    .text(published);

            var o = a.get('object');
            this.$('.object')
                .find('.content')
                    .html(o.content)
                .end();

            var i = a.get('actor').image;
            if (i) {
                this.$('.actor')
                    .find('.image')
                        .attr('src', i.url)
                        //.attr('width', i.width)
                        //.attr('height', i.height)
                        ;
            }

            this.el.find('.timeago').timeago();
        } catch (e) {
            console.error(e);
        }

        return this;
    },

    edit: function () {
        var form = this.parent.parent.activity_form;
        form.editActivity(this.activity);
        return false;
    },

    destroy: function () {
        this.activity.destroy();
        return false;
    },

    activity_all: function (ev_name) {
        console.log("ACT EV", arguments);
    },

    activity_change: function (activity) {
        this.render();
    },

    activity_remove: function (activity) { 
        this.el.remove();
    }

});
