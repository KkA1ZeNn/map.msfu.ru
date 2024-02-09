// Plugins
import gulpPlumber from "gulp-plumber";
import newer from "gulp-newer";
import fonter from "gulp-fonter";
import ttf2woff2 from "gulp-ttf2woff2";


// processing Fonts, here you can add your new plugins in stream
const font = () => {
   return $.gulp.src($.path.font.src)
   .pipe(gulpPlumber())
   .pipe(newer($.path.font.dest))
   .pipe(fonter($.pluginSettings.fonter))
   .pipe($.gulp.dest($.path.font.dest))
   .pipe(ttf2woff2())
   .pipe($.gulp.dest($.path.font.dest));
}

export { font };