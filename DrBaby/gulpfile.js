/// <binding BeforeBuild='mergeHtmlTemplates, sass' ProjectOpened='sass:watch, mergeHtmlTemplates:watch' />
/*
This file is the main entry point for defining Gulp tasks and using Gulp plugins.
Click here to learn more. https://go.microsoft.com/fwlink/?LinkId=518007
*/

var del = require('del');
var gulp = require('gulp');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var dest = require('gulp-dest');
var uglify = require('gulp-uglify');

gulp.task('default', ['sass','mergeHtmlTemplates']);

gulp.task('sass', function (done) {
    gulp.src('./Styles/**/*.scss')
        .pipe(concat('application.css'))
        .pipe(sass())
        .on('error', sass.logError)
        .pipe(gulp.dest('./Styles/'))
        .pipe(cleanCSS({
            keepSpecialComments: 0
        }))
        .pipe(rename({ extname: ".min.css" }))
        .pipe(gulp.dest('./Styles/'))
        .on('end', done);
});

gulp.task('sass:watch', function () {
    gulp.watch('./Styles/**/*.scss', ['sass']);
});

function mergeHtmlTemplate(done, sourceIndexFile, destination) {
    gulp.src('./**/*.tmpl.html')
        .pipe(concat('templates.js'))
        .on('data', function (file) {
            gulp.src(sourceIndexFile)
                .pipe(replace("<!-- Template Placeholder -->", file.contents.toString()))
                .pipe(rename("index.html"))
                .pipe(gulp.dest(destination))
                .on('end', done);
        });
}

gulp.task('mergeHtmlTemplates', function (done) {
    mergeHtmlTemplate(done, "./index-template.html", "./");
});

gulp.task('mergeHtmlTemplates:watch', function () {
    gulp.watch('./**/*.tmpl.html', ['mergeHtmlTemplates']);
});

gulp.task("publish", function (done) {
    del('Published').then(() => {
        gulp.src('./Images/**/')
            .pipe(gulp.dest("./Published/Images"));

        gulp.src(['Libraries/**/*min.js', 'Libraries/JSBridge.js', '!Libraries/**/*debug*.js', './Libraries/**/*.css'])
            .pipe(gulp.dest("./Published/Libraries"));

        gulp.src(['./Data/**/*.js', './Model/**/*.js', './Resco/**/*.js', './UI/**/*.js', './application.js'])
            .pipe(concat("drbaby.min.js"))
            .pipe(uglify())
            .pipe(gulp.dest("./Published"));

        mergeHtmlTemplate(function () {
        }, "./index-release.html", "./Published");
    });
});
