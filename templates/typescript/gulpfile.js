var gulp = require('gulp');
var yargs = require('yargs').argv;
var gulpIf = require('gulp-if');
var merge = require('merge-stream');
var del = require('del');
var install = require('gulp-install');
var uglify = require('gulp-uglify');
var stripDebug = require('gulp-strip-debug');
var gulpFilter = require('gulp-filter');
var minifyHtml = require('gulp-minify-html');
var minifyCss = require('gulp-minify-css');
var ts = require('gulp-typescript');
var mocha = require('gulp-mocha');

var tsProject = ts.createProject('tsconfig.json');

gulp.task('build', ['move:src'], function() {
  del(['./build/src/**/**', './build/src',
        './build/tests/**/**', './build/tests'
      ]);

  return gulp.src('build/package.json')
    .pipe(install({
      production: true
    }));
});

gulp.task('move:src', ['copy'], function() {
  // move tests
  var moveTests = gulp.src('./build/tests/**/**')
    .pipe(gulp.dest('./tests'));

  var jsFilter = gulpFilter('**/*.js', { restore: true });
  var htmlFilter = gulpFilter('**/*.html', { restore: true });
  var cssFilter = gulpFilter('**/*.css', { restore: true });<%= sassFilter %>

  return gulp.src('./build/src/**/**')<%= sassPipe %>
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
    .pipe(gulp.dest('./build/public'));
});

gulp.task('copy', function() {
  var js = gulp.src([
    '**/**.ts',
    '!node_modules', '!node_modules/**',
    '!build', '!build/**'
    ], {
      root: './'
    })
    .pipe(ts(tsProject))
    .js
    .pipe(gulpIf(yargs.production, stripDebug()))
    .pipe(gulp.dest('build/'));

  var misc = gulp.src([
    '**/**.*',
    '!**/**.ts',
    '!gulpfile.js',
    '!node_modules', '!node_modules/**',
    '!build', '!build/**',
    '!typings', '!typings/**',
    '!tsd.json', '!tsconfig.json',
    '!build', '!build/**'
    ], {
      root: './'
    })
    .pipe(gulp.dest('build/'));
  return merge(js, misc);
});

gulp.task('watch', function() {
  gulp.watch('**/**.ts', ['move:src'])
});

gulp.task('test', ['build'], function() {
  gulp.src('tests/**/**.js', { read: false })
    .pipe(mocha())
    // .once('error', function () {
    //   process.exit(1);
    // })
    .once('end', function () {
      process.exit();
    });
});