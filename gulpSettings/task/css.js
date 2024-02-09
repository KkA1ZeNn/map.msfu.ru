// Plugins
import gulpPlumber from "gulp-plumber";
import concat from "gulp-concat";
import cssimport from "gulp-cssimport";
import autoprefixer from "gulp-autoprefixer";
import csso from "gulp-csso";
import rename from "gulp-rename";
import size from "gulp-size";
import shorthand from "gulp-shorthand";
import CombineMedia  from "gulp-combine-media";
import webpCss  from "gulp-webp-css";

// processing CSS here you can add your new plugins in stream
const css = () => {
   return $.gulp.src($.path.css.src, { sourcemaps: $.pluginSettings.isDev })
   .pipe(gulpPlumber())
   .pipe(concat("main.css"))
   .pipe(cssimport())
   .pipe(webpCss())
   .pipe(autoprefixer())
   .pipe(shorthand())
   .pipe(CombineMedia())
   .pipe(size())
   .pipe($.gulp.dest($.path.css.dest, { sourcemaps: $.pluginSettings.isDev }))
   .pipe(rename({ suffix: ".min" }))
   .pipe(csso())
   .pipe(size())
   .pipe($.gulp.dest($.path.css.dest, { sourcemaps: $.pluginSettings.isDev }));
}

export { css };