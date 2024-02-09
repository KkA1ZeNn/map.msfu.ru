// Plugins
import gulpPlumber from "gulp-plumber";
import imagemin from "gulp-imagemin";
import newer from "gulp-newer";
import webp from "gulp-webp";
import gulpIf from "gulp-if";

// processing Images here you can add your new plugins in stream
const img = () => {
   return $.gulp.src($.path.img.src)
   .pipe(gulpPlumber())
   .pipe(newer($.path.img.dest))
   .pipe(webp())
   .pipe($.gulp.dest($.path.img.dest))
   .pipe($.gulp.src($.path.img.src))
   .pipe(newer($.path.img.dest))
   .pipe(gulpIf($.pluginSettings.isProd, imagemin($.pluginSettings.imagemin)))
   .pipe($.gulp.dest($.path.img.dest));
}

export { img };