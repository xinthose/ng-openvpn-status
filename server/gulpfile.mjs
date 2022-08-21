// Import
import gulp from 'gulp';
import { deleteAsync } from 'del';
import ts from "gulp-typescript";
import nodemon from "gulp-nodemon";

// config
var tsProject = ts.createProject("tsconfig.json");
var filesToMove = [
  "./src/serverConfig.json",
];
var logFile = "C://Users//adamd//Documents//GitHub//ng-openvpn-status//server//log//test.log";

// Tasks
gulp.task("clean-log", function () {
  return deleteAsync([
    logFile
  ]);
});

gulp.task("clean-build", function () {
  return deleteAsync(["./dist"]);
});

gulp.task("move", function () {
  return gulp.src(filesToMove, { base: "./src" })
    .pipe(gulp.dest("dist/"));
});

gulp.task("build-ts", function () {
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest("./dist"));
});

gulp.task("serve", function () {
  gulp.watch([
    "./**/*.ts",
    "./**/*.config",
  ]);

  nodemon("nodemon.json");
});

// Combined tasks
gulp.task("test", gulp.series("clean-log", "serve"));
gulp.task("default", gulp.series("clean-build", "move", "build-ts"));
