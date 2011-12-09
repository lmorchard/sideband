var AWS_KEY_ID = localStorage.getItem('AWS_KEY_ID'),
    AWS_SECRET_KEY = localStorage.getItem('AWS_SECRET_KEY'),
    test_bucket = 'sideband',
    test_prefix = 'test-data/',
    test_key = test_prefix + 'foobar',
    test_content = 'TEST CONTENT';

var s3_opts = {
    key_id: AWS_KEY_ID,
    secret_key: AWS_SECRET_KEY,
    bucket: 'sideband',
    prefix: test_prefix,
    debug: true
};

test("Exercise AES encryption", function () {
    var password = "wankelrotary",
        cleartext = "Watson, I need you",
        encrypted = GibberishAES.enc(cleartext, password),
        unencrypted = GibberishAES.dec(encrypted, password);
    console.log("CRYPT", encrypted);
    equal(cleartext, unencrypted);
});

asyncTest("Exercise AES encrypted prefs", function () {

    var opts = _.defaults({
            prefix: 'test-data/prefs/'
        }, s3_opts),
        user = 'testuser', 
        pass = 'testpass';

    async.waterfall([

        function (next) {
            var prefs = new Sideband_Prefs(opts);
            prefs.authenticate(user, pass);
            prefs.set({
                fullname: 'Test User',
                location: 'Anytown, USA'
            });
            prefs.store(
                function () {
                    next();
                },
                function () {
                    ok(false, "Fetch failed");
                    next();
                }
            );
        },

        function (next) {
            var prefs = new Sideband_Prefs(opts);
            prefs.authenticate(user, pass);
            prefs.fetch(
                function (data) {
                    equal('Test User', prefs.get('fullname'));
                    equal('Anytown, USA', prefs.get('location'));
                    next();
                },
                function () {
                    ok(false, "Fetch failed");
                    next();
                }
            );
        },

        function (next) {
            var prefs = new Sideband_Prefs(opts);
            prefs.authenticate(user, pass);
            prefs.destroy(
                function () {
                    next();
                },
                function () {
                    ok(false, "Fetch failed");
                    next();
                }
            );
        }

    ], function (err) {
        if (err) { ok(false, err); }
        start();
    });

});

asyncTest("Exercise S3 backbone", function () {

    var sync = new S3Sync(s3_opts).bind();

    // Backbone.sync = sync;
    Activity.prototype.sync = sync;
    ActivityCollection.prototype.sync = sync;

    var activities = new ActivityCollection();

    var a1, a2, a1_read, a2_read;

    async.waterfall([
        function (next) {
            // Create an activity with ActivityCollection.create
            a1 = activities.create({
                actor: { displayName: 'John Doe' },
                object: { url: 'http://example.org/alpha' }
            }, {
                success: function (obj, r) { next(); },
                error: function (c, r) { next('ERROR'); }
            });
        }, function (next) {
            // Create a new Activity and save it.
            a2 = new Activity({
                actor: { displayName: 'Jane Smith' },
                object: { url: 'http://example.org/beta' }
            }, { 
                collection: activities
            });
            a2.save({}, {
                success: function (obj, r) { next(); },
                error: function (c, r) { next('ERROR'); }
            });
        }, function (next) {
            // Try fetching the first activity.
            var activities2 = new ActivityCollection();
            activities2.fetch({
                success: function (coll, recs) {
                    a1_read = activities2.get(a1.id);
                    equal(a1.get('published'), 
                          a1_read.get('published'));
                    equal(a1.get('actor').displayName, 
                          a1_read.get('actor').displayName);
                    next();
                },
                error: function (c, r) { next('ERROR'); }
            });
        }, function (next) {
            // Destroy the first activity.
            a1_read.destroy({
                success: function (m, r) { next(); },
                error: function (c, r) { next('ERROR'); }
            }); 
        }, function (next) {
            // Ensure the first activity is no longer accessible.
            (new ActivityCollection()).fetch({
                success: function (coll, recs) {
                    a1_read2 = coll.get(a1.id);
                    ok(!a1_read2, "Should not have found the object");
                    next();
                },
                error: function (c, r) { next('ERROR'); }
            });
        }, function (next) {
            // Try fetching the second activity.
            a2_read = new Activity(
                { id: a2.id }, 
                { collection: activities }
            );
            a2_read.fetch({
                success: function (coll, recs) {
                    equal(a2.get('published'), 
                          a2_read.get('published'));
                    equal(a2.get('actor').displayName,
                          a2_read.get('actor').displayName);
                    next();
                },
                error: function (c, r) { next('ERROR'); }
            });
        }, function (next) {
            // Finally, delete the secont activity, but we won't bother
            // verifying it's gone.
            a2_read.destroy({
                success: function (m, r) { next(); },
                error: function (c, r) { next('ERROR'); }
            });
        }
    ], function (err) {
        if (err) { ok(false, err); }
        start();
    });

});

asyncTest("Exercise S3Ajax", function () {

    var s3 = new S3Ajax({
        key_id: AWS_KEY_ID,
        secret_key: AWS_SECRET_KEY,
        defeat_cache: true
    });

    async.waterfall([
        function (next) {
            s3.put(test_bucket, test_key, test_content, function (req, obj) {
                next();
            }, function (req, obj) {
                next('ERROR');
            });
        }, function (next) {
            s3.listKeys(test_bucket, {prefix: test_prefix}, function (req, obj) {
                var items = obj.ListBucketResult.Contents,
                    found_it = true;
                for (var i=0,item; item = items[i]; i++) {
                    if (item.key === test_key) {
                        found_it = true;
                    }
                }
                ok(found_it, "Should have found the written key");
                next();
            }, function (req, obj) { next('ERROR'); });
        }, function (next) {
            s3.get(test_bucket, test_key, function (req, obj) {
                var result_content = req.responseText;
                equal(result_content, test_content,
                    "Content fetched from S3 should match expected");
                next();
            }, function (req, obj) { next('ERROR'); });
        }, function (next) {
            s3.deleteKey(test_bucket, test_key, function (req, obj) {
                next();
            }, function (req, obj) { next('ERROR'); });
        }, function (next) {
            s3.get(test_bucket, test_key, function (req, obj) {
                ok(false, "Should not have found the content");
                next('ERROR');
            }, function (req, obj) {
                equal(req.status, 404, "Content should be not found");
                next();
            });
        }
    ], function (err) {
        if (err) { ok(false, err); }
        start();
    });

});
