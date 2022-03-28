// Import
var gulp = require("gulp"),
  del = require("del"),
  ts = require("gulp-typescript");

// config
var tsProject = ts.createProject("tsconfig.json");
var filesToMove = [
  "./src/serverConfig.json",
];

// Tasks
gulp.task("clean-build", function () {
  return del(["./dist"]);
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

// Combined tasks
gulp.task("default", gulp.series("clean-build", "move", "build-ts"));
