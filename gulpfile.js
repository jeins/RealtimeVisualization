const gulp = require('gulp'),
    concat = require('gulp-concat'),
    clean = require('gulp-clean'),
    run = require('run-sequence'),
    htmlreplace = require('gulp-html-replace'),
    uglify = require('gulp-uglify'),
    config = require('./public/config')
    ;

const PATHS = {
    js: 'public/src/js/',
    css: 'public/src/css/**.css',
    dist: 'public/dist/',
    index: 'public/src/index.html'
};

gulp.task('components', [
    'merge:js',
    'merge:css',
    'copy:lib_scripts',
    'copy:lib_assets'
]);

gulp.task('run', function(cb){
    run('clean', [
        'index', 'components'
    ], cb);
});

gulp.task('built', function(cb){
    run('clean', [
        'components', 'compress:index', 'compress:js', 'compress:css', 'clean_deploy'
    ], cb);
});

gulp.task('clean', function(){
    return gulp.src(PATHS.dist)
        .pipe(clean({ force: true }));
});

gulp.task('index', function(){
    return gulp.src(PATHS.index)
        .pipe(htmlreplace({
            css: config.libs.styles.concat('app.css'),
            js: config.libs.scripts.concat('app.js')
        }))
        .pipe(gulp.dest(PATHS.dist));
});

gulp.task('copy:lib_scripts', function(){
    config.libs.scripts.forEach(function(data){
        let tmp = data.split('/');
        let library = 'node_modules/' + tmp[1] + '/**/*';

        gulp.src(library).pipe(gulp.dest(PATHS.dist + tmp[1]))
    });

    return;
});

gulp.task('copy:lib_assets', function(){
    config.libs.assets.forEach(function(data){
        let assetPath = data.path.replace('./', 'node_modules/');

        gulp.src(assetPath).pipe(gulp.dest(PATHS.dist + data.dist))
    });

    return;
});

gulp.task('merge:js', function(){
     return gulp.src(config.scripts)
         .pipe(concat('app.js'))
         .pipe(gulp.dest(PATHS.dist));
});

gulp.task('merge:css', function(){
    return gulp.src(PATHS.css)
        .pipe(concat('app.css'))
        .pipe(gulp.dest(PATHS.dist));
});

gulp.task('compress:js', function(){
    return gulp.src(config.libs.scripts.concat('/app.js').map(i => PATHS.dist+ `${i}`))
        .pipe(concat('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(PATHS.dist))
});

gulp.task('compress:css', function(){
    return gulp.src(config.libs.styles.concat('/app.css').map(i => PATHS.dist + `${i}`))
        .pipe(concat('app.min.css'))
        .pipe(uglify())
        .pipe(gulp.dest(PATHS.dist))
});

gulp.task('compress:index', function(){
    return gulp.src(PATHS.index)
        .pipe(htmlreplace({
            css: 'app.min.css',
            js: 'app.min.js'
        }))
        .pipe(gulp.dest(PATHS.dist));
});

gulp.task('clean_deploy', () => {
    return gulp.src([PATHS.dist + 'app.js', PATHS.dist + 'app.css'])
        .pipe(clean({ force: true }));
});