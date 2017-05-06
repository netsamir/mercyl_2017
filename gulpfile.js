// 'use strict';

var gulp = require('gulp'),
    pug = require('gulp-pug'),
    del = require('del'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    postcssFlexbugsFixes = require('postcss-flexbugs-fixes'),
    mq4HoverShim = require('mq4-hover-shim'),
    autoprefixer = require('autoprefixer'),
    cssnano = require('gulp-cssnano'),
    uglify = require('gulp-uglify'),
    postcss = require('gulp-postcss'),
    watch = require('gulp-watch'),
    imagemin = require('gulp-imagemin'),
    plumber = require('gulp-plumber'),
    browserSync = require('browser-sync').create();

var port = process.env.PORT || 45123;
var bowerpath = process.env.BOWER_PATH || 'bower_components/';

var js_files = [
  bowerpath + 'jquery/dist/jquery.min.js',
  bowerpath + 'tether/dist/js/tether.min.js',
  bowerpath + 'bootstrap/dist/js/bootstrap.min.js'
]

var css_files = [
  bowerpath + 'tether/dist/css/tether.min.css',
]

var processor = [
  mq4HoverShim.postprocessorFor({ hoverSelectorPrefix: '.bs-true-hover ' }),
  autoprefixer({
    browsers: [
      //
      // Official browser support policy:
      // https://v4-alpha.getbootstrap.com/getting-started/browsers-devices/#supported-browsers
      //
      'Chrome >= 35', // Exact version number here is kinda arbitrary
      // Rather than using Autoprefixer's native "Firefox ESR" version specifier string,
      // we deliberately hardcode the number. This is to avoid unwittingly severely breaking the previous ESR in the event that:
      // (a) we happen to ship a new Bootstrap release soon after the release of a new ESR,
      //     such that folks haven't yet had a reasonable amount of time to upgrade; and
      // (b) the new ESR has unprefixed CSS properties/values whose absence would severely break webpages
      //     (e.g. `box-sizing`, as opposed to `background: linear-gradient(...)`).
      //     Since they've been unprefixed, Autoprefixer will stop prefixing them,
      //     thus causing them to not work in the previous ESR (where the prefixes were required).
      'Firefox >= 38', // Current Firefox Extended Support Release (ESR); https://www.mozilla.org/en-US/firefox/organizations/faq/
      // Note: Edge versions in Autoprefixer & Can I Use refer to the EdgeHTML rendering engine version,
      // NOT the Edge app version shown in Edge's "About" screen.
      // For example, at the time of writing, Edge 20 on an up-to-date system uses EdgeHTML 12.
      // See also https://github.com/Fyrd/caniuse/issues/1928
      'Edge >= 12',
      'Explorer >= 10',
      // Out of leniency, we prefix these 1 version further back than the official policy.
      'iOS >= 8',
      'Safari >= 8',
      // The following remain NOT officially supported, but we're lenient and include their prefixes to avoid severely breaking in them.
      'Android 2.3',
      'Android >= 4',
      'Opera >= 12'
    ]
  }),
  postcssFlexbugsFixes(),
];

// Pre-processing
gulp.task('clean', function(){
  return del(['dist/**/*']);
});

// Copy assets
gulp.task('copy-vendor-js', function(){
  gulp.src(js_files)
    .pipe(gulp.dest('./dist/vendor/js'));
});

gulp.task('copy-vendor-css', function(){
  gulp.src(css_files)
    .pipe(gulp.dest('./dist/vendor/css'));
});

gulp.task('copy-assets', function () {
    return gulp.src(['./src/assets/**/*'])
        .pipe(gulp.dest('./dist'))
    });

gulp.task('compress-img', function(){
  return gulp.src('./src/assets/img/*')
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo({plugins: [{removeViewBox: true}]})
    ]))
    .pipe(gulp.dest('./dist/img'))
});

gulp.task('h5b', function(){
    return gulp.src(['./src/h5b/**/*'])
        .pipe(gulp.dest('./dist'))
});

gulp.task('assets', ['copy-vendor-css', 'copy-vendor-js', 'copy-assets', 'compress-img', 'h5b']);

// JS
gulp.task('js', function(){
  return gulp.src(['./src/js/app.js'])
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./dist/js'))
});

// Sass
var sass_files = ['./src/scss/theme.scss', './src/scss/custom.sass']
gulp.task('sass', function(){
  return gulp.src(sass_files)
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(sass(
            {
              errLogToconsole: true,
              outputStyle: 'expanded',
              includePaths: bowerpath
            }
          ).on('error', sass.logError))
    .pipe(postcss(processor))
    .pipe(cssnano())
    .pipe(rename({suffix: '.min'}))
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest('./dist/css'))
    .pipe(browserSync.stream());
});

// Pug
gulp.task('pug', function(){
  return gulp.src('./src/html/index.pug')
    .pipe(pug())
    .pipe(gulp.dest('./dist'));
});

// Build
gulp.task('build',  ['assets', 'js', 'sass', 'pug'] );

// Watch

gulp.task('watch', function(){
  gulp.watch('./src/scss/**/*', ['sass', browserSync.reload]);
  gulp.watch('./src/js/app.js', ['js', browserSync.reload]);
  gulp.watch('./src/html/**/*', ['pug', browserSync.reload]);
});

// Browser
gulp.task('server', ['build'], function(){
  browserSync.init({
    server: './dist',
    port: port
  });
});

gulp.task('default', ['clean'], function(){
  gulp.start('server', 'watch');
});
