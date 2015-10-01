var gulp = require('gulp');
var yargs = require('yargs').argv;
var gulpIf = require('gulp-if');
var merge = require('merge-stream');
var uglify = require('gulp-uglify');
var stripDebug = require('gulp-strip-debug');
var gulpFilter = require('gulp-filter');
var minifyHtml = require('gulp-minify-html');
var minifyCss = require('gulp-minify-css');
var install = require('gulp-install');
var jeditor = require('gulp-json-editor');
var mocha = require('gulp-mocha');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

gulp.task('default', ['build'], function () { });

gulp.task('build', ['package'], function () {
  if (yargs['skip-build']) {
    return;
  }

  return gulp.src('build/package.json')
    .pipe(install({
      production: true
    }));
});

gulp.task('package', ['browserify', 'copy:client', 'copy:server'], function () {
  if (yargs['skip-build']) {
    return;
  }
  
  
  // Clean up package.json
  // Remove tests, devDependencies, etc.
  return gulp.src('build/package.json')
    .pipe(jeditor(function (json) {
      json.scripts.start = 'node server.js';
      delete json.scripts.test;
      delete json.browserify;
      delete json['browserify-shim'];
      delete json.devDependencies;
      return json;
    }))
    .pipe(gulp.dest('build/'));
})

gulp.task('browserify', function () {
  if (yargs['skip-build']) {
    return;
  }

  var bundle = browserify({
    entries: 'src/react/main.jsx',
    transform: ['reactify', 'browserify-shim']
  });

  return bundle
    .bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(gulpIf(yargs.production, stripDebug()))
    .pipe(gulpIf(yargs.production, uglify()))
    .pipe(gulp.dest('build/public/javascripts/'));
});

gulp.task('copy:client', function () {
  if (yargs['skip-build']) {
    return;
  }

  var jsFilter = gulpFilter('**/*.js', { restore: true });
  var htmlFilter = gulpFilter('**/*.html', { restore: true });
  var cssFilter = gulpFilter('**/*.css', { restore: true }); <%= sassFilter %>

  return gulp.src(['src/**', '!src/react/**', '!src/react']) <%= sassPipe %>
    .pipe(jsFilter)
    .pipe(gulpIf(yargs.production, stripDebug()))
    .pipe(gulpIf(yargs.production, uglify()))
    .pipe(jsFilter.restore)
    .pipe(htmlFilter)
    .pipe(gulpIf(yargs.production, minifyHtml()))
    .pipe(htmlFilter.restore)
    .pipe(cssFilter)
    .pipe(gulpIf(yargs.production, minifyCss()))
    .pipe(cssFilter.restore)
    .pipe(gulp.dest('build/public/'));
});

gulp.task('copy:server', function () {
  if (yargs['skip-build']) {
    return;
  }

  var jsFilter = gulpFilter('**/*.js', { restore: true });

  return gulp.src([
    './**',
    '!src', '!src/**',
    '!gulpfile.js',
    '!node_modules', '!node_modules/**',
    '!build', '!build/**'])
    .pipe(jsFilter)
    .pipe(gulpIf(yargs.production, stripDebug()))
    .pipe(jsFilter.restore)
    .pipe(gulp.dest('build/'));
});

gulp.task('test', ['build'], function () {
  gulp.src('tests/**/**.*', { read: false })
    .pipe(mocha())
    .once('end', function () {
      process.exit();
    });
});