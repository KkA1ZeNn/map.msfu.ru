// Plugins
import gulpPlumber from "gulp-plumber";
import babel from "gulp-babel";
import webpack from "webpack-stream";

const scriptFiles = [
   './src/js/modules/panzoom.min.js',
   './src/js/main.js',
]

// processing JS here you can add your new plugins in stream
const js = () => {
   return $.gulp.src(scriptFiles, { sourcemaps: $.pluginSettings.isDev })
   .pipe(gulpPlumber())
   .pipe(babel())
   .pipe(webpack($.pluginSettings.webpack))
   .pipe($.gulp.dest($.path.js.dest, { sourcemaps: $.pluginSettings.isDev }));
}

export { js };