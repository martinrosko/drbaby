/// <binding BeforeBuild='mergeHtmlTemplates, sass' ProjectOpened='sass:watch, mergeHtmlTemplates:watch' />
/*
This file is the main entry point for defining Gulp tasks and using Gulp plugins.
Click here to learn more. https://go.microsoft.com/fwlink/?LinkId=518007
*/

var gulp = require('gulp');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var replace = require('gulp-replace');

gulp.task('default', ['sass']);

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

gulp.task('mergeHtmlTemplates', function (done) {
    gulp.src('./**/*.tmpl.html')
        .pipe(concat('templates.js'))
        .on('data', function (file) {
            gulp.src("./index-template.html")
                .pipe(replace("<!-- Template Placeholder -->", file.contents.toString()))
                .pipe(rename("index.html"))
                .pipe(gulp.dest('./'))
                .on('end', done);
        });
});

gulp.task('mergeHtmlTemplates:watch', function () {
    gulp.watch('./**/*.tmpl.html', ['mergeHtmlTemplates']);
});
