// Plugins
import gulpPlumber from "gulp-plumber";
import autoprefixer from "gulp-autoprefixer";
import csso from "gulp-csso";
import rename from "gulp-rename";
import size from "gulp-size";
import shorthand from "gulp-shorthand";
import CombineMedia  from "gulp-combine-media";
import sass  from "gulp-dart-sass";
import sassGlob  from "gulp-sass-glob";
import webpCss  from "gulp-webp-css";

// processing SCSS here you can add your new plugins in stream
const scss = () => {
   return $.gulp.src($.path.scss.src, { sourcemaps: $.pluginSettings.isDev })
   .pipe(gulpPlumber())
   .pipe(sassGlob())
   .pipe(sass())
   .pipe(webpCss())
   .pipe(autoprefixer())
   .pipe(shorthand())
   .pipe(CombineMedia())
   .pipe(size())
   .pipe($.gulp.dest($.path.scss.dest, { sourcemaps: $.pluginSettings.isDev }))
   .pipe(rename({ suffix: ".min" }))
   .pipe(csso())
   .pipe(size())
   .pipe($.gulp.dest($.path.scss.dest, { sourcemaps: $.pluginSettings.isDev }));
}

export { scss };