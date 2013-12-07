module.exports = function(grunt) {
    grunt.initConfig({
        concat: {
            css: {
                src: [
                    '_resources/lib/totop/css/ui.totop.css',
                    '_resources/css/*.css'
                ],
                dest: '_build/default.css'
            },
            js: {
                src: [
                    '_resources/lib/anchorify/anchorify.min.js' ,
                    '_resources/lib/totop/js/jquery.ui.totop.min.js',
                    '_resources/js/*.js'
                ],
                dest: '_build/default.js'
            }
        },
        copy: {
            totop: {
                files: [{
                    src: [ '_resources/lib/totop/img/ui.totop.png' ],
                    dest: 'images/totop.png'
                }]
            }
        },
        replace: {
            totop: {
                options: {
                    patterns: [{
                        match: /url\(\.\.\/img\/ui\.totop\.png\)/g,
                        replacement: 'url(/images/totop.png)',
                        expression: true
                    }]
                },
                files: [{
                    src: [ '<%= concat.css.dest %>' ],
                    dest: '<%= concat.css.dest %>'
                }]
            }
        },
        cssmin: {
            default: {
                files: {
                    'assets/default.min.css': [ '<%= concat.css.dest %>' ]
                }
            }
        },
        uglify: {
            default: {
                files: {
                    'assets/default.min.js': [ '<%= concat.js.dest %>' ]
                }
            }
        },
        bower: {
            install: {
                options: {
                    targetDir: './_resources/lib',
                    cleanBowerDir: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-bower-task');

    grunt.registerTask('build', [ 'concat', 'copy', 'replace', 'cssmin', 'uglify' ]);
};
