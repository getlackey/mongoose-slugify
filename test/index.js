/*jslint node:true, unparam: true, nomen: true */
/*global describe, it, before, after */
'use strict';

var assert = require("assert"),
    mongoose = require('mongoose'),
    mochaMongoose = require('mocha-mongoose'),
    schema = require('../fixtures/schema'),
    slugify = require('../lib'),
    dbURI = 'mongodb://localhost:17017/test',
    Model;

mochaMongoose(dbURI); //clears db at each test

describe('Mongoose Slugify', function () {
    before(function (done) {
        if (mongoose.connection.db) {
            return done();
        }
        mongoose.connect(dbURI, done);
    });


    describe('Basic Usage', function () {
        before(function () {
            var mongoSchema = new mongoose.Schema(schema);

            mongoSchema.plugin(slugify);

            Model = mongoose.model('TestModel', mongoSchema);
        });

        it('should generate a slug', function (done) {
            new Model({
                title: 'My test title'
            }).save(function (err, model) {
                assert.ifError(err);
                assert.equal(model.slug, 'my-test-title');
                done();
            });
        });

        it('should slugify an email', function (done) {
            new Model({
                title: 'test@domain.com'
            }).save(function (err, model) {
                assert.ifError(err);
                assert.equal(model.slug, 'test-at-domain-com');
                done();
            });
        });

        it('should not create duplicates', function (done) {
            new Model({
                title: 'My test title'
            }).save(function (err, model) {
                assert.ifError(err);
                assert.equal(model.slug, 'my-test-title');

                new Model({
                    title: 'My test title'
                }).save(function (err, model) {
                    assert.ifError(err);
                    assert.notEqual(model.slug, 'my-test-title');
                    done();
                });
            });

        });
    });
});